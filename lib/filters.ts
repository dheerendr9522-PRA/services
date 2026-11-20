export type AdminFilters = {
  from?: string;
  to?: string;
  month?: string;
  year?: string;
  weekday?: string;
  timeStart?: string;
  timeEnd?: string;
  q?: string;
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.trim() ? v.trim() : undefined;
}

export function parseFilters(params: RawSearchParams): AdminFilters {
  return {
    from: first(params.from),
    to: first(params.to),
    month: first(params.month),
    year: first(params.year),
    weekday: first(params.weekday),
    timeStart: first(params.timeStart),
    timeEnd: first(params.timeEnd),
    q: first(params.q),
  };
}

export function filtersActive(filters: AdminFilters): boolean {
  return Boolean(
    filters.from ||
      filters.to ||
      filters.month ||
      filters.year ||
      (filters.weekday !== undefined && filters.weekday !== "") ||
      filters.timeStart ||
      filters.timeEnd,
  );
}

export function matchesFilters(value: Date | string | null | undefined, filters: AdminFilters): boolean {
  if (!filtersActive({ ...filters, q: undefined })) return true;
  if (!value) return false;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return false;

  if (filters.from && date.getTime() < new Date(`${filters.from}T00:00:00`).getTime()) return false;
  if (filters.to && date.getTime() > new Date(`${filters.to}T23:59:59.999`).getTime()) return false;

  if (filters.month) {
    const [y, m] = filters.month.split("-").map(Number);
    if (Number.isFinite(y) && Number.isFinite(m)) {
      if (date.getFullYear() !== y || date.getMonth() + 1 !== m) return false;
    }
  }
  if (filters.year) {
    const y = Number(filters.year);
    if (Number.isFinite(y) && date.getFullYear() !== y) return false;
  }
  if (filters.weekday !== undefined && filters.weekday !== "") {
    const wd = Number(filters.weekday);
    if (Number.isFinite(wd) && date.getDay() !== wd) return false;
  }
  if (filters.timeStart || filters.timeEnd) {
    const minutes = date.getHours() * 60 + date.getMinutes();
    const parse = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return (Number(h) || 0) * 60 + (Number(m) || 0);
    };
    if (filters.timeStart && minutes < parse(filters.timeStart)) return false;
    if (filters.timeEnd && minutes > parse(filters.timeEnd)) return false;
  }
  return true;
}

export function matchesQuery(haystack: (string | number | null | undefined)[], q?: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return haystack.some((value) => String(value ?? "").toLowerCase().includes(needle));
}

export const WEEKDAYS = [
  { value: "0", label: "रविवार" },
  { value: "1", label: "सोमवार" },
  { value: "2", label: "मंगलवार" },
  { value: "3", label: "बुधवार" },
  { value: "4", label: "गुरुवार" },
  { value: "5", label: "शुक्रवार" },
  { value: "6", label: "शनिवार" },
];

export function filterLabel(filters: AdminFilters): string {
  const parts: string[] = [];
  if (filters.from) parts.push(`से ${filters.from}`);
  if (filters.to) parts.push(`तक ${filters.to}`);
  if (filters.month) parts.push(`माह ${filters.month}`);
  if (filters.year) parts.push(`वर्ष ${filters.year}`);
  if (filters.weekday) parts.push(WEEKDAYS.find((w) => w.value === filters.weekday)?.label ?? "");
  if (filters.timeStart || filters.timeEnd) parts.push(`समय ${filters.timeStart ?? "00:00"}–${filters.timeEnd ?? "23:59"}`);
  return parts.length ? parts.join(" · ") : "सभी रिकॉर्ड";
}
