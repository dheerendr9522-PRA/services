"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type DesignState = {
  primary: string;
  accent: string;
  sidebar: string;
  surface: string;
  text: string;
  radius: number;
  cardShadow: string;
  cardPadding: number;
  cardBorderWidth: number;
  headingSize: number;
  bodySize: number;
  buttonRadius: number;
  buttonStyle: string;
  gridColumns: number;
  sidebarWidth: number;
  pagePadding: number;
  preset: string;
  fontHindi: string;
  fontEnglish: string;
};

const PRESETS: { key: string; label: string; state: Partial<DesignState> }[] = [
  { key: "dp-blue", label: "DP Blue", state: { primary: "#4f46e5", accent: "#f97316", sidebar: "#0f172a", surface: "#ffffff", text: "#0f172a" } },
  { key: "professional-white", label: "Professional White", state: { primary: "#1d4ed8", accent: "#0ea5e9", sidebar: "#f1f5f9", surface: "#ffffff", text: "#0f172a" } },
  { key: "modern-purple", label: "Modern Purple", state: { primary: "#7c3aed", accent: "#ec4899", sidebar: "#1e1b4b", surface: "#ffffff", text: "#111827" } },
  { key: "green-seva", label: "Green Digital Seva", state: { primary: "#059669", accent: "#f59e0b", sidebar: "#052e16", surface: "#ffffff", text: "#0f172a" } },
  { key: "dark", label: "Dark Mode", state: { primary: "#6366f1", accent: "#f97316", sidebar: "#020617", surface: "#0f172a", text: "#e2e8f0" } },
];

