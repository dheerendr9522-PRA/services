"use client";

import { useState } from "react";

export default function ResendDocsForm({ applicationId, refNo }: { applicationId: number; refNo: string }) {
  const [open, setOpen] = useState(false);
  const [remark, setRemark] = useState("कृपया स्पष्ट फोटो/PDF में दस्तावेज़ दोबारा अपलोड करें");
  const [documentsNeeded, setDocumentsNeeded] = useState("आधार कार्ड, मार्कशीट, फोटो");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  async function send() {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resendRequest: true, remark, documentsNeeded }),
    }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      setMessage("❌ अनुरोध नहीं भेजा जा सका");
      return;
    }
    const json = (await response.json()) as { message?: string; whatsapp?: string };
    setMessage(`✅ ${json.message ?? "अनुरोध भेज दिया गया"}`);
    setWhatsapp(json.whatsapp ?? "");
  }

  return (
    <div className="mt-2 rounded-xl border border-amber-300 bg-amber-50/70 p-2 dark:border-amber-400/30 dark:bg-amber-500/10">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-[11px] font-extrabold text-amber-800 dark:text-amber-200">
        🔄 ग्राहक से दस्तावेज़ दोबारा माँगें (Refill Request) {open ? "▴" : "▾"}
      </button>
      {open ? (
        <div className="mt-1.5 space-y-1.5">
          <textarea rows={2} value={remark} onChange={(e) => setRemark(e.target.value)} className="input py-1.5 text-[11px]" placeholder="कारण / रिमार्क" />
          <input value={documentsNeeded} onChange={(e) => setDocumentsNeeded(e.target.value)} className="input py-1.5 text-[11px]" placeholder="आवश्यक दस्तावेज़ (कॉमा से अलग)" />
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={send} disabled={busy} className="btn-primary px-2.5 py-1.5 text-[11px]">{busy ? "⏳…" : "📨 अनुरोध भेजें"}</button>
            {whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer" className="btn bg-emerald-500 px-2.5 py-1.5 text-[11px] text-white">💬 WhatsApp पर भेजें</a> : null}
          </div>
          {message ? <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{message}</p> : null}
          <p className="text-[10px] text-slate-500 dark:text-slate-400">भेजने पर आवेदन स्थिति “Documents Pending” हो जाती है और ग्राहक के पोर्टल पर सूचना जाती है ({refNo})।</p>
        </div>
      ) : null}
    </div>
  );
}
