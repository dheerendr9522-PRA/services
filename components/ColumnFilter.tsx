"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type ColumnDef = { key: string; label: string; type?: "text" | "select" | "date" | "number" };

export type TableAction = { label: string; href?: string; title?: string };

export type TableRow = {
  id: string | number;
  values: Record<string, string | number>;
  actions?: TableAction[];
  tone?: Record<string, string>;
};

/**
 * Server-safe table: only plain data is passed in (no functions), with a
 * filter row under the header so every column can be filtered individually.
 */
export default function ColumnFilterTable({
  rows,
  columns,
  perPage = 15,
  emptyText = "कोई रिकॉर्ड नहीं मिला",
}: {
  rows: TableRow[];
  columns: ColumnDef[];
  perPage?: number;
  emptyText?: string;
}) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "", dir: "asc" });
  const [page, setPage] = useState(1);

  const distinct = useMemo(() => {
    const map: Record<string, string[]> = {};
    columns.forEach((column) => {
      if (column.type !== "select") return;
      const set = new Set<string>();
      rows.forEach((row) => {
        const value = row.values[column.key];
        if (value !== undefined && value !== null && String(value) !== "") set.add(String(value));
      });
      map[column.key] = Array.from(set).sort();
    });
    return map;
  }, [rows, columns]);

  const filtered = useMemo(() => {
    const active = Object.entries(filters).filter(([, value]) => value !== "");
    let output = rows;
    if (active.length) {
      output = rows.filter((row) =>
        active.every(([key, value]) => {
          const text = String(row.values[key] ?? "");
          const column = columns.find((c) => c.key === key);
          if (column?.type === "select") return text === value;
          if (column?.type === "date") return text.slice(0, 10).includes(value.slice(0, 10)) || text.includes(value);
          return text.toLowerCase().includes(value.toLowerCase());
        }),
      );
    }
    if (sort.key) {
      output = [...output].sort((a, b) => {
        const av = a.values[sort.key];
        const bv = b.values[sort.key];
        if (av === bv) return 0;
        if (av === undefined || av === null) return 1;
        if (bv === undefined || bv === null) return -1;
        const result = av > bv ? 1 : -1;
        return sort.dir === "asc" ? result : -result;
      });
    }
    return output;
  }, [rows, filters, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * perPage, current * perPage);
  const activeCount = Object.values(filters).filter(Boolean).length;

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {filtered.length} / {rows.length} रिकॉर्ड
        </span>
        {activeCount > 0 ? (
          <button type="button" onClick={() => { setFilters({}); setPage(1); }} className="btn-danger px-2 py-1.5 text-[11px]">
            ✕ सभी कॉलम फ़िल्टर हटाएँ ({activeCount})
          </button>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={current <= 1} className="btn-ghost px-2 py-1 text-[11px]">← पिछला</button>
          <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">पेज {current} / {totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={current >= totalPages} className="btn-ghost px-2 py-1 text-[11px]">अगला →</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60">
        <table className="table-base">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  <button
                    type="button"
                    onClick={() => setSort((prev) => ({ key: column.key, dir: prev.key === column.key && prev.dir === "asc" ? "desc" : "asc" }))}
                    className="flex items-center gap-1 text-left hover:text-indigo-600 dark:hover:text-indigo-300"
                    title="क्रम बदलें"
                  >
                    {column.label}
                    <span className="text-[9px]">{sort.key === column.key ? (sort.dir === "asc" ? "↑" : "↓") : "⇅"}</span>
                  </button>
                </th>
              ))}
              <th>क्रिया</th>
            </tr>
            <tr>
              {columns.map((column) => (
                <th key={`f-${column.key}`} className="!bg-slate-100/70 !py-1 dark:!bg-slate-800/60">
                  {column.type === "select" ? (
                    <select value={filters[column.key] ?? ""} onChange={(e) => setFilter(column.key, e.target.value)} className="input w-full min-w-[88px] px-1.5 py-0.5 text-[10px]">
                      <option value="">सभी</option>
                      {(distinct[column.key] ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input
                      type={column.type === "date" ? "date" : column.type === "number" ? "number" : "text"}
                      value={filters[column.key] ?? ""}
                      onChange={(e) => setFilter(column.key, e.target.value)}
                      placeholder="फ़िल्टर…"
                      className="input w-full min-w-[78px] px-1.5 py-0.5 text-[10px]"
                    />
                  )}
                </th>
              ))}
              <th className="!bg-slate-100/70 dark:!bg-slate-800/60" />
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="py-8 text-center text-xs text-slate-400">{emptyText}</td></tr>
            ) : (
              pageRows.map((row) => (
                <tr key={String(row.id)}>
                  {columns.map((column) => (
                    <td key={column.key} className={row.tone?.[column.key] ?? ""}>
                      {String(row.values[column.key] ?? "—")}
                    </td>
                  ))}
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {(row.actions ?? []).map((action) =>
                        action.href ? (
                          <Link key={action.label} href={action.href} title={action.title ?? action.label} className="btn-ghost px-1.5 py-1 text-[10px]">{action.label}</Link>
                        ) : (
                          <span key={action.label} className="chip bg-slate-100 text-[10px] text-slate-600 dark:bg-white/10 dark:text-slate-300">{action.label}</span>
                        ),
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
