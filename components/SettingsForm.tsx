"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const TEXT_FIELDS: { key: string; label: string; hint?: string; type?: string }[] = [
  { key: "businessName", label: "व्यवसाय का नाम" },
  { key: "tagline", label: "टैगलाइन" },
  { key: "ownerName", label: "मालिक का नाम" },
  { key: "phonePrimary", label: "मोबाइल / WhatsApp (Primary)" },
  { key: "phoneSecondary", label: "दूसरा मोबाइल" },
  { key: "email", label: "ईमेल", type: "email" },
  { key: "address", label: "पता" },
  { key: "mapsUrl", label: "Google Maps लिंक" },
  { key: "heroNote", label: "होम हीरो नोट" },
  { key: "upiName", label: "UPI खाता नाम" },
  { key: "upiId", label: "UPI ID" },
  { key: "upiMobile", label: "UPI मोबाइल नंबर" },
];

const TOGGLES: { key: string; label: string; hint: string }[] = [
  { key: "groupDigital", label: "🏛️ डिजिटल सेवा केंद्र मेन्यू", hint: "साइडबार ग्रुप 1 ON/OFF" },
  { key: "groupShop", label: "🖥️ कंप्यूटर शॉप मेन्यू", hint: "साइडबार ग्रुप 2 ON/OFF" },
  { key: "groupAccount", label: "📁 मेरा खाता व आवेदन मेन्यू", hint: "साइडबार ग्रुप 3 ON/OFF" },
  { key: "groupAdmin", label: "📋 प्रबंधन (एडमिन) मेन्यू", hint: "साइडबार ग्रुप 4 ON/OFF — कस्टमर को कभी नहीं दिखता" },
  { key: "adminLoginEnabled", label: "एडमिन लॉगिन लिंक", hint: "मेन्यू में Admin Login दिखे या नहीं" },
  { key: "loginPageVisible", label: "एडमिन लॉगिन पेज दिखाएँ", hint: "बंद करने पर Owner Access Key स्क्रीन आएगी" },
  { key: "showCredentials", label: "लॉगिन पेज पर ID/पासवर्ड दिखाएँ", hint: "डेमो हेल्पर कार्ड Show/Hide" },
  { key: "upiEnabled", label: "UPI QR भुगतान", hint: "बंद करने पर QR/UPI बॉक्स छिपेगा" },
  { key: "mobileUpiEnabled", label: "मोबाइल नंबर UPI", hint: "मोबाइल से UPI भुगतान विकल्प" },
  { key: "bannerEnabled", label: "चलता हुआ नाम बैनर", hint: "मार्की बैनर चालू/बंद" },
  { key: "offersEnabled", label: "ऑफर पेज", hint: "/offers पेज चालू/बंद" },
  { key: "feedbackEnabled", label: "फीडबैक व रेटिंग फॉर्म", hint: "ग्राहक रेटिंग फॉर्म Show/Hide" },
  { key: "pushEnabled", label: "सूचना (🔔) सूची", hint: "इन-ऐप नोटिफिकेशन" },
];

