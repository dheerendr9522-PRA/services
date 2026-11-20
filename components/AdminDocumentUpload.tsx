"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminDocumentUpload({
  applications,
}: {
  applications: { id: number; refNo: string; customer: string; service: string }[];
}) {
  const router = useRouter();
  const [appId, setAppId] = useState(String(applications[0]?.id ?? ""));
  const [docType, setDocType] = useState("तैयार दस्तावेज़");
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [complete, setComplete] = useState(true);
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
    if (!appId) { setMessage("❌ आवेदन चुनें"); return; }
    if (!files.length) { setMessage("❌ कम से कम एक फाइल चुनें"); return; }
    setBusy(true);
    const data = new FormData();
    data.set("note", comment);
    data.set("markCompleted", complete ? "1" : "0");
    files.forEach((file) => {
      data.append("docType", docType);
      data.append("docFile", file);
    });
    const response = await fetch(`/api/applications/${appId}/documents`, { method: "POST", body: data }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      const json = (await response?.json().catch(() => null)) as { error?: string } | null;
      setMessage(`❌ ${json?.error ?? "अपलोड विफल"}`);
      return;
    }
    const json = (await response.json()) as { saved: number; completed?: boolean };
    setMessage(`✅ ${json.saved} दस्तावेज़ जोड़े गए${json.completed ? " · आवेदन Completed" : ""}`);
    setFiles([]);
    setComment("");
    router.refresh();
  }

  return (
    <div className="space-y-1.5">
      <div className="grid gap-1.5 sm:grid-cols-2">
        <div>
          <label className="label">आवेदन चुनें</label>
          <select value={appId} onChange={(e) => setAppId(e.target.value)} className="input py-1.5 text-xs">
            {applications.map((app) => <option key={app.id} value={app.id}>{app.refNo} — {app.customer} · {app.service}</option>)}
          </select>
        </div>
        <div>
          <label className="label">दस्तावेज़ प्रकार</label>
          <input value={docType} onChange={(e) => setDocType(e.target.value)} className="input py-1.5 text-xs" placeholder="तैयार दस्तावेज़ / आधार कार्ड" />
        </div>
      </div>
      <input value={comment} onChange={(e) => setComment(e.target.value)} className="input py-1.5 text-xs" placeholder="नोट (वैकल्पिक)" />
      <div className="flex flex-wrap items-center gap-1.5">
        <label className="btn-ghost cursor-pointer px-2.5 py-1.5 text-[11px]">📎 फाइलें चुनें<input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*" className="hidden" onChange={(e) => pick(e.target.files)} /></label>
        <label className="btn-ghost cursor-pointer px-2.5 py-1.5 text-[11px]">📷 कैमरा<input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files)} /></label>
        <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">{files.length} फाइलें</span>
        <label className="flex items-center gap-1 text-[11px] font-semibold"><input type="checkbox" checked={complete} onChange={(e) => setComplete(e.target.checked)} /> आवेदन Completed करें + ग्राहक को सूचना</label>
      </div>
      {files.length > 0 ? (
        <div className="space-y-1">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1 text-[11px] dark:bg-white/5">
              <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{file.name} · {Math.round(file.size / 1024)} KB</span>
              <button type="button" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))} className="btn-danger px-1.5 py-0.5 text-[10px]">✕</button>
            </div>
          ))}
        </div>
      ) : null}
      {message ? <p className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{message}</p> : null}
      <button type="button" onClick={upload} disabled={busy} className="btn-primary px-3 py-1.5 text-xs">{busy ? "⏳…" : "⬆️ दस्तावेज़ अपलोड करें"}</button>
    </div>
  );
}
