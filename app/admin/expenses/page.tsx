import { db } from "@/db";
import { expenses, invoices } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { filterLabel, matchesFilters, matchesQuery, parseFilters } from "@/lib/filters";
import { resourceConfigs } from "@/lib/resources";
import { formatINR } from "@/lib/utils";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import AdminFilterBar from "@/components/AdminFilterBar";
import DataManager, { type Row } from "@/components/DataManager";
import ColumnFilterTable from "@/components/ColumnFilter";

export const dynamic = "force-dynamic";
export const metadata = { title: "खर्च प्रबंधन" };

export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const filters = parseFilters(await searchParams);
  const config = resourceConfigs.expenses;
  const [allExpenses, invoiceRows] = await Promise.all([db.select().from(expenses), db.select().from(invoices)]);
  const list = allExpenses.filter(
    (e) => matchesFilters(e.spentAt, filters) && matchesQuery([e.title, e.category, e.paidTo, e.note], filters.q),
  );
  const rows = JSON.parse(JSON.stringify(list)) as Row[];
  const total = list.reduce((sum, e) => sum + e.amount, 0);
  const collected = invoiceRows.filter((i) => i.status === "Paid").reduce((sum, i) => sum + i.total, 0);
  const categoryTotals = Object.entries(
    list.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="एडमिन · खर्च"
        title="💸 खर्च व आय-व्यय"
        subtitle="दुकान के सभी खर्च दर्ज करें — किराया, बिजली, इंटरनेट, पार्ट्स, सैलरी। शुद्ध लाभ तुरंत दिखेगा।"
        actions={
          <a href="/exports/expenses.csv" className="btn-ghost px-3 py-1.5 text-xs">
            ⬇ खर्च CSV
          </a>
        }
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="💸" label="कुल खर्च (फ़िल्टर)" value={formatINR(total)} tone="rose" />
        <Stat icon="💰" label="प्राप्त राशि" value={formatINR(collected)} tone="emerald" />
        <Stat icon="📈" label="शुद्ध" value={formatINR(collected - total)} tone="indigo" />
        <Stat icon="🧾" label="खर्च प्रविष्टियाँ" value={list.length} tone="amber" />
      </div>

      <AdminFilterBar label="खर्च दिनांक / समय" searchPlaceholder="शीर्षक / श्रेणी / किसे खोजें…" exportHref="/exports/expenses.csv" />
      <Badge tone="slate">{filterLabel(filters)}</Badge>

      {categoryTotals.length > 0 ? (
        <div className="card flex flex-wrap gap-1.5 p-2.5">
          {categoryTotals.map(([category, amount]) => (
            <span key={category} className="chip bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
              {category}: <b>{formatINR(amount)}</b>
            </span>
          ))}
        </div>
      ) : null}

      <Card className="p-3">
        <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">💸 खर्च सूची — हर कॉलम पर फ़िल्टर</h2>
        <ColumnFilterTable
          rows={rows.map((row) => ({
            id: Number(row.id),
            values: {
              title: String(row.title ?? ""),
              category: String(row.category ?? ""),
              amount: formatINR(Number(row.amount ?? 0)),
              paidTo: String(row.paidTo ?? "—"),
              spentAt: String(row.spentAt ?? "").slice(0, 10),
            },
          }))}
          columns={[
            { key: "title", label: "शीर्षक" },
            { key: "category", label: "श्रेणी", type: "select" },
            { key: "amount", label: "राशि" },
            { key: "paidTo", label: "किसे" },
            { key: "spentAt", label: "दिनांक", type: "date" },
          ]}
        />
      </Card>

      <DataManager
        resource="expenses"
        label="खर्च"
        rows={rows}
        columns={config.columns}
        fields={config.fields}
        canCreate={canManage(session.role)}
        canDelete={canDelete(session.role)}
        searchPlaceholder="तालिका में खोजें…"
      />
    </div>
  );
}
