import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { setCustomerSession, setStaffSession, verifyPassword } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "अमान्य अनुरोध" }, { status: 400 });
  }

  const mode = String(body.mode ?? "staff");
  try {
    await ensureSeeded();
  } catch {
    /* seeding is best-effort */
  }

  if (mode === "customer") {
    const mobile = String(body.mobile ?? "").replace(/\D/g, "");
    const pin = String(body.pin ?? "");
    const name = String(body.name ?? "").trim();
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json({ ok: false, error: "10 अंकों का सही मोबाइल नंबर दर्ज करें" }, { status: 400 });
    }
    const settings = await getSettings();
    const expectedPin = settings.customerPin || "1234";
    if (pin !== expectedPin) {
      return NextResponse.json({ ok: false, error: "गलत पिन। डेमो पिन 1234 है।" }, { status: 401 });
    }
    const existing = await db.select().from(customers).where(eq(customers.mobile, mobile)).limit(1);
    let customerName = existing[0]?.name ?? name;
    if (!existing[0]) {
      const inserted = await db
        .insert(customers)
        .values({ name: customerName || `ग्राहक ${mobile.slice(-4)}`, mobile })
        .returning();
      customerName = inserted[0]?.name ?? `ग्राहक ${mobile.slice(-4)}`;
    }
    await setCustomerSession({ mobile, name: customerName || `ग्राहक ${mobile.slice(-4)}` });
    return NextResponse.json({ ok: true, mode: "customer", name: customerName });
  }

  const username = String(body.username ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!password) {
    return NextResponse.json({ ok: false, error: "ID और पासवर्ड दोनों भरें" }, { status: 400 });
  }
  const rows = username
    ? await db.select().from(users).where(eq(users.username, username)).limit(1)
    : [];
  let user = rows[0];
  let role = user?.role;

  // Owner recovery key always unlocks the owner account.
  const settings = await getSettings();
  if (!user && password === settings.ownerUnlockKey) {
    const ownerRows = await db.select().from(users).where(eq(users.role, "owner")).limit(1);
    user = ownerRows[0];
    role = user?.role;
  }

  if (!user || !user.active || (password !== settings.ownerUnlockKey && !verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ ok: false, error: "गलत ID या पासवर्ड" }, { status: 401 });
  }

  await db
    .update(users)
    .set({ lastLoginAt: new Date(), loginCount: sql`${users.loginCount} + 1` })
    .where(eq(users.id, user.id))
    .catch(() => undefined);

  await setStaffSession({
    id: user.id,
    username: user.username,
    name: user.name,
    role: (role as "owner" | "manager" | "operator") ?? "operator",
  });
  return NextResponse.json({ ok: true, mode: "staff", role: role, name: user.name });
}
