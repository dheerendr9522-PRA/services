"use client";

import { useMemo, useState } from "react";

type ServiceItem = { slug: string; nameHi: string; nameEn: string; shopFee: number; count?: number };

const REPORTS = [
  { type: "all-services", label: "सभी सेवाएँ CSV", icon: "🧾" },
  { type: "customers", label: "दुकान ग्राहक CSV", icon: "👥" },
  { type: "applications", label: "आवेदन ग्राहक CSV", icon: "📥" },
  { type: "deliverables", label: "Completed Work / Deliverables CSV", icon: "✅" },
  { type: "invoices", label: "इनवॉइस / बिलिंग CSV", icon: "💰" },
  { type: "repairs", label: "रिपेयर जॉब CSV", icon: "🛠️" },
  { type: "bills", label: "बिल / Billing CSV", icon: "🧾" },
  { type: "payments", label: "भुगतान CSV", icon: "💳" },
  { type: "sales", label: "बिक्री CSV", icon: "📈" },
  { type: "purchases", label: "खरीद CSV", icon: "🛒" },
  { type: "products", label: "स्टॉक CSV", icon: "📦" },
  { type: "credit", label: "उधारी CSV", icon: "⏳" },
  { type: "bookings", label: "बुकिंग CSV", icon: "📅" },
  { type: "offers", label: "ऑफर CSV", icon: "🏷️" },
  { type: "feedback", label: "फीडबैक CSV", icon: "⭐" },
  { type: "profiles", label: "बिज़नेस प्रोफाइल CSV", icon: "🏪" },
  { type: "inquiries", label: "पूछताछ CSV", icon: "📩" },
  { type: "banners", label: "बैनर CSV", icon: "🖼" },
  { type: "learnings", label: "ट्रेनिंग CSV", icon: "🎓" },
  { type: "integrations", label: "इंटीग्रेशन CSV", icon: "🔗" },
  { type: "audit", label: "ऑडिट लॉग CSV", icon: "📜" },
  { type: "documents", label: "दस्तावेज़ CSV", icon: "📎" },
];

export default function SheetsPanel({ services }: { services: ServiceItem[] }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const filtered = useMemo(() => {
    if (!query.trim()) return services;
    const q = query.toLowerCase();
    return services.filter((s) => `${s.nameHi} ${s.nameEn} ${s.slug}`.toLowerCase().includes(q));
  }, [services, query]);

  return (
    <div className="space-y-3">
      {message ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          {message}
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((report) => (
          <a
            key={report.type}
            href={`/exports/${report.type}.csv`}
            className="card flex items-center gap-2.5 p-2.5 transition hover:border-indigo-300 hover:shadow-sm"
            onClick={() => setMessage(`⬇️ ${report.label} डाउनलोड हो रही है…`)}
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-base dark:bg-indigo-500/15">
              {report.icon}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">{report.label}</span>
              <span className="block text-[10px] text-slate-400">/exports/{report.type}.csv</span>
            </span>
          </a>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            REPORTS.forEach((report, index) => {
              setTimeout(() => {
                window.open(`/exports/${report.type}.csv`, "_blank");
              }, index * 350);
            });
            setMessage("📊 सभी रिपोर्ट CSV फाइलें बनाई व डाउनलोड की जा रही हैं (Google Sheet में IMPORTDATA से लिंक करें)।");
          }}
          className="btn-primary px-3 py-1.5 text-xs"
        >
          📊 CSV फाइलें बनाएँ / अपडेट करें
        </button>
        <a href="https://sheets.new" target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 text-xs">
          ➕ नई Google Sheet (sheets.new)
        </a>
        <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {services.length} सेवा-वार CSV उपलब्ध
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 p-3 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">📄 प्रति-सेवा CSV डाउनलोड</h3>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="सेवा खोजें…"
            className="input max-w-xs px-2 py-1.5 text-xs"
          />
        </div>
        <div className="mt-2 grid max-h-[420px] gap-1.5 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((service) => (
            <a
              key={service.slug}
              href={`/exports/services/${service.slug}.csv`}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs hover:border-indigo-300 dark:border-white/10"
            >
              <span className="min-w-0">
                <span className="block truncate font-bold text-slate-700 dark:text-slate-200">{service.nameHi}</span>
                <span className="block truncate text-[10px] text-slate-400">
                  {service.nameEn} · ₹{service.shopFee}
                </span>
              </span>
              <span className="shrink-0 rounded-lg bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                ⬇ CSV
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3 text-[11px] leading-relaxed text-indigo-900 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-200">
        <p className="font-extrabold">Google Sheet में सीधे लिंक करने का तरीका</p>
        <p className="mt-1">
          Google Sheet में किसी सेल में लिखें: <code className="rounded bg-white/70 px-1 dark:bg-black/30">=IMPORTDATA(&quot;https://your-domain/exports/services/aadhaar-update-assistance.csv&quot;)</code>{" "}
          — डेटा स्वतः फिर से लोड होगा।
        </p>
        <p className="mt-1">
          ऑटो सिंक के लिए <code className="rounded bg-white/70 px-1 dark:bg-black/30">GOOGLE_SHEETS_WEBHOOK_URL</code>{" "}
          (Apps Script doPost) या Service Account (<code>GOOGLE_CLIENT_EMAIL</code>, <code>GOOGLE_PRIVATE_KEY</code>,{" "}
          <code>GOOGLE_SHEETS_SPREADSHEET_ID</code>) environment variables सेट करें।
        </p>
      </div>
    </div>
  );
}
