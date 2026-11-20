import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { getStaffSession, hashPassword, setStaffSession, verifyPassword } from "@/lib/auth";
import { saveSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });
  const rows = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  const user = rows[0];
  if (!user) return NextResponse.json({ ok: false, error: "यूज़र नहीं मिला" }, { status: 404 });
  return NextResponse.json({
    ok: true,
    profile: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      loginCount: user.loginCount,
      lastLoginAt: user.lastLoginAt,
    },
  });
}

export async function PATCH(request: Request) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.profileUrl === "string") patch.profileUrl = body.profileUrl;

  if (typeof body.newPassword === "string" && body.newPassword.trim()) {
    const currentRows = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
    const current = currentRows[0];
    if (!current) return NextResponse.json({ ok: false, error: "यूज़र नहीं मिला" }, { status: 404 });
    const oldPassword = String(body.currentPassword ?? "");
    if (!verifyPassword(oldPassword, current.passwordHash)) {
      return NextResponse.json({ ok: false, error: "पुराना पासवर्ड गलत है" }, { status: 400 });
    }
    patch.passwordHash = hashPassword(body.newPassword.trim());
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: "कोई बदलाव नहीं" }, { status: 400 });
  }

  await db.update(users).set(patch).where(eq(users.id, session.id));
  if (typeof patch.profileUrl === "string") {
    await saveSettings({ profileUrl: patch.profileUrl });
  }
  if (typeof patch.name === "string") {
    await setStaffSession({ ...session, name: patch.name });
  }
  await db.insert(auditLogs).values({
    actor: `${session.username} (${session.role})`,
    action: "profile.update",
    detail: Object.keys(patch).join(", "),
  });
  return NextResponse.json({ ok: true });
}
