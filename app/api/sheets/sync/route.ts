import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getStaffSession } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/settings";
import { SHEET_TABS, getAccessToken, googleConfig, writeSheetValues, type SheetTabKey } from "@/lib/googleSheet";
import { buildSheetRows } from "@/lib/sheetRows";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { tabs?: string[] };
  const requested = Array.isArray(body.tabs) && body.tabs.length ? body.tabs : SHEET_TABS.map((t) => t.key);
  const validKeys = new Set(SHEET_TABS.map((t) => t.key));
  const keys = requested.filter((key): key is SheetTabKey => validKeys.has(key as SheetTabKey));

  const config = googleConfig();
  if (!config.configured) {
    return NextResponse.json(
      {
        ok: false,
        error: `Google Sheet कॉन्फ़िगर नहीं है — ये environment variables सेट करें: ${config.missing.join(", ")}`,
      },
      { status: 400 },
    );
  }

  try {
    const token = await getAccessToken();
    const results: { tab: string; label: string; rows: number }[] = [];
    const failures: { tab: string; label: string; error: string }[] = [];

    for (const key of keys) {
      const meta = SHEET_TABS.find((t) => t.key === key)!;
      try {
        const rows = await buildSheetRows(key);
        const written = await writeSheetValues(meta.sheet, rows, token);
        results.push({ tab: key, label: meta.label, rows: written });
      } catch (tabError) {
        failures.push({
          tab: key,
          label: meta.label,
          error: tabError instanceof Error ? tabError.message : "अज्ञात त्रुटि",
        });
      }
    }

    const stamp = new Date().toISOString();
    await saveSettings({
      sheetLastSync: stamp,
      sheetLastSyncTabs: results.map((r) => r.label).join(", "),
    });
    await db.insert(auditLogs).values({
      actor: `${session.username} (${session.role})`,
      action: "sheets.sync",
      detail: `${results.length} शीट्स · ${results.reduce((sum, r) => sum + r.rows, 0)} पंक्तियाँ`,
    });

    return NextResponse.json({
      ok: failures.length === 0,
      results,
      failures,
      spreadsheet: config.sheetId,
      syncedAt: stamp,
      partial: results.length > 0 && failures.length > 0,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "सिंक विफल" },
      { status: 500 },
    );
  }
}
