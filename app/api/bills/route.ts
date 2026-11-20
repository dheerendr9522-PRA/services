import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, bills, notifications, payments, products, syncLogs } from "@/db/schema";
import { canManage, getStaffSession } from "@/lib/auth";
import { autoSyncRow } from "@/lib/sheets";

export const dynamic = "force-dynamic";

type Item = { name: string; sku: string; description: string; qty: number; price: number; discount: number; tax: number };

function compute(items: Item[], discount: number, tax: number, amountPaid: number, gst?: { enabled: boolean; rate: number; type: string }) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0) - Number(item.discount || 0), 0);
  const itemTax = items.reduce((sum, item) => sum + Number(item.tax || 0), 0);
  const taxable = Math.max(0, subtotal - Number(discount || 0));
  const gstAmount = gst?.enabled ? Math.round((taxable * gst.rate) / 100) : 0;
  const cgst = gst?.enabled && gst.type !== "IGST" ? Math.round(gstAmount / 2) : 0;
  const sgst = gst?.enabled && gst.type !== "IGST" ? gstAmount - cgst : 0;
  const igst = gst?.enabled && gst.type === "IGST" ? gstAmount : 0;
  const grandTotal = Math.max(0, taxable + itemTax + Number(tax || 0) + gstAmount);
  return { subtotal, grandTotal, gstAmount, cgst, sgst, igst, balanceDue: Math.max(0, grandTotal - Number(amountPaid || 0)) };
}

export async function GET() {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });
  const rows = await db.select().from(bills).orderBy(desc(bills.createdAt)).limit(300);
  return NextResponse.json({ ok: true, rows });
}

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ ok: false, error: "अनुमति नहीं" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const items = (Array.isArray(body.items) ? body.items : []).map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      name: String(item.name ?? "आइटम"),
      sku: String(item.sku ?? ""),
      description: String(item.description ?? ""),
      qty: Number(item.qty ?? 1) || 1,
      price: Number(item.price ?? 0) || 0,
      discount: Number(item.discount ?? 0) || 0,
      tax: Number(item.tax ?? 0) || 0,
    };
  }) as Item[];

  if (!items.length) return NextResponse.json({ ok: false, error: "कम से कम एक आइटम जोड़ें" }, { status: 400 });
  const customerName = String(body.customerName ?? "").trim();
  if (!customerName) return NextResponse.json({ ok: false, error: "ग्राहक का नाम आवश्यक है" }, { status: 400 });

  const discount = Number(body.discount ?? 0) || 0;
  const tax = Number(body.tax ?? 0) || 0;
  const amountPaid = Number(body.amountPaid ?? 0) || 0;
  const gst = { enabled: Boolean(body.gstEnabled), rate: Number(body.gstRate ?? 18) || 0, type: String(body.gstType ?? "CGST_SGST") };
  const totals = compute(items, discount, tax, amountPaid, gst);
  const status = amountPaid <= 0 ? "Unpaid" : amountPaid >= totals.grandTotal ? "Paid" : "Partially Paid";
  const offlineKey = String(body.offlineKey ?? "");

  if (offlineKey) {
    const existing = await db.select().from(bills).where(eq(bills.offlineKey, offlineKey)).limit(1);
    if (existing[0]) return NextResponse.json({ ok: true, bill: existing[0], duplicate: true });
  }

  const countRows = await db.select({ value: sql<number>`count(*)::int` }).from(bills);
  const nextNumber = 1000 + Number(countRows[0]?.value ?? 0) + 1;
  const billNo = String(body.billNo ?? "").trim() || `BILL-${nextNumber}`;

  const inserted = await db
    .insert(bills)
    .values({
      billNo,
      customerName,
      mobile: String(body.mobile ?? ""),
      address: String(body.address ?? ""),
      email: String(body.email ?? ""),
      staffName: String(body.staffName ?? session.name),
      items,
      subtotal: totals.subtotal,
      discount,
      tax,
      gstEnabled: gst.enabled,
      gstin: String(body.gstin ?? ""),
      sellerGstin: String(body.sellerGstin ?? ""),
      customerGstin: String(body.customerGstin ?? ""),
      gstType: gst.type,
      gstRate: gst.rate,
      gstAmount: totals.gstAmount,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      grandTotal: totals.grandTotal,
      amountPaid,
      balanceDue: totals.balanceDue,
      paymentMode: String(body.paymentMode ?? "Cash"),
      status: String(body.isDraft ? "Draft" : status),
      notes: String(body.notes ?? ""),
      isDraft: Boolean(body.isDraft),
      offlineKey,
    })
    .returning();

  const bill = inserted[0];

  if (amountPaid > 0) {
    await db.insert(payments).values({
      billNo,
      customerName,
      amount: amountPaid,
      paymentMode: String(body.paymentMode ?? "Cash"),
      reference: String(body.utr ?? ""),
      note: "बिल के साथ दर्ज",
    });
  }

  if (!bill.isDraft) {
    for (const item of items) {
      if (!item.sku) continue;
      await db
        .update(products)
        .set({ stock: sql`greatest(0, ${products.stock} - ${item.qty})` })
        .where(eq(products.code, item.sku));
    }
    await db.insert(notifications).values({
      audience: "staff",
      title: `नया बिल ${billNo}`,
      body: `${customerName} · ₹${totals.grandTotal} · ${status}`,
    });
    void autoSyncRow("sales", [billNo, customerName, String(body.mobile ?? ""), items.map((i) => `${i.name} x${i.qty}`).join(" | "), totals.subtotal, totals.grandTotal, String(body.paymentMode ?? "Cash"), status, new Date().toLocaleString("en-IN")]);
  }

  await db.insert(auditLogs).values({ actor: `${session.username} (${session.role})`, action: "bill.create", detail: `${billNo} · ₹${totals.grandTotal}` });
  if (offlineKey) {
    await db.insert(syncLogs).values({ entity: "bill", offlineKey, status: "synced", payload: { billNo }, device: String(body.device ?? "web") });
  }
  return NextResponse.json({ ok: true, bill });
}

