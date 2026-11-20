import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { getRepairs } from "@/lib/queries";
import { filterLabel, matchesFilters, matchesQuery, parseFilters } from "@/lib/filters";
import { resourceConfigs } from "@/lib/resources";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import AdminFilterBar from "@/components/AdminFilterBar";
import DataManager, { type Row } from "@/components/DataManager";
import ColumnFilterTable from "@/components/ColumnFilter";
import { formatINR } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "रिपेयर जॉब" };

export default async function AdminRepairsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const filters = parseFilters(await searchParams);
  const config = resourceConfigs.repairs;
  const repairs = await getRepairs(500);
  const list = repairs.filter(
    (r) => matchesFilters(r.createdAt, filters) && matchesQuery([r.jobNo, r.customerName, r.mobile, r.device, r.issue, r.status], filters.q),
  );
  const rows = JSON.parse(JSON.stringify(list)) as Row[];

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="एडमिन · रिपेयर जॉब"
        title={`🛠️ रिपेयर जॉब कार्ड (${rows.length})`}
        subtitle="डिवाइस, समस्या, टेक्नीशियन, अनुमान व अंतिम राशि। View में जॉब कार्ड प्रिंट करें।"
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat icon="🛠️" label="कुल जॉब" value={repairs.length} tone="indigo" />
        <Stat icon="⏳" label="खुली जॉब" value={repairs.filter((r) => r.status !== "Completed").length} tone="amber" />
        <Stat icon="✅" label="पूर्ण जॉब" value={repairs.filter((r) => r.status === "Completed").length} tone="emerald" />
      </div>
      <AdminFilterBar label="दिनांक / समय" searchPlaceholder="जॉब / ग्राहक / डिवाइस खोजें…" exportHref="/exports/repairs.csv" />
      <Badge tone="slate">{filterLabel(filters)}</Badge>
      <Card className="p-3">
        <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">🛠️ रिपेयर जॉब — हर कॉलम पर फ़िल्टर</h2>
        <ColumnFilterTable
          rows={rows.map((row) => ({
            id: Number(row.id),
            values: {
              jobNo: String(row.jobNo ?? ""),
              customerName: String(row.customerName ?? ""),
              mobile: String(row.mobile ?? ""),
              device: String(row.device ?? ""),
              technician: String(row.technician ?? "—"),
              estimate: formatINR(Number(row.estimate ?? 0)),
              status: String(row.status ?? ""),
              createdAt: String(row.createdAt ?? "").slice(0, 10),
            },
            actions: [{ label: "👁 जॉब कार्ड", href: `/admin/repairs/${row.id}` }],
          }))}
          columns={[
            { key: "jobNo", label: "जॉब" },
            { key: "customerName", label: "ग्राहक" },
            { key: "mobile", label: "मोबाइल" },
            { key: "device", label: "डिवाइस" },
            { key: "technician", label: "टेक्नीशियन", type: "select" },
            { key: "estimate", label: "अनुमान" },
            { key: "status", label: "स्थिति", type: "select" },
            { key: "createdAt", label: "दिनांक", type: "date" },
          ]}
        />
      </Card>

      <DataManager
        resource="repairs"
        label="रिपेयर जॉब"
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
