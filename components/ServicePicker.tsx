"use client";

import { useMemo, useState } from "react";

export type PickerOption = {
  slug: string;
  nameHi: string;
  nameEn: string;
  shopFee: number;
  govtFee: number;
  bookingFee: number;
  documents: string[];
  serviceMode: string;
  categoryNameHi: string;
  categorySlug: string;
  categoryIcon: string;
  timeEstimate: string;
};

export type PickedService = { slug: string; nameHi: string; fee: number; documents: string[]; serviceMode: string };

export default function ServicePicker({
  options,
  selected,
  onChange,
}: {
  options: PickerOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [mode, setMode] = useState("");
  const [open, setOpen] = useState(false);

  const categories = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; icon: string }>();
    options.forEach((option) => map.set(option.categorySlug, { slug: option.categorySlug, name: option.categoryNameHi, icon: option.categoryIcon }));
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "hi"));
  }, [options]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((option) => {
      const matchQuery = !q || `${option.nameHi} ${option.nameEn} ${option.categoryNameHi}`.toLowerCase().includes(q);
      const matchCategory = !category || option.categorySlug === category;
      const matchMode = !mode || option.serviceMode === mode || option.serviceMode === "both";
      return matchQuery && matchCategory && matchMode;
    }).slice(0, 60);
  }, [options, query, category, mode]);

  const toggle = (slug: string) => onChange(selected.includes(slug) ? selected.filter((s) => s !== slug) : [...selected, slug]);
  const chosen = options.filter((option) => selected.includes(option.slug));
  const total = chosen.reduce((sum, option) => sum + option.shopFee + option.govtFee + option.bookingFee, 0);

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-3 dark:border-indigo-400/20 dark:bg-indigo-500/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">🧩 सेवाएँ चुनें — किसी भी मेन्यू से ({selected.length} चुनी)</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">किसी भी श्रेणी/मेन्यू से कितनी भी सेवाएँ टिक करें, एक ही आवेदन में जमा करें।</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="chip bg-white text-emerald-700 dark:bg-white/10 dark:text-emerald-300">कुल ₹{total}</span>
          <button type="button" onClick={() => setOpen((v) => !v)} className="btn-primary px-2.5 py-1.5 text-[11px]">{open ? "▴ बंद करें" : "🔍 सेवा चुनें"}</button>
        </div>
      </div>

      {selected.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {chosen.map((option) => (
            <span key={option.slug} className="chip bg-indigo-600 text-white">
              {option.nameHi}
              <button type="button" onClick={() => toggle(option.slug)} className="ml-1 rounded bg-white/20 px-1">✕</button>
            </span>
          ))}
        </div>
      ) : null}

      {open ? (
        <div className="mt-2 space-y-1.5">
          <div className="grid gap-1.5 sm:grid-cols-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="सेवा खोजें…" className="input py-1.5 text-xs" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input py-1.5 text-xs">
              <option value="">सभी मेन्यू / श्रेणी</option>
              {categories.map((item) => <option key={item.slug} value={item.slug}>{item.icon} {item.name}</option>)}
            </select>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="input py-1.5 text-xs">
              <option value="">सभी मोड</option>
              <option value="shop">🏪 दुकान पर</option>
              <option value="online">🌐 बिना दुकान आए</option>
            </select>
          </div>
          <p className="text-[10px] text-slate-400">{filtered.length} सेवाएँ दिख रही हैं{filtered.length === 60 ? " (पहली 60 — खोज से कम करें)" : ""}</p>
          <div className="grid max-h-64 gap-1 overflow-y-auto sm:grid-cols-2">
            {filtered.map((option) => (
              <label key={option.slug} className={`flex items-start gap-2 rounded-xl border px-2 py-1.5 text-[11px] font-semibold ${selected.includes(option.slug) ? "border-indigo-400 bg-white dark:bg-white/10" : "border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5"}`}>
                <input type="checkbox" checked={selected.includes(option.slug)} onChange={() => toggle(option.slug)} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{option.nameHi}</span>
                  <span className="block truncate text-[10px] text-slate-400">{option.categoryIcon} {option.categoryNameHi} · ⏱ {option.timeEstimate}</span>
                  <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {option.serviceMode === "shop" ? "🏪 दुकान पर" : option.serviceMode === "online" ? "🌐 ऑनलाइन भी" : "🏪/🌐 दोनों"}
                  </span>
                </span>
                <span className="shrink-0 text-emerald-600 dark:text-emerald-300">₹{option.shopFee + option.govtFee + option.bookingFee}</span>
              </label>
            ))}
            {filtered.length === 0 ? <p className="text-[11px] text-slate-400">कोई सेवा नहीं मिली — खोज बदलें।</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
