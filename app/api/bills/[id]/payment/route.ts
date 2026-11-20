import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, bills, payments } from "@/db/schema";
import { canManage, getStaffSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ ok: false, error: "अनुमति नहीं" }, { status: 403 });
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const amount = Number(body.amount ?? 0);
  if (amount <= 0) return NextResponse.json({ ok: false, error: "राशि आवश्यक है" }, { status: 400 });

  const rows = await db.select().from(bills).where(eq(bills.id, Number(id))).limit(1);
  const bill = rows[0];
  if (!bill) return NextResponse.json({ ok: false, error: "बिल नहीं मिला" }, { status: 404 });

  const paid = bill.amountPaid + amount;
  const status = paid >= bill.grandTotal ? "Paid" : paid > 0 ? "Partially Paid" : "Unpaid";
  const updated = await db
    .update(bills)
    .set({ amountPaid: paid, balanceDue: Math.max(0, bill.grandTotal - paid), status, updatedAt: new Date() })
    .where(eq(bills.id, bill.id))
    .returning();

  await db.insert(payments).values({
    billNo: bill.billNo,
    customerName: bill.customerName,
    amount,
    paymentMode: String(body.paymentMode ?? "Cash"),
    reference: String(body.reference ?? ""),
    note: String(body.note ?? ""),
  });
  await db.insert(auditLogs).values({ actor: session.username, action: "bill.payment", detail: `${bill.billNo} +₹${amount} → ${status}` });
  return NextResponse.json({ ok: true, bill: updated[0] });
}
