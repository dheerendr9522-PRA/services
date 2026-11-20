import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: string;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "sky";
}) {
  const tones: Record<string, string> = {
    indigo: "from-indigo-500 to-violet-500",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-500",
    sky: "from-sky-500 to-blue-500",
  };
  return (
    <div className="card flex items-center gap-3 p-3.5">
      <div
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tones[tone]} text-lg text-white shadow-sm`}
      >
        {icon ?? "📊"}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="text-lg font-extrabold text-slate-900 dark:text-white">{value}</p>
        {hint ? <p className="truncate text-[11px] text-slate-400">{hint}</p> : null}
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "indigo" | "emerald" | "amber" | "rose" | "sky";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  };
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({
  icon = "🗂️",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center dark:border-white/15">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-2xl dark:bg-white/10">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
      {description ? (
        <p className="max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-white/5" />
      ))}
    </div>
  );
}

export function QuickLink({
  href,
  icon,
  title,
  hint,
}: {
  href: string;
  icon: string;
  title: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="group card flex items-start gap-3 p-3 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-lg dark:bg-indigo-500/15">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-slate-800 group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-300">
          {title}
        </span>
        {hint ? <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{hint}</span> : null}
      </span>
    </Link>
  );
}
