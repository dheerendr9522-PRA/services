"use client";

import { useEffect, useState } from "react";

const TABS = [
  { key: "customers", label: "ग्राहक" },
  { key: "applications", label: "सेवा अनुरोध" },
  { key: "repairs", label: "रिपेयर जॉब" },
  { key: "invoices", label: "इनवॉइस" },
  { key: "expenses", label: "खर्च" },
  { key: "documents", label: "दस्तावेज़" },
  { key: "deliverables", label: "पूर्ण कार्य (तैयार दस्तावेज़)" },
  { key: "services", label: "सेवा सूची" },
  { key: "bills", label: "बिल / Billing" },
  { key: "payments", label: "भुगतान" },
  { key: "salesList", label: "बिक्री" },
  { key: "purchasesList", label: "खरीद" },
  { key: "stock", label: "स्टॉक" },
  { key: "offersList", label: "ऑफर" },
  { key: "feedbackList", label: "फीडबैक" },
  { key: "profilesList", label: "बिज़नेस प्रोफाइल" },
  { key: "bannersList", label: "बैनर" },
];

type Status = {
  configured: boolean;
  webhookConfigured: boolean;
  missing: string[];
  spreadsheet: string;
  account: string;
  lastSync: string;
  lastSyncTabs: string;
};

export default function GoogleSheetPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [selected, setSelected] = useState<string[]>(TABS.map((t) => t.key));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<{ label: string; rows: number }[]>([]);
  const [failures, setFailures] = useState<{ label: string; error: string }[]>([]);
  const [sheetIdInput, setSheetIdInput] = useState("");

  const loadStatus = async () => {
    const response = await fetch("/api/sheets/status", { cache: "no-store" }).catch(() => null);
    if (!response || !response.ok) return;
    const json = (await response.json()) as Status & { ok: boolean };
    setStatus(json);
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const sync = async (tabs: string[]) => {
    if (tabs.length === 0) {
      setMessage("कम से कम एक शीट चुनें");
      return;
    }
    setBusy(true);
    setMessage("⏳ Google Sheet में भेजा जा रहा है… यह कुछ सेकंड ले सकता है।");
    setResults([]);
    setFailures([]);
    const response = await fetch("/api/sheets/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tabs }),
    }).catch(() => null);
    setBusy(false);
    if (!response) {
      setMessage("❌ नेटवर्क त्रुटि");
      return;
    }
    const json = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      results?: { label: string; rows: number }[];
      failures?: { label: string; error: string }[];
    };
    if (!response.ok && json.error) {
      setMessage(`❌ ${json.error}`);
      return;
    }
    setResults(json.results ?? []);
    setFailures(json.failures ?? []);
    setMessage(
      json.failures && json.failures.length
        ? `⚠️ ${json.results?.length ?? 0} शीट भेजी गईं, ${json.failures.length} विफल`
        : `✅ सिंक पूरा — ${json.results?.reduce((sum, r) => sum + r.rows, 0) ?? 0} पंक्तियाँ लिखी गईं`,
    );
    void loadStatus();
  };

  return (
    <div className="space-y-3">
      <div className={`card p-3 ${status && !status.configured ? "border-amber-300 dark:border-amber-400/30" : ""}`}>
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">कनेक्शन स्थिति</h2>
        <p className={`mt-1 text-xs font-bold ${status?.configured ? "text-emerald-600 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
          {status === null
            ? "⏳ जाँच हो रही है…"
            : status.configured
              ? `✅ जुड़ा हुआ — शीट ${status.spreadsheet} · ${status.account}`
              : status.webhookConfigured
                ? "✅ Apps Script Webhook जुड़ा है — नए रिकॉर्ड अपने-आप जुड़ते हैं"
                : `⚠ अभी सेट नहीं है — ये variables छूट रहे हैं: ${status.missing.join(", ") || "सभी"}`}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          अंतिम सिंक: {status?.lastSync ? new Date(status.lastSync).toLocaleString("en-IN") : "कभी नहीं"}
          {status?.lastSyncTabs ? ` · ${status.lastSyncTabs}` : ""}
        </p>
        <button type="button" onClick={loadStatus} className="btn-ghost mt-2 px-2.5 py-1.5 text-[11px]">
          ♻ स्थिति जाँचें
        </button>
      </div>

      <div className="card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">डेटा भेजें / Sync</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              चुनी गई शीट पूरी तरह ताज़ा लिखी जाती है (पुरानी पंक्तियाँ हटाकर नई)। नए रिकॉर्ड अपने-आप भी जुड़ते रहते हैं।
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelected(selected.length === TABS.length ? [] : TABS.map((t) => t.key))}
              className="btn-ghost px-2.5 py-1.5 text-[11px]"
            >
              {selected.length === TABS.length ? "☑ सभी हटाएँ" : "☑ सभी चुनें"}
            </button>
          </div>
        </div>

        <div className="mt-2 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
          {TABS.map((tab) => {
            const active = selected.includes(tab.key);
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() =>
                  setSelected((prev) => (prev.includes(tab.key) ? prev.filter((k) => k !== tab.key) : [...prev, tab.key]))
                }
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition ${
                  active
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"
                }`}
              >
                <span className="grid h-5 w-5 place-items-center rounded-md border text-[10px]">
                  {active ? "✓" : ""}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button type="button" disabled={busy} onClick={() => sync(selected)} className="btn-primary px-3 py-1.5 text-xs">
            ⬆ चयनित भेजें
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setSelected(TABS.map((t) => t.key));
              void sync(TABS.map((t) => t.key));
            }}
            className="btn-soft px-3 py-1.5 text-xs"
          >
            🔄 सब कुछ भेजें
          </button>
          <button type="button" onClick={loadStatus} className="btn-ghost px-3 py-1.5 text-xs">
            ♻ स्थिति जाँचें
          </button>
          <a href="https://sheets.new" target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 text-xs">
            ➕ नई Google Sheet
          </a>
          {busy ? <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300">⏳ सिंक चल रहा है…</span> : null}
        </div>

        {message ? (
          <p className="mt-2 rounded-xl bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200">
            {message}
          </p>
        ) : null}
        {results.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {results.map((r) => (
              <span key={r.label} className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                ✅ {r.label}: {r.rows}
              </span>
            ))}
            {failures.map((f) => (
              <span key={f.label} className="chip bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                ❌ {f.label}: {f.error}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="card p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">सेटअप कैसे करें (एक बार)</h2>
        <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
          <li>
            <b>Google Sheet बनाएँ</b> — <a className="font-bold text-indigo-600 dark:text-indigo-300" href="https://sheets.new" target="_blank" rel="noreferrer">sheets.new</a> खोलें, नाम दें &quot;DP Seva Kendra Data&quot;। URL में <code>/d/</code> और <code>/edit</code> के बीच वाला लंबा कोड ही SHEET ID है।
          </li>
          <li>
            <a className="font-bold text-indigo-600 dark:text-indigo-300" href="https://console.cloud.google.com" target="_blank" rel="noreferrer">console.cloud.google.com</a> पर नया project बनाएँ → &quot;Google Sheets API&quot; को Enable करें।
          </li>
          <li>IAM &amp; Admin → Service Accounts → Create service account → उसमें Keys → Add key → JSON डाउनलोड करें।</li>
          <li>अपनी Google Sheet में Share दबाएँ और JSON वाली client_email (…iam.gserviceaccount.com) को Editor बनाकर जोड़ें।</li>
          <li>सर्वर पर ये 3 environment variables सेट करें, फिर ऐप restart/redeploy करें:</li>
        </ol>
        <pre className="mt-1.5 overflow-x-auto rounded-xl bg-slate-900 p-2.5 text-[10.5px] leading-relaxed text-emerald-200">{`GOOGLE_SHEET_ID=आपकी-शीट-आईडी
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxx@yyyy.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n"`}</pre>
        <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300">6. इस पेज पर लौटकर &quot;सब कुछ भेजें&quot; दबाएँ।</p>
        <div className="mt-2 rounded-xl border border-slate-200 p-2 dark:border-white/10">
          <label className="label">शीट ID जाँच (केवल संदर्भ के लिए)</label>
          <div className="flex flex-wrap gap-1.5">
            <input
              value={sheetIdInput}
              onChange={(e) => setSheetIdInput(e.target.value)}
              placeholder="1AbC...sheet id"
              className="input max-w-xs px-2 py-1.5 text-[11px]"
            />
            <button type="button" onClick={loadStatus} className="btn-ghost px-2.5 py-1.5 text-[11px]">
              स्थिति जाँचें
            </button>
            <span className="text-[10px] text-slate-400">
              सर्वर पर सेट शीट: {status?.spreadsheet ?? "—"}
            </span>
          </div>
        </div>
        <p className="mt-2 rounded-xl bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          सुरक्षा: Google की कुंजी केवल सर्वर पर रहती है, ब्राउज़र में कभी नहीं भेजी जाती। शीट को निजी रखें —
          &quot;Anyone with the link&quot; कभी न चुनें, क्योंकि उसमें ग्राहकों के नाम व मोबाइल नंबर होते हैं।
        </p>
      </div>
    </div>
  );
}
