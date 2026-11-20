export function formatINR(value: number | null | undefined): string {
  const n = Number(value || 0);
  return `₹${n.toLocaleString("en-IN")}`;
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `item-${Date.now().toString(36)}`;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatDate(date)}, ${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function inDateRange(
  value: Date | string | null | undefined,
  from?: string,
  to?: string,
): boolean {
  if (!from && !to) return true;
  if (!value) return false;
  const time = new Date(value).getTime();
  if (from && time < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && time > new Date(`${to}T23:59:59`).getTime()) return false;
  return true;
}

export function statusTone(status: string): string {
  const s = (status || "").toLowerCase();
  if (s.includes("reject") || s.includes("cancel")) return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
  if (s.includes("complet") || s.includes("deliver") || s.includes("paid") || s.includes("ready")) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  if (s.includes("in progress") || s.includes("in repair") || s.includes("repair")) return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
  if (s.includes("document")) return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300";
  if (s.includes("credit") || s.includes("outstanding") || s.includes("pending")) return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200";
  if (s.includes("new request") || s.includes("new")) return "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300";
  if (s.includes("submitted")) return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300";
  if (s.includes("partial")) return "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300";
  if (s.includes("draft")) return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300";
  return "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300";
}

export function nextRef(prefix: string, id: number): string {
  return `${prefix}-${String(id).padStart(4, "0")}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return [headers.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join(
    "\n",
  );
}
