"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { WEEKDAYS } from "@/lib/filters";

const PRESETS: { label: string; get: () => { from?: string; to?: string } }[] = [
  { label: "आज", get: () => iso(new Date(), new Date()) },
  {
    label: "कल",
    get: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return iso(d, d);
    },
  },
  {
    label: "इस हफ्ते",
    get: () => {
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      return iso(start, now);
    },
  },
  {
    label: "इस माह",
    get: () => {
      const now = new Date();
      return iso(new Date(now.getFullYear(), now.getMonth(), 1), now);
    },
  },
  {
    label: "पिछला माह",
    get: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return iso(start, end);
    },
  },
  {
    label: "इस वर्ष",
    get: () => iso(new Date(new Date().getFullYear(), 0, 1), new Date()),
  },
];

function iso(a: Date, b: Date) {
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: fmt(a), to: fmt(b) };
}

const KEYS = ["from", "to", "month", "year", "weekday", "timeStart", "timeEnd", "q", "category"];

export default function AdminFilterBar({
  label = "फ़िल्टर",
  searchPlaceholder = "खोजें…",
  showSearch = true,
  exportHref,
  categories,
}: {
  label?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  exportHref?: string;
  categories?: { value: string; label: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const current = Object.fromEntries(KEYS.map((key) => [key, params.get(key) ?? ""]));
  const [form, setForm] = useState<Record<string, string>>(current);
  const activeCount = KEYS.filter((key) => params.get(key)).length;

  const push = (values: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(values).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    router.push(`${pathname}?${next.toString()}`);
  };

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="no-print rounded-2xl border border-slate-200 bg-white/80 p-2.5 dark:border-white/10 dark:bg-slate-900/60">
      <div className="flex flex-wrap items-center gap-1.5">
        {showSearch ? (
          <input
            value={form.q ?? ""}
            onChange={(e) => set("q", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") push({ q: form.q ?? "" });
            }}
            placeholder={searchPlaceholder}
            className="input max-w-[230px] px-2 py-1.5 text-xs"
          />
        ) : null}
        <button type="button" onClick={() => push({ q: form.q ?? "" })} className="btn-primary px-2.5 py-1.5 text-[11px]">
          🔍 खोजें
        </button>
        {categories && categories.length > 0 ? (
          <select
            value={form.category ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              set("category", value);
              push({ category: value });
            }}
            className="input max-w-[170px] px-2 py-1.5 text-[11px]"
          >
            <option value="">सभी श्रेणी</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        ) : null}
        <button type="button" onClick={() => setOpen((v) => !v)} className="btn-ghost px-2.5 py-1.5 text-[11px]">
          📅 {label} {activeCount ? `(${activeCount})` : ""} {open ? "▴" : "▾"}
        </button>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              const range = preset.get();
              setForm((prev) => ({ ...prev, from: range.from ?? "", to: range.to ?? "", month: "", year: "" }));
              push({ from: range.from ?? "", to: range.to ?? "", month: "", year: "" });
            }}
            className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-indigo-100 dark:bg-white/10 dark:text-slate-300"
          >
            {preset.label}
          </button>
        ))}
        {exportHref ? (
          <a href={exportHref} className="btn-ghost ml-auto px-2.5 py-1.5 text-[11px]">
            ⬇ CSV डाउनलोड
          </a>
        ) : null}
        {activeCount ? (
          <button
            type="button"
            onClick={() => {
              setForm({});
              router.push(pathname);
            }}
            className="btn-danger px-2 py-1.5 text-[11px]"
          >
            ✕ क्लियर
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="mt-2 grid gap-2 border-t border-slate-200 pt-2 sm:grid-cols-3 xl:grid-cols-7 dark:border-white/10">
          <div>
            <label className="label">Start Date</label>
            <input type="date" value={form.from ?? ""} onChange={(e) => set("from", e.target.value)} className="input px-2 py-1.5 text-xs" />
          </div>
          <div>
            <label className="label">End Date</label>
            <input type="date" value={form.to ?? ""} onChange={(e) => set("to", e.target.value)} className="input px-2 py-1.5 text-xs" />
          </div>
          <div>
            <label className="label">माह / Month</label>
            <input type="month" value={form.month ?? ""} onChange={(e) => set("month", e.target.value)} className="input px-2 py-1.5 text-xs" />
          </div>
          <div>
            <label className="label">वर्ष / Year</label>
            <select value={form.year ?? ""} onChange={(e) => set("year", e.target.value)} className="input px-2 py-1.5 text-xs">
              <option value="">सभी वर्ष</option>
              {Array.from({ length: 6 }).map((_, i) => {
                const y = new Date().getFullYear() - i;
                return (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="label">दिन / Day</label>
            <select value={form.weekday ?? ""} onChange={(e) => set("weekday", e.target.value)} className="input px-2 py-1.5 text-xs">
              <option value="">सभी दिन</option>
              {WEEKDAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">समय से</label>
            <input type="time" value={form.timeStart ?? ""} onChange={(e) => set("timeStart", e.target.value)} className="input px-2 py-1.5 text-xs" />
          </div>
          <div>
            <label className="label">समय तक</label>
            <input type="time" value={form.timeEnd ?? ""} onChange={(e) => set("timeEnd", e.target.value)} className="input px-2 py-1.5 text-xs" />
          </div>
          <div className="sm:col-span-3 xl:col-span-7">
            <button
              type="button"
              onClick={() => push(Object.fromEntries(KEYS.map((key) => [key, form[key] ?? ""])))}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              ✅ फ़िल्टर लागू करें
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
