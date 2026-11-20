"use client";

import { useState } from "react";

export default function InquiryForm({ profileSlug }: { profileSlug: string }) {
  const [form, setForm] = useState({ name: "", mobile: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, profileSlug }),
    }).catch(() => null);
    setBusy(false);
    if (response && response.ok) {
      setDone(true);
      setForm({ name: "", mobile: "", message: "" });
    }
  }

  return (
    <form onSubmit={submit} className="mt-1.5 space-y-1.5">
      {done ? <p className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">✅ पूछताछ भेज दी गई — दुकान जल्द संपर्क करेगी।</p> : null}
      <div className="grid gap-1.5 sm:grid-cols-2">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="आपका नाम *" className="input px-2 py-1.5 text-xs" />
        <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="मोबाइल" className="input px-2 py-1.5 text-xs" />
      </div>
      <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={2} placeholder="आपकी पूछताछ…" className="input px-2 py-1.5 text-xs" />
      <button type="submit" disabled={busy} className="btn-primary px-2.5 py-1.5 text-[11px]">{busy ? "⏳…" : "📩 पूछताछ भेजें"}</button>
    </form>
  );
}
