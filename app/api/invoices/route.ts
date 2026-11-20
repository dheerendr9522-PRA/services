import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, invoices } from "@/db/schema";
import { canManage, getStaffSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Item = { label: string; description?: string; sku?: string; qty: number; rate: number; discount?: number; tax?: number };

function compute(items: Item[], discount: number, tax: number, paid: number, gst: { enabled: boolean; rate: number; type: string }) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0) - Number(item.discount || 0), 0);
  const itemTax = items.reduce((sum, item) => sum + Number(item.tax || 0), 0);
  const taxable = Math.max(0, subtotal - Number(discount || 0));
  const gstAmount = gst.enabled ? Math.round((taxable * gst.rate) / 100) : 0;
  const cgst = gst.enabled && gst.type !== "IGST" ? Math.round(gstAmount / 2) : 0;
  const sgst = gst.enabled && gst.type !== "IGST" ? gstAmount - cgst : 0;
  const igst = gst.enabled && gst.type === "IGST" ? gstAmount : 0;
  const total = Math.max(0, taxable + itemTax + Number(tax || 0) + gstAmount);
  return { subtotal, total, gstAmount, cgst, sgst, igst, balance: Math.max(0, total - Number(paid || 0)) };
}

export async function GET() {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });
  const rows = await db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(400);
  return NextResponse.json({ ok: true, rows });
}

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ ok: false, error: "अनुमति नहीं" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const items = (Array.isArray(body.items) ? body.items : []).map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      label: String(item.label ?? "आइटम"),
      description: String(item.description ?? ""),
      sku: String(item.sku ?? ""),
      qty: Number(item.qty ?? 1) || 1,
      rate: Number(item.rate ?? 0) || 0,
      discount: Number(item.discount ?? 0) || 0,
      tax: Number(item.tax ?? 0) || 0,
    };
  }) as Item[];
  if (!items.length) return NextResponse.json({ ok: false, error: "कम से कम एक आइटम जोड़ें" }, { status: 400 });
  const customerName = String(body.customerName ?? "").trim();
  const mobile = String(body.mobile ?? "").replace(/\D/g, "").slice(0, 10);
  if (!customerName) return NextResponse.json({ ok: false, error: "ग्राहक नाम आवश्यक" }, { status: 400 });

  const discount = Number(body.discount ?? 0) || 0;
  const tax = Number(body.tax ?? 0) || 0;
  const paid = Number(body.amountPaid ?? 0) || 0;
  const gst = { enabled: Boolean(body.gstEnabled), rate: Number(body.gstRate ?? 18) || 0, type: String(body.gstType ?? "CGST_SGST") };
  const totals = compute(items, discount, tax, paid, gst);

  const countRows = await db.select({ value: sql<number>`count(*)::int` }).from(invoices);
  const invoiceNo = String(body.invoiceNo ?? "").trim() || `INV-${1000 + Number(countRows[0]?.value ?? 0) + 1}`;
  const dueDate = body.dueDate ? new Date(`${String(body.dueDate)}T18:00:00`) : null;

  const inserted = await db
    .insert(invoices)
    .values({
      invoiceNo,
      customerName,
      mobile,
      items,
      discount,
      tax,
      total: totals.total,
      paymentMode: String(body.paymentMode ?? "Cash"),
      status: paid >= totals.total && totals.total > 0 ? "Paid" : paid > 0 ? "Partially Paid" : "Pending",
      notes: String(body.notes ?? ""),
      dueDate,
      amountPaid: paid,
      gstEnabled: gst.enabled,
      gstin: String(body.sellerGstin ?? body.gstin ?? ""),
      customerGstin: String(body.customerGstin ?? ""),
      gstType: gst.type,
      gstRate: gst.rate,
      gstAmount: totals.gstAmount,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
    })
    .returning();

  await db.insert(auditLogs).values({ actor: `${session.username} (${session.role})`, action: "invoice.create", detail: `${invoiceNo} · ₹${totals.total}` });
  return NextResponse.json({ ok: true, invoice: inserted[0] });
}

export async function PATCH(request: Request) {
  const session = await getStaffSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ ok: false, error: "अनुमति नहीं" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = Number(body.id ?? 0);
  if (!id) return NextResponse.json({ ok: false, error: "इनवॉइस ID आवश्यक" }, { status: 400 });
  const items = (Array.isArray(body.items) ? body.items : []).map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      label: String(item.label ?? "आइटम"), description: String(item.description ?? ""), sku: String(item.sku ?? ""),
      qty: Number(item.qty ?? 1) || 1, rate: Number(item.rate ?? 0) || 0,
      discount: Number(item.discount ?? 0) || 0, tax: Number(item.tax ?? 0) || 0,
    };
  }) as Item[];
  const discount = Number(body.discount ?? 0) || 0;
  const tax = Number(body.tax ?? 0) || 0;
  const paid = Number(body.amountPaid ?? 0) || 0;
  const gst = { enabled: Boolean(body.gstEnabled), rate: Number(body.gstRate ?? 18) || 0, type: String(body.gstType ?? "CGST_SGST") };
  const totals = compute(items, discount, tax, paid, gst);
  const rows = await db
    .update(invoices)
    .set({
      customerName: String(body.customerName ?? ""),
      mobile: String(body.mobile ?? ""),
      items,
      discount,
      tax,
      total: totals.total,
      paymentMode: String(body.paymentMode ?? "Cash"),
      status: body.status ? String(body.status) : paid >= totals.total && totals.total > 0 ? "Paid" : paid > 0 ? "Partially Paid" : "Pending",
      notes: String(body.notes ?? ""),
      dueDate: body.dueDate ? new Date(`${String(body.dueDate)}T18:00:00`) : null,
      amountPaid: paid,
      gstEnabled: gst.enabled,
      gstin: String(body.sellerGstin ?? body.gstin ?? ""),
      customerGstin: String(body.customerGstin ?? ""),
      gstType: gst.type,
      gstRate: gst.rate,
      gstAmount: totals.gstAmount,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
    })
    .where(eq(invoices.id, id))
    .returning();
  await db.insert(auditLogs).values({ actor: session.username, action: "invoice.update", detail: `ID ${id} · ₹${totals.total}` });
  return NextResponse.json({ ok: true, invoice: rows[0] });
}

export async function DELETE(request: Request) {
  const session = await getStaffSession();
  if (!session || session.role !== "owner") return NextResponse.json({ ok: false, error: "केवल Owner हटा सकता है" }, { status: 403 });
  const id = Number(new URL(request.url).searchParams.get("id") ?? 0);
  if (!id) return NextResponse.json({ ok: false, error: "ID आवश्यक" }, { status: 400 });
  await db.delete(invoices).where(eq(invoices.id, id));
  await db.insert(auditLogs).values({ actor: session.username, action: "invoice.delete", detail: `ID ${id}` });
  return NextResponse.json({ ok: true });
}
