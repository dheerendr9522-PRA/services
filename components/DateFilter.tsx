"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function DateFilter({ label = "दिनांक फ़िल्टर" }: { label?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");

  const apply = () => {
    const next = new URLSearchParams(params.toString());
    if (from) next.set("from", from);
    else next.delete("from");
    if (to) next.set("to", to);
    else next.delete("to");
    router.push(`?${next.toString()}`);
  };

  const clear = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("from");
    next.delete("to");
    setFrom("");
    setTo("");
    router.push(`?${next.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5">
      <div>
        <label className="mb-0.5 block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
          {label} — Start Date
        </label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input px-2 py-1.5 text-xs" />
      </div>
      <div>
        <label className="mb-0.5 block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
          End Date
        </label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input px-2 py-1.5 text-xs" />
      </div>
      <button type="button" onClick={apply} className="btn-primary px-2.5 py-1.5 text-xs">
        लागू करें
      </button>
      <button type="button" onClick={clear} className="btn-ghost px-2.5 py-1.5 text-xs">
        क्लियर
      </button>
    </div>
  );
}
