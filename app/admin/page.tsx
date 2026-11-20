import Link from "next/link";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { categories, expenses, invoices } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { requireStaff } from "@/lib/guard";
import { getOverviewStats, getRecentApplications, getRecentRepairs } from "@/lib/adminStats";
import { getSettings } from "@/lib/settings";
import { formatDateTime, formatINR, statusTone } from "@/lib/utils";
import { googleConfig } from "@/lib/googleSheet";

export const dynamic = "force-dynamic";
export const metadata = { title: "एडमिन अवलोकन" };

export default async function AdminOverviewPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const [stats, recentApps, recentRepairs, categoriesCount, settings, invoiceCount, expenseCount] = await Promise.all([
    getOverviewStats(),
    getRecentApplications(6),
    getRecentRepairs(3),
    db.select({ value: count() }).from(categories),
    getSettings(),
    db.select({ value: count() }).from(invoices),
    db.select({ value: count() }).from(expenses),
  ]);
  const sheetConfigured = googleConfig().configured;
  const documentsRough = stats.documents;

  const tiles = [
    { icon: "👥", value: stats.customers, label: "ग्राहक · Customers", href: "/admin/customers", tone: "from-indigo-500 to-violet-500" },
    { icon: "📥", value: stats.applications, label: "सेवा अनुरोध · Service requests", href: "/admin/applications", tone: "from-sky-500 to-blue-600" },
    { icon: "🛠️", value: stats.repairs, label: "रिपेयर जॉब · Repair jobs", href: "/admin/repairs", tone: "from-amber-500 to-orange-600" },
    { icon: "🗂️", value: stats.services, label: "सेवाएँ · Catalogue services", href: "/admin/services", tone: "from-emerald-500 to-teal-600" },
    { icon: "📎", value: documentsRough, label: "दस्तावेज़ · Documents", href: "/admin/documents", tone: "from-violet-500 to-fuchsia-600" },
    { icon: "💰", value: formatINR(stats.collected), label: "प्राप्त राशि · Collected", href: "/admin/invoices", tone: "from-emerald-600 to-green-600" },
    { icon: "⏳", value: formatINR(stats.outstanding), label: "बकाया · Outstanding", href: "/admin/invoices?status=Pending", tone: "from-amber-500 to-yellow-600" },
    { icon: "💸", value: formatINR(stats.expenses), label: "खर्च · Expenses", href: "/admin/expenses", tone: "from-rose-500 to-red-600" },
    { icon: "📈", value: formatINR(stats.net), label: "शुद्ध · Net", href: "/admin/reports", tone: "from-indigo-600 to-purple-700" },
  ];

  const quickCards = [
    {
      icon: "🌐",
      title: "वेबसाइट चालू/बंद + नई जोड़ें",
      subtitle: `${stats.websitesOn} चालू · ${stats.websitesOff} बंद · ${stats.websitesOn + stats.websitesOff} कुल`,
      href: "/admin/websites",
    },
    {
      icon: "🗂️",
      title: "नया मेन्यू जोड़ें",
      subtitle: `मेन्यू बनाएँ, उसमें सेवाएँ जोड़ें — सब जगह अपने-आप जुड़ जाएगा (${Number(categoriesCount[0]?.value ?? 0)} मेन्यू)`,
      href: "/admin/categories",
    },
    {
      icon: "👔",
      title: "उपयोगकर्ता प्रबंधन",
      subtitle: `${stats.users} उपयोगकर्ता · नया यूज़र आईडी व पासवर्ड बनाएँ`,
      href: "/admin/users",
    },
    {
      icon: "🎛️",
      title: "मेन्यू चालू/बंद",
      subtitle: "ग्राहक को कौन-सा मेन्यू दिखे, यह तय करें",
      href: "/admin/menus",
    },
    {
      icon: "📑",
      title: "CSV / शीट संग्रह",
      subtitle: "हर सेवा की अलग CSV फाइल डाउनलोड करें",
      href: "/admin/csv",
    },
    {
      icon: "📊",
      title: "गूगल शीट कनेक्शन",
      subtitle: sheetConfigured
        ? `${settings.sheetLastSync ? `अंतिम सिंक: ${formatDateTime(settings.sheetLastSync)}` : "कनेक्टेड · सिंक करें"}`
        : "⚠ अभी सेट नहीं है — सेटअप के लिए क्लिक करें",
      href: "/admin/sheets",
      warn: !sheetConfigured,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
            एडमिन डैशबोर्ड / Admin Dashboard
          </p>
          <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            स्वागत है, {session.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            @{session.username} · {session.role === "owner" ? "मालिक" : session.role === "manager" ? "प्रबंधक" : "ऑपरेटर"} ·{" "}
            {settings.businessName}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link href="/admin/applications" className="btn-primary px-3 py-1.5 text-xs">
            📥 अनुरोध देखें
          </Link>
          <Link href="/admin/reports" className="btn-ghost px-3 py-1.5 text-xs">
            📈 रिपोर्ट
          </Link>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {quickCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`card group flex items-start gap-3 p-3 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md ${card.warn ? "border-amber-300 dark:border-amber-400/30" : ""}`}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg dark:bg-white/10">
              {card.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold text-slate-800 group-hover:text-indigo-700 dark:text-slate-100">
                {card.title}
              </span>
              <span className={`mt-0.5 block text-[11px] leading-relaxed ${card.warn ? "font-semibold text-amber-700 dark:text-amber-300" : "text-slate-500 dark:text-slate-400"}`}>
                {card.subtitle}
              </span>
              <span className="mt-1 inline-block text-[11px] font-bold text-indigo-600 dark:text-indigo-300">खोलें →</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="card group p-2.5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-2">
              <span className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${tile.tone} text-sm text-white`}>
                {tile.icon}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-black text-slate-900 dark:text-white">{tile.value}</span>
              </span>
            </div>
            <p className="mt-1 text-[10px] font-bold leading-tight text-slate-500 group-hover:text-indigo-600 dark:text-slate-400">
              {tile.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="card p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">हाल के अनुरोध / Recent requests</h2>
            <Link href="/admin/applications" className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300">
              सभी देखें →
            </Link>
          </div>
          <div className="space-y-1.5">
            {recentApps.map((app) => (
              <Link
                key={app.id}
                href={`/admin/applications/${app.id}`}
                className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 px-2.5 py-2 transition hover:border-indigo-300 dark:border-white/10"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">{app.serviceName}</span>
                  <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {app.refNo} · {app.customerName} · {app.mobile}
                  </span>
                </span>
                <span className={`chip shrink-0 ${statusTone(app.status)}`}>{app.status}</span>
              </Link>
            ))}
            {recentApps.length === 0 ? <p className="text-xs text-slate-400">अभी कोई अनुरोध नहीं।</p> : null}
          </div>
        </div>

        <div className="space-y-3">
          <div className="card p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">रिपेयर जॉब / Repair jobs</h2>
              <Link href="/admin/repairs" className="text-[11px] font-bold text-indigo-600 dark:text-indigo-300">
                सभी देखें →
              </Link>
            </div>
            <div className="space-y-1.5">
              {recentRepairs.map((job) => (
                <Link
                  key={job.id}
                  href={`/admin/repairs/${job.id}`}
                  className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 px-2.5 py-2 transition hover:border-indigo-300 dark:border-white/10"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">{job.device}</span>
                    <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {job.jobNo} · {job.customerName} · {formatINR(job.finalAmount || job.estimate)}
                    </span>
                  </span>
                  <span className={`chip shrink-0 ${statusTone(job.status)}`}>{job.status}</span>
                </Link>
              ))}
              {recentRepairs.length === 0 ? <p className="text-xs text-slate-400">कोई रिपेयर जॉब नहीं।</p> : null}
            </div>
          </div>

          <div className="card p-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">स्थिति सारांश</h2>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-xl bg-amber-50 px-1 py-1.5 dark:bg-amber-500/10">
                <p className="text-sm font-black text-amber-700 dark:text-amber-300">{stats.pending}</p>
                <p className="text-[10px] font-bold text-amber-700/80 dark:text-amber-300/80">Pending</p>
              </div>
              <div className="rounded-xl bg-sky-50 px-1 py-1.5 dark:bg-sky-500/10">
                <p className="text-sm font-black text-sky-700 dark:text-sky-300">{stats.inProgress}</p>
                <p className="text-[10px] font-bold text-sky-700/80 dark:text-sky-300/80">In Progress</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-1 py-1.5 dark:bg-emerald-500/10">
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">{stats.completed}</p>
                <p className="text-[10px] font-bold text-emerald-700/80 dark:text-emerald-300/80">Completed</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
              <Link href="/admin/invoices" className="rounded-lg bg-slate-100 px-2 py-1.5 text-center dark:bg-white/10">
                💳 {Number(invoiceCount[0]?.value ?? 0)} इनवॉइस
              </Link>
              <Link href="/admin/expenses" className="rounded-lg bg-slate-100 px-2 py-1.5 text-center dark:bg-white/10">
                💸 {Number(expenseCount[0]?.value ?? 0)} खर्च
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
