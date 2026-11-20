"use client";

import { useState } from "react";

export default function FeedbackForm({ services }: { services: string[] }) {
  const [rating, setRating] = useState(5);
  const [form, setForm] = useState({ name: "", mobile: "", comment: "", serviceName: services[0] ?? "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rating }),
    }).catch(() => null);
    setBusy(false);
    if (response && response.ok) {
      setDone(true);
      setForm({ name: "", mobile: "", comment: "", serviceName: services[0] ?? "" });
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        ✅ धन्यवाद! आपकी रेटिंग व राय सुरक्षित हो गई। दुकान जल्द जवाब देगी।
        <button type="button" onClick={() => setDone(false)} className="btn-ghost ml-2 px-2 py-1 text-[11px]">नई राय</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div>
        <label className="label">आपकी रेटिंग</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)} className={`text-2xl leading-none ${star <= rating ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}`} aria-label={`${star} star`}>
              ★
            </button>
          ))}
          <span className="ml-1 self-center text-xs font-bold text-slate-500">{rating}/5</span>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="आपका नाम *" className="input px-2 py-1.5 text-xs" />
        <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="मोबाइल (वैकल्पिक)" className="input px-2 py-1.5 text-xs" />
      </div>
      <select value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} className="input px-2 py-1.5 text-xs">
        <option value="">सेवा चुनें (वैकल्पिक)</option>
        {services.map((service) => (
          <option key={service} value={service}>{service}</option>
        ))}
      </select>
      <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={2} placeholder="अपनी राय लिखें…" className="input px-2 py-1.5 text-xs" />
      <button type="submit" disabled={busy} className="btn-primary px-3 py-1.5 text-xs">{busy ? "⏳ भेजा जा रहा…" : "⭐ रेटिंग व राय भेजें"}</button>
    </form>
  );
}
