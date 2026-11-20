import { NextResponse } from "next/server";
import { db } from "@/db";
import { profileEvents } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const kind = String(body.kind ?? "view").slice(0, 20);
  await db.insert(profileEvents).values({
    kind,
    label: String(body.label ?? "").slice(0, 120),
    source: String(body.source ?? "app").slice(0, 30),
  });
  return NextResponse.json({ ok: true });
}
