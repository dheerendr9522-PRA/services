"use client";

import { useOffline } from "@/components/OfflineProvider";

export default function OfflineBar() {
  const { online, pending, syncing, message, syncNow, clearQueue } = useOffline();
  return (
    <div className="no-print flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-2 py-1 text-[11px] dark:border-white/10 dark:bg-slate-900/70">
      <span className={`chip ${online ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"}`}>
        {online ? "🟢 Online" : "🔴 Offline"}
      </span>
      <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">📤 Pending: {pending.length}</span>
      <button type="button" onClick={() => void syncNow()} disabled={syncing} className="btn-ghost px-2 py-0.5 text-[10px]">
        {syncing ? "⏳ सिंक…" : "🔄 Sync Now"}
      </button>
      {pending.length > 0 ? (
        <button type="button" onClick={clearQueue} className="btn-ghost px-2 py-0.5 text-[10px]">🗑️ Clear</button>
      ) : null}
      {message ? <span className="font-semibold text-slate-600 dark:text-slate-300">{message}</span> : null}
      <a href="/admin/sync" className="ml-auto font-bold text-indigo-600 dark:text-indigo-300">Sync History →</a>
    </div>
  );
}