export default function DesignStudio({
  initial,
  banners,
  versions,
}: {
  initial: DesignState;
  banners: { id: number; title: string; status: string; targetPage: string }[];
  versions: { id: number; versionNo: number; createdAt: string; changedBy: string | null }[];
}) {
  const router = useRouter();
  const [design, setDesign] = useState<DesignState>(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<"desktop" | "mobile">("desktop");

  const set = (key: keyof DesignState, value: string | number) => setDesign((prev) => ({ ...prev, [key]: value }));

  async function save(note = "डिज़ाइन अपडेट") {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/design", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ design, note }),
    }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      setMessage("❌ डिज़ाइन सहेजा नहीं जा सका");
      return;
    }
    setMessage("✅ डिज़ाइन सहेजा व प्रकाशित — पूरे ऐप में लागू हो गया");
    router.refresh();
  }

  async function restore(versionId: number) {
    if (!window.confirm("इस पुराने डिज़ाइन पर लौटना है?")) return;
    setBusy(true);
    const response = await fetch("/api/design", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restoreVersionId: versionId }),
    }).catch(() => null);
    setBusy(false);
    if (response && response.ok) {
      setMessage("♻ पुराना डिज़ाइन बहाल हो गया — पेज रीलोड करें");
      router.refresh();
    } else {
      setMessage("❌ बहाली विफल");
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">Preset Themes:</span>
          {PRESETS.map((preset) => (
            <button key={preset.key} type="button" onClick={() => setDesign((prev) => ({ ...prev, ...preset.state, preset: preset.key }))} className="btn-ghost px-2 py-1 text-[11px]">
              {preset.label}
            </button>
          ))}
          <span className="ml-auto flex gap-1">
            <button type="button" onClick={() => setPreview("desktop")} className={`chip ${preview === "desktop" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10"}`}>🖥 Desktop</button>
            <button type="button" onClick={() => setPreview("mobile")} className={`chip ${preview === "mobile" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10"}`}>📱 Mobile</button>
          </span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🎨 रंग (Theme Colors)</h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([
                ["primary", "Primary"], ["accent", "Accent"], ["sidebar", "Sidebar"], ["surface", "Card Background"], ["text", "Text"],
              ] as [keyof DesignState, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type="color" value={String(design[key])} onChange={(e) => set(key, e.target.value)} className="input h-9 py-1" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">📐 Layout व Typography</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {([
                ["radius", "Corner Radius (px)", 0, 32], ["cardPadding", "Card Padding (px)", 4, 32],
                ["cardBorderWidth", "Card Border (px)", 0, 4], ["headingSize", "Heading Size (px)", 14, 32],
                ["bodySize", "Body Size (px)", 10, 18], ["buttonRadius", "Button Radius (px)", 0, 999],
                ["gridColumns", "Grid Columns", 1, 4], ["sidebarWidth", "Sidebar Width", 200, 280], ["pagePadding", "Page Padding", 4, 32],
              ] as [keyof DesignState, string, number, number][]).map(([key, label, min, max]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type="number" min={min} max={max} value={Number(design[key])} onChange={(e) => set(key, Number(e.target.value))} className="input py-1 text-xs" />
                </div>
              ))}
              <div>
                <label className="label">Button Style</label>
                <select value={design.buttonStyle} onChange={(e) => set("buttonStyle", e.target.value)} className="input py-1 text-xs">
                  {["rounded", "pill", "square", "outline", "filled"].map((style) => <option key={style} value={style}>{style}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Card Shadow</label>
                <select value={design.cardShadow} onChange={(e) => set("cardShadow", e.target.value)} className="input py-1 text-xs">
                  {["none", "sm", "md", "lg"].map((shadow) => <option key={shadow} value={shadow}>{shadow}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button type="button" disabled={busy} onClick={() => save("डिज़ाइन सहेजें")} className="btn-primary px-3 py-1.5 text-xs">{busy ? "⏳…" : "💾 Save Draft"}</button>
            <button type="button" disabled={busy} onClick={() => save("प्रकाशित (published)")} className="btn-soft px-3 py-1.5 text-xs">🚀 Publish Changes</button>
            <button type="button" onClick={() => setDesign(initial)} className="btn-ghost px-3 py-1.5 text-xs">↺ Reset Preview</button>
            {message ? <span className="self-center text-[11px] font-bold text-emerald-600 dark:text-emerald-300">{message}</span> : null}
          </div>
        </div>

        <div className={`${preview === "mobile" ? "mx-auto max-w-[340px]" : ""} rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-slate-800`}>
          <p className="mb-1 text-center text-[10px] font-bold uppercase text-slate-400">Live Preview ({preview})</p>
          <div className="overflow-hidden rounded-xl" style={{ background: design.surface, color: design.text }}>
            <div className="px-3 py-2 text-[11px] font-bold text-white" style={{ background: design.primary }}>
              धीरेन्द्र प्रजापति डिजिटल सेवा केंद्र
            </div>
            <div className="p-2" style={{ padding: design.pagePadding }}>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(design.gridColumns, preview === "mobile" ? 1 : 4)}, minmax(0,1fr))` }}>
                {["आधार अपडेट", "पैन कार्ड", "लैपटॉप रिपेयर", "प्रिंटिंग"].map((label) => (
                  <div key={label} style={{ background: design.surface, borderRadius: design.radius, padding: design.cardPadding, borderWidth: design.cardBorderWidth, borderColor: "#cbd5e1", borderStyle: "solid", boxShadow: design.cardShadow === "none" ? "none" : "0 2px 8px rgba(15,23,42,.12)" }}>
                    <p style={{ fontSize: design.headingSize * 0.7, fontWeight: 800 }}>{label}</p>
                    <p style={{ fontSize: design.bodySize }} className="opacity-70">₹ शुल्क · 1 दिन</p>
                    <button type="button" style={{ background: design.primary, borderRadius: design.buttonStyle === "pill" ? 999 : design.buttonRadius, color: "#fff", fontSize: design.bodySize, padding: "3px 8px", marginTop: 4 }}>आवेदन करें</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-2 py-1 text-[10px] text-white" style={{ background: design.accent }}>
              {banners.length} बैनर सक्रिय · फुटर रंग
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🕘 Version History ({versions.length})</h2>
        <div className="mt-1.5 space-y-1">
          {versions.map((version) => (
            <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-2 py-1 text-[11px] dark:border-white/10">
              <span className="font-bold">v{version.versionNo} · {new Date(version.createdAt).toLocaleString("en-IN")} · {version.changedBy}</span>
              <button type="button" onClick={() => restore(version.id)} className="btn-ghost px-2 py-0.5 text-[10px]">♻ Restore</button>
            </div>
          ))}
          {versions.length === 0 ? <p className="text-xs text-slate-400">अभी कोई संस्करण सहेजा नहीं गया।</p> : null}
        </div>
      </div>
    </div>
  );
}
