import { createSign } from "node:crypto";

/**
 * Google Sheets integration using a Service Account (REST, no extra dependency).
 *
 * Required environment variables:
 *  GOOGLE_SHEET_ID (alias: GOOGLE_SHEETS_SPREADSHEET_ID)
 *  GOOGLE_SERVICE_ACCOUNT_EMAIL (alias: GOOGLE_CLIENT_EMAIL)
 *  GOOGLE_PRIVATE_KEY (alias: GOOGLE_PRIVATE_KEY) — "-----BEGIN PRIVATE KEY-----\n..."
 */

export const SHEET_TABS = [
  { key: "customers", label: "ग्राहक", sheet: "Customers" },
  { key: "applications", label: "सेवा अनुरोध", sheet: "Applications" },
  { key: "repairs", label: "रिपेयर जॉब", sheet: "Repairs" },
  { key: "invoices", label: "इनवॉइस", sheet: "Invoices" },
  { key: "expenses", label: "खर्च", sheet: "Expenses" },
  { key: "documents", label: "दस्तावेज़", sheet: "Documents" },
  { key: "deliverables", label: "पूर्ण कार्य (तैयार दस्तावेज़)", sheet: "Deliverables" },
  { key: "services", label: "सेवा सूची", sheet: "Services" },
  { key: "bills", label: "बिल / Billing", sheet: "Bills" },
  { key: "payments", label: "भुगतान", sheet: "Payments" },
  { key: "salesList", label: "बिक्री", sheet: "SalesList" },
  { key: "purchasesList", label: "खरीद", sheet: "Purchases" },
  { key: "stock", label: "स्टॉक", sheet: "Stock" },
  { key: "offersList", label: "ऑफर", sheet: "Offers" },
  { key: "feedbackList", label: "फीडबैक", sheet: "Feedback" },
  { key: "profilesList", label: "बिज़नेस प्रोफाइल", sheet: "BusinessProfiles" },
  { key: "bannersList", label: "बैनर", sheet: "Banners" },
] as const;

export type SheetTabKey = (typeof SHEET_TABS)[number]["key"];

export function googleConfig() {
  const sheetId = process.env.GOOGLE_SHEET_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL || "";
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
  const privateKey = rawKey.replace(/\\n/g, "\n");
  const configured = Boolean(sheetId && email && privateKey);
  return {
    sheetId,
    email,
    privateKey,
    configured,
    webhook: process.env.GOOGLE_SHEETS_WEBHOOK_URL || "",
    missing: [
      !sheetId ? "GOOGLE_SHEET_ID" : "",
      !email ? "GOOGLE_SERVICE_ACCOUNT_EMAIL" : "",
      !privateKey ? "GOOGLE_PRIVATE_KEY" : "",
    ].filter(Boolean),
  };
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export async function getAccessToken(): Promise<string> {
  const { email, privateKey, configured } = googleConfig();
  if (!configured) throw new Error("Google Sheet कॉन्फ़िगर नहीं है");

  const iat = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: iat + 3600,
      iat,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const signature = signer.sign(privateKey).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const assertion = `${header}.${claim}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const json = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !json.access_token) {
    throw new Error(json.error_description || "Google token प्राप्त नहीं हुआ");
  }
  return json.access_token;
}

async function sheetFetch(path: string, init: RequestInit = {}, token: string) {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  return response;
}

export async function ensureSheetTab(sheetName: string, token: string): Promise<void> {
  const { sheetId } = googleConfig();
  const metaResponse = await sheetFetch(`${sheetId}?fields=sheets.properties.title`, {}, token);
  if (!metaResponse.ok) throw new Error("Google Sheet नहीं मिली — ID व शेयरिंग जाँचें");
  const meta = (await metaResponse.json()) as { sheets?: { properties?: { title?: string } }[] };
  const titles = (meta.sheets ?? []).map((s) => s.properties?.title).filter(Boolean);
  if (titles.includes(sheetName)) return;
  await sheetFetch(
    `${sheetId}:batchUpdate`,
    {
      method: "POST",
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      }),
    },
    token,
  );
}

export async function writeSheetValues(
  sheetName: string,
  rows: (string | number | null)[][],
  token: string,
): Promise<number> {
  const { sheetId } = googleConfig();
  await ensureSheetTab(sheetName, token);
  const clearResponse = await sheetFetch(`${sheetId}/values/${encodeURIComponent(sheetName)}:clear`, {
    method: "POST",
    body: JSON.stringify({}),
  }, token);
  if (!clearResponse.ok) throw new Error("शीट साफ़ नहीं हो सकी");

  if (rows.length === 0) return 0;
  const updateResponse = await sheetFetch(
    `${sheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`,
    { method: "PUT", body: JSON.stringify({ values: rows }) },
    token,
  );
  if (!updateResponse.ok) {
    const json = (await updateResponse.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(json.error?.message || "शीट में लिखा नहीं जा सका");
  }
  return rows.length - 1;
}

export async function appendSheetValues(
  sheetName: string,
  rows: (string | number | null)[][],
  token: string,
): Promise<void> {
  const { sheetId } = googleConfig();
  await ensureSheetTab(sheetName, token);
  await sheetFetch(
    `${sheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: rows }) },
    token,
  );
}

export function maskId(id: string): string {
  if (!id) return "—";
  if (id.length <= 10) return id;
  return `${id.slice(0, 4)}••••${id.slice(-4)}`;
}
