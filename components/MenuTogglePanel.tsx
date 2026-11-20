"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ToggleItem = {
  key: string;
  label: string;
  hint: string;
  value: string;
  kind: "setting" | "category" | "website";
  id?: number;
  active?: boolean;
};

export default function MenuTogglePanel({ items }: { items: ToggleItem[] }) {
  const router = useRouter();
  const [state, setState] = useState<ToggleItem[]>(items);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  async function toggle(item: ToggleItem) {
    setBusy(item.key);
    if (item.kind === "setting") {
      const next = item.value === "1" ? "0" : "1";
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [item.key]: next }),
      }).catch(() => null);
      if (response && response.ok) {
        setState((prev) => prev.map((row) => (row.key === item.key ? { ...row, value: next } : row)));
        setMessage(`✅ ${item.label} अब ${next === "1" ? "चालू" : "बंद"} है`);
        router.refresh();
      } else {
        setMessage("❌ बदलाव नहीं हो सका");
      }
      setBusy("");
      return;
    }
    if (item.kind === "category" || item.kind === "website") {
      const resource = item.kind === "category" ? "categories" : "websites";
      const next = !item.active;
      setState((prev) => prev.map((row) => (row.key === item.key ? { ...row, active: next } : row)));
      const response = await fetch(`/api/admin/${resource}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      }).catch(() => null);
      if (!response || !response.ok) {
        setState((prev) => prev.map((row) => (row.key === item.key ? { ...row, active: !next } : row)));
        setMessage("❌ बदलाव नहीं हो सका");
      } else {
        setMessage(`✅ ${item.label} अब ${next ? "चालू (ON)" : "बंद (OFF)"} है`);
        router.refresh();
      }
      setBusy("");
    }
  }

  const filtered = state.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  const groups: { title: string; icon: string; filter: (item: ToggleItem) => boolean }[] = [
    { title: "साइडबार मुख्य मेन्यू", icon: "🎛️", filter: (item) => item.kind === "setting" },
    { title: "सेवा मेन्यू / श्रेणियाँ", icon: "🗂️", filter: (item) => item.kind === "category" },
    { title: "वेबसाइट लिंक", icon: "🌐", filter: (item) => item.kind === "website" },
  ];

  const isOn = (item: ToggleItem) => (item.kind === "setting" ? item.value !== "0" : Boolean(item.active));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="मेन्यू / श्रेणी / वेबसाइट खोजें…"
          className="input max-w-xs px-2 py-1.5 text-xs"
        />
        <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {filtered.filter(isOn).length} चालू · {filtered.filter((i) => !isOn(i)).length} बंद
        </span>
        {message ? <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-300">{message}</span> : null}
      </div>

      {groups.map((group) => {
        const rows = filtered.filter(group.filter);
        if (rows.length === 0) return null;
        return (
          <div key={group.title} className="card p-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {group.icon} {group.title} <span className="text-[11px] font-semibold text-slate-400">({rows.length})</span>
            </h2>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5 dark:border-white/10">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{item.label}</p>
                    <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{item.hint}</p>
                  </div>
                  <button
                    type="button"
                    disabled={busy === item.key}
                    onClick={() => toggle(item)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${isOn(item) ? "bg-emerald-500" : "bg-rose-400"}`}
                    title={isOn(item) ? "चालू — बंद करने के लिए दबाएँ" : "बंद — चालू करने के लिए दबाएँ"}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${isOn(item) ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
