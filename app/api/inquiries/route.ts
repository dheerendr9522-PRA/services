import { NextResponse } from "next/server";
import { db } from "@/db";
import { inquiries, notifications } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ ok: false, error: "नाम आवश्यक है" }, { status: 400 });
  await db.insert(inquiries).values({
    profileSlug: String(body.profileSlug ?? ""),
    name,
    mobile: String(body.mobile ?? "").replace(/\D/g, "").slice(0, 10),
    message: String(body.message ?? ""),
  });
  await db.insert(notifications).values({
    audience: "staff",
    title: "नई पूछताछ (बिज़नेस प्रोफाइल)",
    body: `${name} — ${String(body.message ?? "").slice(0, 90)}`,
  });
  return NextResponse.json({ ok: true });
}
