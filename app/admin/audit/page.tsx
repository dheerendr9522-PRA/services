import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { requireStaff } from "@/lib/guard";
import { filterLabel, matchesFilters, matchesQuery, parseFilters } from "@/lib/filters";
import { formatDateTime } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import AdminFilterBar from "@/components/AdminFilterBar";

export const dynamic = "force-dynamic";
export const metadata = { title: "ऑडिट लॉग" };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded().catch(() => undefined);
  await requireStaff();
  const filters = parseFilters(await searchParams);
  const all = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(500);
  const logs = all.filter((log) => matchesFilters(log.createdAt, filters) && matchesQuery([log.actor, log.action, log.detail], filters.q));

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="एडमिन · सुरक्षा"
        title="📜 ऑडिट लॉग"
        subtitle="हर बदलाव का रिकॉर्ड — किसने, कब व क्या किया। दिनांक, माह, वर्ष, दिन व समय से फ़िल्टर करें।"
        actions={
          <a href="/exports/audit.csv" className="btn-ghost px-3 py-1.5 text-xs">
            ⬇ ऑडिट CSV
          </a>
        }
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat icon="📜" label="कुल लॉग" value={all.length} tone="indigo" />
        <Stat icon="🔎" label="फ़िल्टर परिणाम" value={logs.length} tone="sky" />
        <Stat icon="👤" label="विशिष्ट यूज़र" value={new Set(all.map((l) => l.actor)).size} tone="emerald" />
      </div>
      <AdminFilterBar label="लॉग समय" searchPlaceholder="यूज़र / क्रिया / विवरण खोजें…" exportHref="/exports/audit.csv" />
      <Badge tone="slate">{filterLabel(filters)}</Badge>

      {logs.length === 0 ? (
        <EmptyState icon="📜" title="कोई लॉग नहीं मिला" description="फ़िल्टर बदलें।" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>समय</th>
                <th>यूज़र</th>
                <th>क्रिया</th>
                <th>विवरण</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap text-[11px]">{formatDateTime(log.createdAt)}</td>
                  <td className="text-[11px] font-semibold">{log.actor}</td>
                  <td>
                    <span className="chip bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{log.action}</span>
                  </td>
                  <td className="text-[11px] text-slate-500 dark:text-slate-400">{log.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
