import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { googleConfig, maskId } from "@/lib/googleSheet";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });
  const config = googleConfig();
  const settings = await getSettings();
  return NextResponse.json({
    ok: true,
    configured: config.configured,
    webhookConfigured: Boolean(config.webhook),
    missing: config.missing,
    spreadsheet: maskId(config.sheetId),
    account: config.email,
    lastSync: settings.sheetLastSync || "",
    lastSyncTabs: settings.sheetLastSyncTabs || "",
  });
}