export default function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({ ...settings });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    const payload: Record<string, string> = {};
    [...TEXT_FIELDS, ...TOGGLES].forEach((field) => {
      payload[field.key] = form[field.key] ?? "";
    });
    ["displayLoginId", "displayLoginPassword", "ownerUnlockKey", "customerPin", "logoUrl", "profileUrl", "bannerText", "bannerSpeed", "brandColor", "accentColor", "businessHours", "gmbLink"].forEach((key) => {
      payload[key] = form[key] ?? "";
    });
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      setError("सेटिंग्स सहेजी नहीं जा सकीं — अनुमति जाँचें");
      return;
    }
    setMessage("✅ सेटिंग्स सहेजी गईं और पूरे ऐप में लागू हो गईं");
    router.refresh();
    setTimeout(() => setMessage(""), 3000);
  }

  async function uploadImage(file: File | null, key: "logoUrl" | "profileUrl") {
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    setBusy(true);
    const response = await fetch("/api/upload", { method: "POST", body: data }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      setError("इमेज अपलोड नहीं हुई");
      return;
    }
    const json = (await response.json()) as { url?: string };
    if (json.url) set(key, json.url);
    setMessage("🖼️ इमेज अपलोड हुई — अब नीचे सेव करें");
  }

  const toggle = (key: string) => (
    <button
      key={key}
      type="button"
      onClick={() => set(key, form[key] === "0" ? "1" : "0")}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${form[key] === "0" ? "bg-rose-400" : "bg-emerald-500"}`}
      aria-label={`${key} toggle`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${form[key] === "0" ? "left-0.5" : "left-[22px]"}`}
      />
    </button>
  );

  return (
    <div className="space-y-3">
      {message ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <div className="card p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🖼️ ब्रांडिंग — Logo व Admin Profile</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-2.5 dark:border-white/10">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">App Logo</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-indigo-50 text-sm font-black text-indigo-700 dark:bg-white/10">
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoUrl} alt="logo" className="h-full w-full object-cover" />
                ) : (
                  "DP"
                )}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => uploadImage(e.target.files?.[0] ?? null, "logoUrl")}
                className="input px-2 py-1 text-[11px]"
              />
            </div>
            <input
              value={form.logoUrl ?? ""}
              onChange={(e) => set("logoUrl", e.target.value)}
              placeholder="/api/files/1 या बाहरी URL"
              className="input mt-1 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="rounded-xl border border-slate-200 p-2.5 dark:border-white/10">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Admin Profile Picture</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-emerald-50 text-sm font-black text-emerald-700 dark:bg-white/10">
                {form.profileUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.profileUrl} alt="profile" className="h-full w-full object-cover" />
                ) : (
                  "👤"
                )}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => uploadImage(e.target.files?.[0] ?? null, "profileUrl")}
                className="input px-2 py-1 text-[11px]"
              />
            </div>
            <input
              value={form.profileUrl ?? ""}
              onChange={(e) => set("profileUrl", e.target.value)}
              placeholder="प्रोफाइल इमेज URL"
              className="input mt-1 px-2 py-1 text-[11px]"
            />
          </div>
        </div>
      </div>

      <div className="card p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">✨ चलता हुआ नाम बैनर व रंग</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2 xl:col-span-4">
            <label className="label">बैनर का टेक्स्ट (खाली = व्यवसाय नाम + संपर्क)</label>
            <input value={form.bannerText ?? ""} onChange={(e) => set("bannerText", e.target.value)} placeholder="जैसे: आज आधार अपडेट उपलब्ध ★ रेल टिकट बुकिंग" className="input py-1.5 text-xs" />
          </div>
          <div>
            <label className="label">गति (सेकंड में एक चक्कर)</label>
            <input type="number" min={8} max={90} value={form.bannerSpeed ?? "28"} onChange={(e) => set("bannerSpeed", e.target.value)} className="input py-1.5 text-xs" />
          </div>
          <div>
            <label className="label">मुख्य रंग (Brand)</label>
            <input type="color" value={form.brandColor ?? "#4f46e5"} onChange={(e) => set("brandColor", e.target.value)} className="input h-9 py-1" />
          </div>
          <div>
            <label className="label">दूसरा रंग (Accent)</label>
            <input type="color" value={form.accentColor ?? "#f97316"} onChange={(e) => set("accentColor", e.target.value)} className="input h-9 py-1" />
          </div>
          <div>
            <label className="label">Google Business लिंक</label>
            <input value={form.gmbLink ?? ""} onChange={(e) => set("gmbLink", e.target.value)} className="input py-1.5 text-xs" />
          </div>
        </div>
        <div className="mt-2 rounded-xl bg-indigo-600 py-1 text-center text-[11px] font-semibold text-white" style={{ backgroundColor: form.brandColor }}>
          <div className="marquee-track" style={{ animationDuration: `${form.bannerSpeed || 28}s` }}>
            <span className="px-6">{form.bannerText || "धीरेन्द्र प्रजापति कंप्यूटर हार्डवेयर, सॉफ्टवेयर एवं डिजिटल सेवा केंद्र ★ आपकी डिजिटल सेवाएँ, एक ही जगह।"}</span>
            <span className="px-6">{form.bannerText || "धीरेन्द्र प्रजापति कंप्यूटर हार्डवेयर, सॉफ्टवेयर एवं डिजिटल सेवा केंद्र ★ आपकी डिजिटल सेवाएँ, एक ही जगह।"}</span>
          </div>
        </div>
      </div>

      <div className="card p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🏪 व्यवसाय व भुगतान जानकारी</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {TEXT_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              <input
                type={field.type ?? "text"}
                value={form[field.key] ?? ""}
                onChange={(e) => set(field.key, e.target.value)}
                className="input py-1.5 text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🎛️ मेन्यू व लॉगिन नियंत्रण (ON/OFF)</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {TOGGLES.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-2 dark:border-white/10">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{item.label}</p>
                <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{item.hint}</p>
              </div>
              {toggle(item.key)}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🔐 लॉगिन ID/पासवर्ड प्रदर्शन व सुरक्षा</h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          डिस्प्ले ID/पासवर्ड केवल लॉगिन पेज के हेल्पर कार्ड पर दिखते हैं। वास्तविक स्टाफ ID/पासवर्ड बदलने के लिए
          “यूज़र प्रबंधन” पेज का उपयोग करें।
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["displayLoginId", "डिस्प्ले ID"],
            ["displayLoginPassword", "डिस्प्ले पासवर्ड"],
            ["ownerUnlockKey", "Owner Access Key"],
            ["customerPin", "कस्टमर पिन"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                value={form[key] ?? ""}
                onChange={(e) => set(key, e.target.value)}
                className="input py-1.5 text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg dark:border-white/10 dark:bg-slate-900/95">
        <button type="button" onClick={save} disabled={busy} className="btn-primary px-4 py-2 text-xs">
          {busy ? "⏳ सहेजा जा रहा…" : "💾 सभी सेटिंग्स सहेजें"}
        </button>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          बदलाव तुरंत साइडबार, हेडर, लॉगिन पेज व पूरे ऐप में लागू होते हैं।
        </span>
      </div>
    </div>
  );
}
