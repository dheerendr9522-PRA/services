/**
 * Google Sheet auto-sync.
 *
 * Two supported integrations (both optional, configured through environment variables):
 * 1. Apps Script Webhook:  GOOGLE_SHEETS_WEBHOOK_URL
 *    The script's doPost(e) receives JSON and appends a row.
 * 2. CSV / IMPORTDATA:     /exports/<type>.csv and /exports/services/<slug>.csv
 *
 * The sync is always fire-and-forget so a Google outage never blocks a customer application.
 */
export type SheetSyncPayload = Record<string, string | number | null | undefined>;

export async function syncToGoogleSheet(sheet: string, payload: SheetSyncPayload): Promise<boolean> {
  const webhook = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhook) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheet, row: payload, syncedAt: new Date().toISOString() }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

export function sheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
      (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SHEETS_SPREADSHEET_ID),
  );
}


/**
 * Auto-push a single record row into the connected Google Sheet so every new
 * entry (customer, request, repair, invoice, expense) reaches Sheets instantly.
 */
export async function autoSyncRow(tab: string, row: (string | number | null)[]): Promise<boolean> {
  try {
    const { googleConfig, getAccessToken, appendSheetValues, SHEET_TABS } = await import("@/lib/googleSheet");
    const config = googleConfig();
    if (!config.configured) return false;
    const meta = SHEET_TABS.find((t) => t.key === tab);
    if (!meta) return false;
    const token = await getAccessToken();
    await appendSheetValues(meta.sheet, [row], token);
    return true;
  } catch {
    return false;
  }
}
