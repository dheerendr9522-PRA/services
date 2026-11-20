import { db } from "@/db";
import { applications, expenses, invoices, repairs } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { requireStaff } from "@/lib/guard";
import { filterLabel, matchesFilters, parseFilters } from "@/lib/filters";
import { formatINR } from "@/lib/utils";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import AdminFilterBar from "@/components/AdminFilterBar";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "रिपोर्ट" };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded().catch(() => undefined);
  await requireStaff();
  const filters = parseFilters(await searchParams);

  const [invoiceRows, expenseRows, appRows, repairRows] = await Promise.all([
    db.select().from(invoices),
    db.select().from(expenses),
    db.select().from(applications),
    db.select().from(repairs),
  ]);

  const invoicesInRange = invoiceRows.filter((i) => matchesFilters(i.createdAt, filters));
  const expensesInRange = expenseRows.filter((e) => matchesFilters(e.spentAt, filters));
  const appsInRange = appRows.filter((a) => matchesFilters(a.createdAt, filters));
  const repairsInRange = repairRows.filter((r) => matchesFilters(r.createdAt, filters));

  const collected = invoicesInRange.filter((i) => i.status === "Paid").reduce((sum, i) => sum + i.total, 0);
  const outstanding = invoicesInRange.filter((i) => i.status !== "Paid").reduce((sum, i) => sum + i.total, 0);
  const expenseTotal = expensesInRange.reduce((sum, e) => sum + e.amount, 0);
  const appRevenue = appsInRange.reduce((sum, a) => sum + a.amount, 0);
  const repairRevenue = repairsInRange.reduce((sum, r) => sum + r.finalAmount, 0);

  const months: { key: string; label: string; collected: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      key,
      label: date.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      collected: invoiceRows
        .filter((inv) => inv.status === "Paid" && inv.createdAt.toISOString().slice(0, 7) === key)
        .reduce((sum, inv) => sum + inv.total, 0),
      expenses: expenseRows
        .filter((e) => e.spentAt.toISOString().slice(0, 7) === key)
        .reduce((sum, e) => sum + e.amount, 0),
    });
  }

  const byService = Object.entries(
    appsInRange.reduce<Record<string, { count: number; amount: number }>>((acc, app) => {
      const key = app.serviceName;
      acc[key] = acc[key] ?? { count: 0, amount: 0 };
      acc[key].count += 1;
      acc[key].amount += app.amount;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12);

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="एडमिन · रिपोर्ट"
        title="📈 आय-व्यय व कार्य रिपोर्ट"
        subtitle="दिनांक, माह, वर्ष, दिन व समय के अनुसार रिपोर्ट बनाएँ और प्रिंट करें।"
        actions={
          <>
            <PrintButton label="🖨 रिपोर्ट प्रिंट / PDF" />
            <a href="/exports/applications.csv" className="btn-ghost px-3 py-1.5 text-xs">⬇ Excel / CSV</a>
          </>
        }
      />
      <div className="no-print">
        <AdminFilterBar label="रिपोर्ट अवधि" searchPlaceholder="सेवा खोजें…" showSearch={false} exportHref="/exports/invoices.csv" />
      </div>
      <Badge tone="indigo">{filterLabel(filters)}</Badge>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Stat icon="💰" label="प्राप्त" value={formatINR(collected)} tone="emerald" />
        <Stat icon="⏳" label="बकाया" value={formatINR(outstanding)} tone="amber" />
        <Stat icon="💸" label="खर्च" value={formatINR(expenseTotal)} tone="rose" />
        <Stat icon="📈" label="शुद्ध लाभ" value={formatINR(collected - expenseTotal)} tone="indigo" />
        <Stat icon="📥" label="आवेदन" value={appsInRange.length} hint={formatINR(appRevenue)} tone="sky" />
        <Stat icon="🛠️" label="रिपेयर" value={repairsInRange.length} hint={formatINR(repairRevenue)} tone="amber" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">माह-वार आय व व्यय (6 माह)</h2>
          <table className="table-base mt-1.5 min-w-0">
            <thead>
              <tr>
                <th>माह</th>
                <th>प्राप्त</th>
                <th>खर्च</th>
                <th>शुद्ध</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month) => (
                <tr key={month.key}>
                  <td>{month.label}</td>
                  <td className="text-emerald-600 dark:text-emerald-300">{formatINR(month.collected)}</td>
                  <td className="text-rose-600 dark:text-rose-300">{formatINR(month.expenses)}</td>
                  <td className="font-bold">{formatINR(month.collected - month.expenses)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">सेवा-वार कार्य (शीर्ष 12)</h2>
          <table className="table-base mt-1.5 min-w-0">
            <thead>
              <tr>
                <th>सेवा</th>
                <th>संख्या</th>
                <th>राशि</th>
              </tr>
            </thead>
            <tbody>
              {byService.map(([service, value]) => (
                <tr key={service}>
                  <td className="max-w-[220px] truncate">{service}</td>
                  <td>{value.count}</td>
                  <td className="font-bold">{formatINR(value.amount)}</td>
                </tr>
              ))}
              {byService.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-xs text-slate-400">
                    इस अवधि में कोई आवेदन नहीं।
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">विस्तृत रिपोर्ट डाउनलोड</h2>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["applications", "सेवा अनुरोध CSV"],
            ["invoices", "इनवॉइस CSV"],
            ["expenses", "खर्च CSV"],
            ["deliverables", "पूर्ण कार्य CSV"],
            ["repairs", "रिपेयर CSV"],
            ["customers", "ग्राहक CSV"],
            ["all-services", "सेवा सूची CSV"],
            ["audit", "ऑडिट लॉग CSV"],
            ["bills", "बिल CSV"],
            ["payments", "भुगतान CSV"],
          ].map(([type, label]) => (
            <a
              key={type}
              href={`/exports/${type}.csv`}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold hover:border-indigo-300 dark:border-white/10"
            >
              <span>{label}</span>
              <span className="text-emerald-600 dark:text-emerald-300">⬇</span>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
