"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ApplicationActions({
  application,
  canDelete,
}: {
  application: {
    id: number;
    refNo: string;
    status: string;
    adminNote: string | null;
    amount: number;
    completedFileId: number | null;
    completedFileName: string | null;
    documentCount: number;
  };
  canDelete: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(application.status);
  const [note, setNote] = useState(application.adminNote ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showComplete, setShowComplete] = useState(false);

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    const response = await fetch(`/api/applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      setMessage("❌ त्रुटि");
      return false;
    }
    setMessage("✅ सहेजा गया");
    router.refresh();
    setTimeout(() => setMessage(""), 2000);
    return true;
  }

  async function uploadCompleted(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("note", note);
    setBusy(true);
    const response = await fetch(`/api/applications/${application.id}`, {
      method: "POST",
      body: formData,
    }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      const json = (await response?.json().catch(() => null)) as { error?: string } | null;
      setMessage(json?.error ?? "❌ अपलोड त्रुटि");
      return;
    }
    setStatus("Completed");
    setShowComplete(false);
    setMessage("✅ तैयार दस्तावेज़ अपलोड हुआ");
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`आवेदन ${application.refNo} हटाना है?`)) return;
    const response = await fetch(`/api/applications/${application.id}`, { method: "DELETE" }).catch(() => null);
    if (!response || !response.ok) {
      setMessage("❌ केवल Owner हटा सकता है");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-2 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2 dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            void patch({ status: e.target.value });
          }}
          className="input max-w-[130px] px-2 py-1 text-[11px]"
        >
          {["Pending", "Processing", "Documents Pending", "Payment Pending", "In Progress", "Completed", "Rejected", "Cancelled"].map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="एडमिन नोट"
          className="input max-w-[220px] px-2 py-1 text-[11px]"
        />
        <button type="button" onClick={() => patch({ adminNote: note, status })} disabled={busy} className="btn-soft px-2 py-1 text-[11px]">
          💾 नोट सहेजें
        </button>
        <button type="button" onClick={() => setShowComplete((v) => !v)} className="btn-primary px-2 py-1 text-[11px]">
          ⬆️ तैयार दस्तावेज़ अपलोड
        </button>
        {application.completedFileId ? (
          <a href={`/api/files/${application.completedFileId}`} className="btn-ghost px-2 py-1 text-[11px]">
            📄 {application.completedFileName?.slice(0, 18) ?? "Download"}
          </a>
        ) : null}
        {application.documentCount > 0 ? (
          <a href={`/api/applications/${application.id}/zip`} className="btn-ghost px-2 py-1 text-[11px]">
            📦 ग्राहक दस्तावेज़ ZIP
          </a>
        ) : null}
        {canDelete ? (
          <button type="button" onClick={remove} className="btn-danger px-2 py-1 text-[11px]">
            🗑 Delete
          </button>
        ) : null}
        {message ? <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-300">{message}</span> : null}
      </div>
      {showComplete ? (
        <form onSubmit={uploadCompleted} className="flex flex-wrap items-center gap-1.5">
          <input type="file" name="completedFile" required className="input max-w-[240px] px-2 py-1 text-[11px]" />
          <button type="submit" disabled={busy} className="btn-primary px-2 py-1 text-[11px]">
            {busy ? "⏳…" : "अपलोड व Completed करें"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
