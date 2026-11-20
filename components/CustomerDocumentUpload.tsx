"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CustomerDocumentUpload({ applications }: { applications: { refNo: string; serviceName: string }[] }) {
  const router = useRouter();
  const [refNo, setRefNo] = useState(applications[0]?.refNo ?? "");
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const pick = (list: FileList | null) => {
    const incoming = Array.from(list ?? []);
    const bad = incoming.find((file) => file.size < 5 * 1024 || file.size > 100 * 1024 * 1024);
    if (bad) { setMessage(`❌ "${bad.name}" 5 KB–100 MB सीमा में होनी चाहिए`); return; }
    setMessage("");
    setFiles((prev) => [...prev, ...incoming]);
  };

  async function upload() {
    if (!refNo) { setMessage("❌ पहले आवेदन चुनें"); return; }
    if (!files.length) { setMessage("❌ कम से कम एक फाइल चुनें"); return; }
    if (!consent) { setMessage("❌ सहमति देना आवश्यक है"); return; }
    setBusy(true);
    const data = new FormData();
    data.set("applicationRef", refNo);
    data.set("comment", comment);
    files.forEach((file) => {
      data.append("docType", "Other Document (अन्य दस्तावेज़)");
      data.append("docFile", file);
    });
    const response = await fetch("/api/customer/documents", { method: "POST", body: data }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      const json = (await response?.json().catch(() => null)) as { error?: string } | null;
      setMessage(`❌ ${json?.error ?? "अपलोड विफल"}`);
      return;
    }
    const json = (await response.json()) as { saved: number };
    setMessage(`✅ ${json.saved} दस्तावेज़ अपलोड हो गए — दुकान को सूचना मिल गई`);
    setFiles([]);
    setComment("");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="label">आवेदन चुनें</label>
          <select value={refNo} onChange={(e) => setRefNo(e.target.value)} className="input py-1.5 text-xs">
            {applications.map((app) => <option key={app.refNo} value={app.refNo}>{app.refNo} — {app.serviceName}</option>)}
          </select>
        </div>
        <div>
          <label className="label">टिप्पणी (वैकल्पिक)</label>
          <input value={comment} onChange={(e) => setComment(e.target.value)} className="input py-1.5 text-xs" placeholder="जैसे: नया आधार कार्ड" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <label className="btn-ghost cursor-pointer px-2.5 py-1.5 text-[11px]">📎 फाइल चुनें<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*" className="hidden" onChange={(e) => pick(e.target.files)} /></label>
        <label className="btn-ghost cursor-pointer px-2.5 py-1.5 text-[11px]">📷 कैमरा<input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files)} /></label>
        <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">{files.length} फाइलें · 5 KB–100 MB</span>
      </div>
      {files.length > 0 ? (
        <div className="space-y-1">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1 text-[11px] dark:bg-white/5">
              <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{file.name} · {Math.round(file.size / 1024)} KB</span>
              <div className="flex gap-1">
                <a href={URL.createObjectURL(file)} target="_blank" rel="noreferrer" className="btn-ghost px-1.5 py-0.5 text-[10px]">👁 View</a>
                <button type="button" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))} className="btn-danger px-1.5 py-0.5 text-[10px]">✕</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <label className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
        मैं सहमत हूँ कि ये दस्तावेज़ केवल मेरे आवेदन के लिए सुरक्षित रूप से उपयोग किए जाएँ।
      </label>
      {message ? <p className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{message}</p> : null}
      <button type="button" onClick={upload} disabled={busy} className="btn-primary px-3 py-1.5 text-xs">{busy ? "⏳ अपलोड…" : "⬆️ दस्तावेज़ अपलोड करें"}</button>
    </div>
  );
}
