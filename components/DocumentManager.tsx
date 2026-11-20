"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export type DocItem = {
  id: number;
  docType: string;
  fileId: number;
  fileName: string;
  fileSize: number;
  comment: string | null;
  uploadedBy: string;
  serviceSlug: string | null;
  version: number;
  createdAt: string;
};

const DOC_TYPES = ["आधार कार्ड", "पैन कार्ड", "राशन कार्ड", "समग्र परिवार आईडी", "मतदाता आईडी", "जन्म प्रमाण पत्र", "जाति प्रमाण पत्र", "आय प्रमाण पत्र", "निवास प्रमाण पत्र", "शैक्षणिक मार्कशीट", "बैंक पासबुक", "पासपोर्ट साइज़ फोटो", "हस्ताक्षर", "Other Document (अन्य दस्तावेज़)"];

export default function DocumentManager({ documents }: { documents: DocItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<DocItem[]>(documents);
  const [editing, setEditing] = useState<{ id: number; docType: string; comment: string; replace: File | null } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const refresh = () => router.refresh();

  async function save() {
    if (!editing) return;
    setBusy(true);
    let response: Response | null;
    if (editing.replace) {
      const data = new FormData();
      data.set("docType", editing.docType);
      data.set("comment", editing.comment);
      data.set("docFile", editing.replace);
      response = await fetch(`/api/customer/documents/${editing.id}`, { method: "PATCH", body: data }).catch(() => null);
    } else {
      response = await fetch(`/api/customer/documents/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType: editing.docType, comment: editing.comment }),
      }).catch(() => null);
    }
    setBusy(false);
    if (!response || !response.ok) {
      const json = (await response?.json().catch(() => null)) as { error?: string } | null;
      setMessage(`❌ ${json?.error ?? "सहेजा नहीं जा सका"}`);
      return;
    }
    setItems((prev) => prev.map((item) => (item.id === editing.id ? { ...item, docType: editing.docType, comment: editing.comment } : item)));
    setMessage(editing.replace ? "✅ दस्तावेज़ बदल दिया गया (नया संस्करण)" : "✅ विवरण अपडेट हुआ");
    setEditing(null);
    refresh();
  }

  async function remove(item: DocItem) {
    if (!window.confirm(`"${item.docType}" दस्तावेज़ हटाना है?`)) return;
    const snapshot = items;
    setItems((prev) => prev.filter((doc) => doc.id !== item.id));
    const response = await fetch(`/api/customer/documents/${item.id}`, { method: "DELETE" }).catch(() => null);
    if (!response || !response.ok) {
      const json = (await response?.json().catch(() => null)) as { error?: string } | null;
      setItems(snapshot);
      setMessage(`❌ ${json?.error ?? "नहीं हटाया जा सका"}`);
      return;
    }
    setMessage("🗑️ दस्तावेज़ हटा दिया गया");
    refresh();
  }

  function printDoc(item: DocItem) {
    const win = window.open("", "_blank", "width=720,height=900");
    if (!win) return;
    win.document.write(`<html><head><title>${item.docType}</title><meta charset="utf-8"></head><body style="font-family:system-ui,'Noto Sans Devanagari',sans-serif;padding:18px">
      <h2 style="margin:0">Dheerendra Prajapati Digital Seva Kendra</h2>
      <p style="margin:2px 0 12px;font-size:12px">Bajar Mohalla, Amanganj, Panna (M.P.) 488441 · 7610420959</p>
      <h3 style="margin:0 0 6px">दस्तावेज़: ${item.docType}</h3>
      <p style="font-size:12px;margin:0 0 4px">फाइल: ${item.fileName} · ${Math.round(item.fileSize / 1024)} KB · संस्करण ${item.version}</p>
      <p style="font-size:12px;margin:0 0 10px">टिप्पणी: ${item.comment || "—"} · अपलोड: ${item.createdAt}</p>
      <iframe src="/api/files/${item.fileId}" style="width:100%;height:70vh;border:1px solid #cbd5e1"></iframe>
      <script>window.onload=function(){setTimeout(function(){window.print();},900);}</script>
      </body></html>`);
    win.document.close();
  }

  if (items.length === 0) {
    return <p className="rounded-xl bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500 dark:bg-white/5 dark:text-slate-400">अभी कोई दस्तावेज़ नहीं। ऊपर से नया दस्तावेज़ भेजें या किसी आवेदन में जोड़ें।</p>;
  }

  return (
    <div className="space-y-2" ref={printRef}>
      {message ? <p className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{message}</p> : null}
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-slate-200 p-2.5 dark:border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{item.docType}</p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {item.fileName} · {Math.max(1, Math.round(item.fileSize / 1024))} KB · v{item.version} · {item.uploadedBy === "customer" ? "आपके द्वारा" : "दुकान द्वारा"}
              </p>
              {item.comment ? <p className="text-[10px] text-slate-400">टिप्पणी: {item.comment}</p> : null}
            </div>
            <div className="flex flex-wrap gap-1">
              <a href={`/api/files/${item.fileId}`} target="_blank" rel="noreferrer" className="btn-ghost px-2 py-1 text-[10px]">👁 View</a>
              {item.uploadedBy === "customer" ? (
                <>
                  <button type="button" onClick={() => setEditing({ id: item.id, docType: item.docType, comment: item.comment ?? "", replace: null })} className="btn-soft px-2 py-1 text-[10px]">✏️ Edit</button>
                  <button type="button" onClick={() => setEditing({ id: item.id, docType: item.docType, comment: item.comment ?? "", replace: null })} className="btn-ghost px-2 py-1 text-[10px]">🔁 Replace</button>
                  <button type="button" onClick={() => remove(item)} className="btn-danger px-2 py-1 text-[10px]">🗑 Delete</button>
                </>
              ) : null}
              <a href={`/api/files/${item.fileId}`} download className="btn-ghost px-2 py-1 text-[10px]">⬇ Download</a>
              <button type="button" onClick={() => printDoc(item)} className="btn-ghost px-2 py-1 text-[10px]">🖨 Print</button>
            </div>
          </div>

          {editing?.id === item.id ? (
            <div className="mt-2 space-y-1.5 rounded-lg bg-slate-50 p-2 dark:bg-white/5">
              <div className="grid gap-1.5 sm:grid-cols-2">
                <div>
                  <label className="label">दस्तावेज़ प्रकार</label>
                  <select value={editing.docType} onChange={(e) => setEditing({ ...editing, docType: e.target.value })} className="input py-1 text-[11px]">
                    {[editing.docType, ...DOC_TYPES.filter((doc) => doc !== editing.docType)].map((doc) => <option key={doc} value={doc}>{doc}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">टिप्पणी</label>
                  <input value={editing.comment} onChange={(e) => setEditing({ ...editing, comment: e.target.value })} className="input py-1 text-[11px]" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <label className="btn-ghost cursor-pointer px-2 py-1 text-[10px]">🔁 नई फाइल (Replace)<input type="file" className="hidden" onChange={(e) => setEditing({ ...editing, replace: e.target.files?.[0] ?? null })} /></label>
                {editing.replace ? <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">नई: {editing.replace.name}</span> : null}
                <button type="button" onClick={save} disabled={busy} className="btn-primary px-2 py-1 text-[10px]">{busy ? "⏳…" : "💾 सहेजें"}</button>
                <button type="button" onClick={() => setEditing(null)} className="btn-ghost px-2 py-1 text-[10px]">रद्द</button>
              </div>
              <p className="text-[10px] text-slate-400">Replace करने पर पुराना फाइल सुरक्षित रहता है (संस्करण बढ़ता है) — 5 KB से 100 MB तक।</p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