export async function PATCH(request: Request) {
  const session = await getStaffSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ ok: false, error: "अनुमति नहीं" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = Number(body.id ?? 0);
  if (!id) return NextResponse.json({ ok: false, error: "बिल ID आवश्यक" }, { status: 400 });

  if (body.cancel) {
    const rows = await db.update(bills).set({ status: "Cancelled", updatedAt: new Date() }).where(eq(bills.id, id)).returning();
    await db.insert(auditLogs).values({ actor: session.username, action: "bill.cancel", detail: `ID ${id}` });
    return NextResponse.json({ ok: true, bill: rows[0] });
  }

  const items = (Array.isArray(body.items) ? body.items : []).map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      name: String(item.name ?? "आइटम"),
      sku: String(item.sku ?? ""),
      description: String(item.description ?? ""),
      qty: Number(item.qty ?? 1) || 1,
      price: Number(item.price ?? 0) || 0,
      discount: Number(item.discount ?? 0) || 0,
      tax: Number(item.tax ?? 0) || 0,
    };
  }) as Item[];
  const discount = Number(body.discount ?? 0) || 0;
  const tax = Number(body.tax ?? 0) || 0;
  const amountPaid = Number(body.amountPaid ?? 0) || 0;
  const gst = { enabled: Boolean(body.gstEnabled), rate: Number(body.gstRate ?? 18) || 0, type: String(body.gstType ?? "CGST_SGST") };
  const totals = compute(items, discount, tax, amountPaid, gst);
  const status = body.status ? String(body.status) : amountPaid <= 0 ? "Unpaid" : amountPaid >= totals.grandTotal ? "Paid" : "Partially Paid";

  const rows = await db
    .update(bills)
    .set({
      customerName: String(body.customerName ?? ""),
      mobile: String(body.mobile ?? ""),
      address: String(body.address ?? ""),
      email: String(body.email ?? ""),
      items,
      subtotal: totals.subtotal,
      discount,
      tax,
      gstEnabled: gst.enabled,
      gstin: String(body.gstin ?? ""),
      sellerGstin: String(body.sellerGstin ?? ""),
      customerGstin: String(body.customerGstin ?? ""),
      gstType: gst.type,
      gstRate: gst.rate,
      gstAmount: totals.gstAmount,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      grandTotal: totals.grandTotal,
      amountPaid,
      balanceDue: totals.balanceDue,
      paymentMode: String(body.paymentMode ?? "Cash"),
      status,
      notes: String(body.notes ?? ""),
      isDraft: false,
      updatedAt: new Date(),
    })
    .where(eq(bills.id, id))
    .returning();

  await db.insert(auditLogs).values({ actor: session.username, action: "bill.update", detail: `ID ${id} · ₹${totals.grandTotal}` });
  return NextResponse.json({ ok: true, bill: rows[0] });
}

export async function DELETE(request: Request) {
  const session = await getStaffSession();
  if (!session || session.role !== "owner") return NextResponse.json({ ok: false, error: "केवल Owner हटा सकता है" }, { status: 403 });
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id") ?? 0);
  if (!id) return NextResponse.json({ ok: false, error: "ID आवश्यक" }, { status: 400 });
  await db.delete(bills).where(eq(bills.id, id));
  await db.insert(auditLogs).values({ actor: session.username, action: "bill.delete", detail: `ID ${id}` });
  return NextResponse.json({ ok: true });
}
