import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { canManage, getStaffSession } from "@/lib/auth";
import { saveSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const session = await getStaffSession();
  if (!session || !canManage(session.role)) {
    return NextResponse.json({ ok: false, error: "अनुमति नहीं" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const updates: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key.startsWith("__")) continue;
    updates[key] = value === null || value === undefined ? "" : String(value);
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: false, error: "कोई बदलाव नहीं" }, { status: 400 });
  }
  await saveSettings(updates);
  await db.insert(auditLogs).values({
    actor: `${session.username} (${session.role})`,
    action: "settings.update",
    detail: Object.keys(updates).join(", ").slice(0, 240),
  });
  return NextResponse.json({ ok: true });
}
