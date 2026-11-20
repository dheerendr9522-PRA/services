import { NextResponse } from "next/server";
import { db } from "@/db";
import { feedback, notifications } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  const rating = Math.min(5, Math.max(1, Number(body.rating ?? 5)));
  if (!name) return NextResponse.json({ ok: false, error: "नाम आवश्यक है" }, { status: 400 });
  await db.insert(feedback).values({
    name,
    mobile: String(body.mobile ?? "").replace(/\D/g, "").slice(0, 10),
    rating,
    comment: String(body.comment ?? ""),
    serviceName: String(body.serviceName ?? ""),
    active: true,
  });
  await db.insert(notifications).values({
    audience: "staff",
    title: `नई रेटिंग ${rating}⭐`,
    body: `${name} — ${String(body.comment ?? "").slice(0, 90)}`,
  });
  return NextResponse.json({ ok: true });
}
