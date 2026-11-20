"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RecordPaymentForm({ billId, balanceDue }: { billId: number; balanceDue: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(balanceDue));
  const [mode, setMode] = useState("Cash");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch(`/api/bills/${billId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), paymentMode: mode, reference }),
    }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      setMessage("❌ भुगतान दर्ज नहीं हुआ");
      return;
    }
    setMessage("✅ भुगतान दर्ज हो गया");
    setReference("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-wrap items-end gap-2">
      <div><label className="label">राशि ₹</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input max-w-[110px] py-1.5 text-xs" /></div>
      <div><label className="label">माध्यम</label>
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="input py-1.5 text-xs">
          {["Cash", "UPI", "Bank Transfer", "Other"].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div><label className="label">UTR / Reference</label><input value={reference} onChange={(e) => setReference(e.target.value)} className="input max-w-[150px] py-1.5 text-xs" /></div>
      <button type="submit" disabled={busy} className="btn-primary px-3 py-1.5 text-xs">{busy ? "⏳…" : "💾 भुगतान सहेजें"}</button>
      {message ? <span className="text-[11px] font-bold text-emerald-600">{message}</span> : null}
    </form>
  );
}
