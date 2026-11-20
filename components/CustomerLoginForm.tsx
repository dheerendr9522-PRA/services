"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CustomerLoginForm({ pinHint }: { pinHint: string }) {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "customer", mobile, pin, name }),
      });
      const json = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !json.ok) {
        setError(json.error || "लॉगिन नहीं हो सका");
        setLoading(false);
        return;
      }
      router.push("/customer");
      router.refresh();
    } catch {
      setError("नेटवर्क त्रुटि");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">मोबाइल नंबर (10 अंक)</label>
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
          className="input"
          inputMode="numeric"
          placeholder="9425012345"
          required
        />
      </div>
      <div>
        <label className="label">नाम (नया ग्राहक होने पर)</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="आपका नाम" />
      </div>
      <div>
        <label className="label">4-अंकों का पिन</label>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="input tracking-[0.5em]"
          inputMode="numeric"
          placeholder="1234"
          required
        />
      </div>
      {error ? (
        <p className="rounded-xl bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
        {loading ? "⏳ जाँच…" : "👤 कस्टमर लॉगिन"}
      </button>
      <div className="rounded-xl bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600 dark:bg-white/5 dark:text-slate-300">
        <p className="font-bold">डेमो ट्रैकिंग:</p>
        <button
          type="button"
          className="btn-soft mt-1 px-2 py-1 text-[10px]"
          onClick={() => {
            setMobile("9425012345");
            setPin(pinHint);
          }}
        >
          भरें — 9425012345 / {pinHint}
        </button>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          आवेदन ट्रैकिंग नंबर: <b>DP-R2001</b> · कोई भी सही 10-अंक मोबाइल + पिन {pinHint} स्वीकार है।
        </p>
      </div>
    </form>
  );
}
