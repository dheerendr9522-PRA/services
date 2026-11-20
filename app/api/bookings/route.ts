import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, notifications, profileEvents } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const serviceName = String(body.serviceName ?? "").trim();
  const customerName = String(body.customerName ?? "").trim();
  const mobile = String(body.mobile ?? "").replace(/\D/g, "");
  if (!serviceName || !customerName || mobile.length !== 10) {
    return NextResponse.json({ ok: false, error: "सेवा, नाम और 10-अंकों का मोबाइल आवश्यक है" }, { status: 400 });
  }
  const inserted = await db
    .insert(bookings)
    .values({
      serviceName,
      customerName,
      mobile,
      details: String(body.details ?? ""),
      quantity: String(body.quantity ?? ""),
      fee: Number(body.fee ?? 0) || 0,
      status: "New Request",
    })
    .returning({ id: bookings.id });
  const refNo = `BK-${3000 + Number(inserted[0]?.id ?? 0)}`;
  await db.update(bookings).set({ refNo }).where(sql`${bookings.id} = ${inserted[0]?.id ?? 0}`);
  await db.insert(notifications).values({
    audience: "staff",
    title: `नई बुकिंग: ${serviceName}`,
    body: `${refNo} — ${customerName} (${mobile})`,
  });
  await db.insert(profileEvents).values({ kind: "booking", label: serviceName, source: "app" });
  return NextResponse.json({ ok: true, refNo });
}
