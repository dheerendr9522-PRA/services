"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type FieldConfig = {
  key: string;
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

export type ColumnConfig = { key: string; label: string };

export type Row = Record<string, unknown>;

function renderCell(row: Row, key: string) {
  const value = row[key];
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "ON" : "OFF";
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "object" && item !== null ? JSON.stringify(item) : String(item)))
        .join(" | ");
    }
    return JSON.stringify(value);
  }
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) return new Date(str).toLocaleDateString("en-IN");
  return str.length > 70 ? `${str.slice(0, 70)}…` : str;
}

export default function DataManager({
  resource,
  label,
  rows: initialRows,
  columns,
  fields,
  canCreate,
  canDelete,
  optionsMap = {},
  searchPlaceholder = "खोजें…",
}: {
  resource: string;
  label: string;
  rows: Row[];
  columns: ColumnConfig[];
  fields: FieldConfig[];
  canCreate: boolean;
  canDelete: boolean;
  optionsMap?: Record<string, { value: string; label: string }[]>;
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [viewRow, setViewRow] = useState<Row | null>(null);
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const perPage = 12;

  const downloadRow = (row: Row) => {
    const header = fields.map((f) => f.label).join(",");
    const values = fields
      .map((f) => {
        const value = row[f.key];
        const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
        return `"${text.replace(/"/g, '""')}"`;
      })
      .join(",");
    const blob = new Blob([`\uFEFF${header}\n${values}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${resource}-${String(row.id ?? "row")}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const printRow = (row: Row) => {
    const win = window.open("", "_blank", "width=720,height=900");
    if (!win) return;
    const rowsHtml = fields
      .map((f) => {
        const value = row[f.key];
        const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "—");
        return `<tr><th style="text-align:left;padding:6px 8px;background:#f1f5f9;border:1px solid #cbd5e1;width:36%">${f.label}</th><td style="padding:6px 8px;border:1px solid #cbd5e1">${text}</td></tr>`;
      })
      .join("");
    win.document.write(`<html><head><title>${label} #${String(row.id)}</title><meta charset="utf-8"></head><body style="font-family:system-ui,'Noto Sans Devanagari',sans-serif;padding:20px">
      <h2 style="margin:0 0 2px">Dheerendra Prajapati Computer Hardware, Software &amp; Digital Seva Kendra</h2>
      <p style="margin:0 0 12px;font-size:12px">Bajar Mohalla, Amanganj, Panna (M.P.) 488441 · 7610420959</p>
      <h3 style="margin:0 0 8px">${label} — ID ${String(row.id)}</h3>
      <table style="border-collapse:collapse;width:100%;font-size:13px">${rowsHtml}</table>
      <p style="margin-top:16px;font-size:11px;color:#64748b">प्रिंट दिनांक: ${new Date().toLocaleString("en-IN")}</p>
      <script>window.onload=function(){window.print();}</script>
    </body></html>`);
    win.document.close();
  };

  const filtered = useMemo(() => {
    const base = !query.trim()
      ? rows
      : rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(q(query))));
    if (!sortKey) return base;
    return [...base].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const result = av > bv ? 1 : -1;
      return sortDir === "asc" ? result : -result;
    });
  }, [rows, query, sortKey, sortDir]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  function q(value: string) { return value.toLowerCase(); }

  const startCreate = () => {
    const initial: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.type === "boolean") initial[field.key] = "true";
      else if (field.type === "select") initial[field.key] = optionsMap[field.key]?.[0]?.value ?? field.options?.[0] ?? "";
      else initial[field.key] = "";
    });
    if (Object.prototype.hasOwnProperty.call(initial, "active")) initial.active = "true";
    if (Object.prototype.hasOwnProperty.call(initial, "section")) initial.section = "mp";
    setForm(initial);
    setEditing(null);
    setShowForm(true);
    setError("");
  };

  const startEdit = (row: Row) => {
    const initial: Record<string, string> = {};
    fields.forEach((field) => {
      const value = row[field.key];
      if (field.type === "boolean") initial[field.key] = value ? "true" : "false";
      else if (field.type === "password") initial[field.key] = "";
      else if (field.type === "json") initial[field.key] = value ? JSON.stringify(value) : "[]";
      else if (field.type === "date")
        initial[field.key] = value ? new Date(String(value)).toISOString().slice(0, 10) : "";
      else initial[field.key] = value === null || value === undefined ? "" : String(value);
    });
    setForm(initial);
    setEditing(row);
    setShowForm(true);
    setError("");
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setError("");
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload: Record<string, unknown> = {};
    fields.forEach((field) => {
      if (field.type === "password" && !form[field.key]) return;
      payload[field.key] = form[field.key] ?? "";
    });
    try {
      const url = editing ? `/api/admin/${resource}/${String(editing.id)}` : `/api/admin/${resource}`;
      const response = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as { ok: boolean; row?: Row; error?: string };
      if (!response.ok || !json.ok) {
        setError(json.error || "सहेजा नहीं जा सका");
        setBusy(false);
        return;
      }
      if (json.row) {
        const saved = json.row;
        setRows((prev) => (editing ? prev.map((r) => (r.id === saved.id ? saved : r)) : [saved, ...prev]));
      }
      setMessage(editing ? "✅ अपडेट हो गया" : "✅ नया रिकॉर्ड जोड़ा गया");
      closeForm();
      router.refresh();
    } catch {
      setError("नेटवर्क त्रुटि");
    }
    setBusy(false);
    setTimeout(() => setMessage(""), 2500);
  }

  async function toggleField(row: Row, key: string) {
    const nextValue = !row[key];
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, [key]: nextValue } : r)));
    const response = await fetch(`/api/admin/${resource}/${String(row.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: nextValue }),
    }).catch(() => null);
    if (!response || !response.ok) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, [key]: !nextValue } : r)));
      setError("ON/OFF बदलने में त्रुटि");
      return;
    }
    router.refresh();
  }

  async function duplicate(row: Row) {
    setBusy(true);
    setError("");
    const payload: Record<string, unknown> = {};
    fields.forEach((field) => {
      if (["id", "createdAt", "updatedAt", "password", "passwordHash"].includes(field.key)) return;
      const value = row[field.key];
      if (field.key === "slug") {
        payload[field.key] = `${String(value ?? "copy")}-copy-${Date.now().toString(36).slice(-3)}`;
      } else if (field.key === "title" || field.key === "name" || field.key === "label" || field.key === "billNo" || field.key === "invoiceNo" || field.key === "jobNo") {
        payload[field.key] = `${String(value ?? "")} (कॉपी)`;
      } else {
        payload[field.key] = Array.isArray(value) ? value : value ?? "";
      }
    });
    const response = await fetch(`/api/admin/${resource}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      const json = (await response?.json().catch(() => null)) as { error?: string } | null;
      setError(json?.error ?? "डुप्लिकेट नहीं बनाया जा सका");
      return;
    }
    const json = (await response.json()) as { row?: Row };
    if (json.row) setRows((prev) => [json.row as Row, ...prev]);
    setMessage("📋 डुप्लिकेट बन गया");
    setTimeout(() => setMessage(""), 2500);
    router.refresh();
  }

  async function remove(row: Row) {
    if (!window.confirm("क्या आप वाकई इस रिकॉर्ड को हटाना चाहते हैं?")) return;
    const snapshot = rows;
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    const response = await fetch(`/api/admin/${resource}/${String(row.id)}`, { method: "DELETE" }).catch(() => null);
    if (!response || !response.ok) {
      setRows(snapshot);
      setError("हटाने में त्रुटि — अनुमति जाँचें");
      return;
    }
    setMessage("🗑️ हटा दिया गया");
    setTimeout(() => setMessage(""), 2500);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="input max-w-xs"
        />
        <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
          {filtered.length} / {rows.length} रिकॉर्ड
        </span>
        <select
          value={`${sortKey}:${sortDir}`}
          onChange={(e) => {
            const [key, dir] = e.target.value.split(":");
            setSortKey(key);
            setSortDir((dir as "asc" | "desc") ?? "asc");
            setPage(1);
          }}
          className="input max-w-[170px] px-2 py-1.5 text-[11px]"
        >
          <option value=":asc">क्रम: डिफ़ॉल्ट</option>
          {columns.map((column) => (
            <optgroup key={column.key} label={column.label}>
              <option value={`${column.key}:asc`}>{column.label} ↑</option>
              <option value={`${column.key}:desc`}>{column.label} ↓</option>
            </optgroup>
          ))}
        </select>
        {canCreate ? (
          <button type="button" onClick={startCreate} className="btn-primary ml-auto px-3 py-1.5 text-xs">
            ➕ नया {label} जोड़ें
          </button>
        ) : null}
        {message ? <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300">{message}</span> : null}
        {error ? <span className="text-xs font-bold text-rose-600 dark:text-rose-300">{error}</span> : null}
      </div>

      {showForm ? (
        <form onSubmit={submit} className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-400/20 dark:bg-indigo-500/5">
          <p className="mb-2 text-sm font-extrabold text-slate-800 dark:text-slate-100">
            {editing ? `✏️ ${label} बदलें (ID ${String(editing.id)})` : `➕ नया ${label}`}
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {fields.map((field) => {
              const fieldOptions = optionsMap[field.key];
              return (
                <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className="label">{field.label}{field.required ? " *" : ""}</label>
                  {field.type === "select" || fieldOptions ? (
                    <select
                      value={form[field.key] ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="input py-1.5 text-xs"
                      required={field.required}
                    >
                      {(fieldOptions ?? (field.options ?? []).map((opt) => ({ value: opt, label: opt }))).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "boolean" ? (
                    <select
                      value={form[field.key] ?? "true"}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="input py-1.5 text-xs"
                    >
                      <option value="true">ON / सक्रिय</option>
                      <option value="false">OFF / बंद</option>
                    </select>
                  ) : field.type === "textarea" || field.type === "items" || field.type === "json" ? (
                    <textarea
                      value={form[field.key] ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      rows={3}
                      className="input py-1.5 text-xs"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : (
                    <input
                      type={
                        field.type === "number"
                          ? "number"
                          : field.type === "password"
                            ? "password"
                            : field.type === "date"
                              ? "date"
                              : "text"
                      }
                      value={form[field.key] ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      className="input py-1.5 text-xs"
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary px-3 py-1.5 text-xs">
              {busy ? "⏳ सहेजा जा रहा…" : "💾 सहेजें"}
            </button>
            <button type="button" onClick={closeForm} className="btn-ghost px-3 py-1.5 text-xs">
              रद्द करें
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60">
        <table className="table-base">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th>क्रिया</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-xs text-slate-500">
                  कोई रिकॉर्ड नहीं मिला। {canCreate ? "ऊपर से नया जोड़ें।" : ""}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={String(row.id)}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.key === "active" ? (
                        <button
                          type="button"
                          onClick={() => toggleField(row, "active")}
                          className={`chip ${row.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"}`}
                          title="ON/OFF बदलें"
                        >
                          {row.active ? "ON" : "OFF"}
                        </button>
                      ) : (
                        renderCell(row, column.key)
                      )}
                    </td>
                  ))}
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" onClick={() => setViewRow(row)} className="btn-ghost px-2 py-1 text-[11px]">
                        👁 View
                      </button>
                      <button type="button" onClick={() => downloadRow(row)} className="btn-ghost px-2 py-1 text-[11px]">
                        ⬇ Download
                      </button>
                      <button type="button" onClick={() => printRow(row)} className="btn-ghost px-2 py-1 text-[11px]">
                        🖨 Print
                      </button>
                      <button type="button" onClick={() => startEdit(row)} className="btn-soft px-2 py-1 text-[11px]">
                        ✏️ Edit
                      </button>
                      {canCreate ? (
                        <button type="button" onClick={() => duplicate(row)} className="btn-ghost px-2 py-1 text-[11px]">
                          📋 Copy
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button type="button" onClick={() => remove(row)} className="btn-danger px-2 py-1 text-[11px]">
                          🗑 Delete
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <p className="text-slate-500 dark:text-slate-400">
          ON/OFF, Edit, Copy व Delete बदलाव तुरंत लागू होते हैं और ऑडिट लॉग में दर्ज होते हैं। Delete केवल Owner कर सकता है।
        </p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="btn-ghost px-2 py-1 text-[11px]">← पिछला</button>
          <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">पेज {currentPage} / {totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="btn-ghost px-2 py-1 text-[11px]">अगला →</button>
        </div>
      </div>

      {viewRow ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-2 sm:items-center">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                  {label} विवरण
                </p>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">ID {String(viewRow.id)}</h3>
              </div>
              <button type="button" onClick={() => setViewRow(null)} className="btn-ghost px-2 py-1 text-xs">
                ✕ बंद
              </button>
            </div>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {fields.map((field) => {
                const value = viewRow[field.key];
                return (
                  <div key={field.key} className="rounded-xl border border-slate-200 px-2.5 py-1.5 dark:border-white/10">
                    <p className="text-[10px] font-bold uppercase text-slate-500">{field.label}</p>
                    <p className="break-words text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {Array.isArray(value) ? value.join(" | ") : String(value ?? "—")}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button type="button" onClick={() => downloadRow(viewRow)} className="btn-ghost px-2.5 py-1.5 text-[11px]">
                ⬇ Download
              </button>
              <button type="button" onClick={() => printRow(viewRow)} className="btn-ghost px-2.5 py-1.5 text-[11px]">
                🖨 Print
              </button>
              <button
                type="button"
                onClick={() => {
                  startEdit(viewRow);
                  setViewRow(null);
                }}
                className="btn-soft px-2.5 py-1.5 text-[11px]"
              >
                ✏️ Edit
              </button>
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = viewRow;
                    setViewRow(null);
                    void remove(target);
                  }}
                  className="btn-danger px-2.5 py-1.5 text-[11px]"
                >
                  🗑 Delete
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
