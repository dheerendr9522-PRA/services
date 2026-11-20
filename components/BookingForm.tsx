"use client";

import { useState } from "react";

export default function BookingForm({ services }: { services: { name: string; fee: number }[] }) {
  const [form, setForm] = useState({ serviceName: services[0]?.name ?? "", customerName: "", mobile: "", details: "", quantity: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fee = services.find((s) => s.name === form.serviceName)?.fee ?? 0;
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, fee }),
    }).catch(() => null);
    setBusy(false);
    const json = (await response?.json().catch(() => null)) as { ok?: boolean; refNo?: string; error?: string } | null;
    if (!response || !response.ok) {
      setError(json?.error ?? "बुकिंग नहीं हो सकी");
      return;
    }
    setResult(json?.refNo ?? "");
    setForm({ ...form, customerName: "", mobile: "", details: "" });
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      {result ? (
        <p className="rounded-xl bg-emerald-50 px-2.5 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          ✅ बुकिंग हो गई! आपका बुकिंग ID: <span className="font-mono">{result}</span> — स्थिति दुकान से पूछें।
        </p>
      ) : null}
      <select value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} className="input px-2 py-1.5 text-xs">
        {services.map((service) => (
          <option key={service.name} value={service.name}>{service.name} — ₹{service.fee}</option>
        ))}
      </select>
      <div className="grid gap-2 sm:grid-cols-2">
        <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="दुकान / ग्राहक का नाम *" className="input px-2 py-1.5 text-xs" />
        <input required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="मोबाइल नंबर *" className="input px-2 py-1.5 text-xs" />
      </div>
      <input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="मात्रा / पैकेज (जैसे 150 बिल, 1 सिस्टम)" className="input px-2 py-1.5 text-xs" />
      <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} rows={2} placeholder="विवरण — क्या काम करवाना है" className="input px-2 py-1.5 text-xs" />
      {error ? <p className="text-[11px] font-bold text-rose-600">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn-primary px-3 py-1.5 text-xs">{busy ? "⏳…" : "📅 बुकिंग करें"}</button>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">फाइल/Excel अपलोड व भुगतान की जानकारी के लिए दुकान पर संपर्क करें (7610420959)।</p>
    </form>
  );
}
