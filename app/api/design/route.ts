import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, designVersions } from "@/db/schema";
import { canManage, getStaffSession } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const defaultDesign = {
  primary: "#4f46e5", accent: "#f97316", sidebar: "#0f172a", surface: "#ffffff", text: "#0f172a",
  radius: 16, cardShadow: "sm", cardPadding: 12, cardBorderWidth: 1, headingSize: 18, bodySize: 12,
  buttonRadius: 12, buttonStyle: "rounded", gridColumns: 4, sidebarWidth: 248, pagePadding: 16,
  preset: "dp-blue", fontHindi: "Noto Sans Devanagari", fontEnglish: "Inter",
};

export async function GET() {
  const settings = await getSettings();
  const raw = settings.designJson;
  let design = defaultDesign;
  if (raw) {
    try {
      design = { ...defaultDesign, ...(JSON.parse(raw) as Record<string, unknown>) } as typeof defaultDesign;
    } catch {
      design = defaultDesign;
    }
  }
  const versions = await db.select().from(designVersions).orderBy(desc(designVersions.createdAt)).limit(20);
  return NextResponse.json({ ok: true, design, versions });
}

export async function PATCH(request: Request) {
  const session = await getStaffSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ ok: false, error: "अनुमति नहीं" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { design?: Record<string, unknown>; note?: string };
  if (!body.design) return NextResponse.json({ ok: false, error: "डिज़ाइन डेटा आवश्यक" }, { status: 400 });
  const payload = { ...defaultDesign, ...body.design };
  await saveSettings({
    designJson: JSON.stringify(payload),
    brandColor: String(payload.primary ?? defaultDesign.primary),
    accentColor: String(payload.accent ?? defaultDesign.accent),
  });
  const countRows = await db.select().from(designVersions);
  await db.insert(designVersions).values({
    versionNo: countRows.length + 1,
    payload,
    changedBy: `${session.username} (${session.role})`,
    note: body.note ?? "design update",
  });
  await db.insert(auditLogs).values({
    actor: `${session.username} (${session.role})`,
    action: "design.publish",
    detail: `${body.note ?? "update"} · primary ${String(payload.primary)}`,
  });
  return NextResponse.json({ ok: true, design: payload });
}

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ ok: false, error: "अनुमति नहीं" }, { status: 403 });
  const body = (await request.json().catch(() => ({}))) as { restoreVersionId?: number };
  if (!body.restoreVersionId) return NextResponse.json({ ok: false, error: "संस्करण ID आवश्यक" }, { status: 400 });
  const rows = await db.select().from(designVersions).where(eq(designVersions.id, body.restoreVersionId)).limit(1);
  const version = rows[0];
  if (!version) return NextResponse.json({ ok: false, error: "संस्करण नहीं मिला" }, { status: 404 });
  const payload = { ...defaultDesign, ...(version.payload as Record<string, unknown>) };
  await saveSettings({
    designJson: JSON.stringify(payload),
    brandColor: String(payload.primary),
    accentColor: String(payload.accent),
  });
  await db.insert(auditLogs).values({ actor: session.username, action: "design.restore", detail: `v${version.versionNo}` });
  return NextResponse.json({ ok: true, design: payload });
}
