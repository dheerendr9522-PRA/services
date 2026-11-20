import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { getApplications, getCustomers } from "@/lib/queries";
import { filterLabel, matchesFilters, matchesQuery, parseFilters } from "@/lib/filters";
import { resourceConfigs } from "@/lib/resources";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import AdminFilterBar from "@/components/AdminFilterBar";
import DataManager, { type Row } from "@/components/DataManager";
import ColumnFilterTable from "@/components/ColumnFilter";

export const dynamic = "force-dynamic";
export const metadata = { title: "ग्राहक प्रबंधन" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const filters = parseFilters(await searchParams);
  const config = resourceConfigs.customers;
  const [customers, applications] = await Promise.all([getCustomers(), getApplications({ limit: 500 })]);
  const list = customers.filter(
    (c) => matchesFilters(c.createdAt, filters) && matchesQuery([c.name, c.mobile, c.village, c.address, c.email], filters.q),
  );
  const rows = JSON.parse(
    JSON.stringify(
      list.map((c) => ({
        id: c.id,
        name: c.name,
        mobile: c.mobile,
        address: c.address,
        village: c.village,
        email: c.email,
        active: c.active,
        createdAt: c.createdAt,
        applications: applications.filter((a) => a.mobile === c.mobile).length,
      })),
    ),
  ) as Row[];

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="एडमिन · ग्राहक"
        title={`👥 ग्राहक प्रबंधन (${rows.length})`}
        subtitle="सभी ग्राहक, संपर्क विवरण व आवेदन संख्या। View, Download, Print, Edit, Delete सभी पंक्तियों पर उपलब्ध।"
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat icon="👥" label="कुल ग्राहक" value={customers.length} tone="indigo" />
        <Stat icon="📥" label="कुल आवेदन" value={applications.length} tone="sky" />
        <Stat icon="🏷️" label="फ़िल्टर परिणाम" value={rows.length} tone="emerald" />
      </div>
      <AdminFilterBar label="जुड़ने की तिथि" searchPlaceholder="नाम / मोबाइल / गाँव खोजें…" exportHref="/exports/customers.csv" />
      <Badge tone="slate">{filterLabel(filters)}</Badge>
      <Card className="p-3">
        <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">👥 ग्राहक सूची — हर कॉलम पर फ़िल्टर</h2>
        <ColumnFilterTable
          rows={rows.map((row) => ({
            id: Number(row.id),
            values: {
              name: String(row.name ?? ""),
              mobile: String(row.mobile ?? ""),
              village: String(row.village ?? "—"),
              address: String(row.address ?? "—"),
              applications: Number(row.applications ?? 0),
              createdAt: String(row.createdAt ?? "").slice(0, 10),
            },
            actions: [
              { label: "👁 View", href: `/admin/customers?view=${row.id}` },
              { label: "📁 Folder", href: `/api/customer-folder?mobile=${row.mobile}` },
            ],
          }))}
          columns={[
            { key: "name", label: "नाम" },
            { key: "mobile", label: "मोबाइल" },
            { key: "village", label: "गाँव", type: "select" },
            { key: "address", label: "पता" },
            { key: "applications", label: "आवेदन", type: "number" },
            { key: "createdAt", label: "जुड़े", type: "date" },
          ]}
        />
      </Card>

      <DataManager
        resource="customers"
        label="ग्राहक"
        rows={rows}
        columns={[...config.columns, { key: "applications", label: "आवेदन" }, { key: "createdAt", label: "जुड़े" }]}
        fields={config.fields}
        canCreate={canManage(session.role)}
        canDelete={canDelete(session.role)}
        searchPlaceholder="तालिका में खोजें…"
      />
    </div>
  );
}
