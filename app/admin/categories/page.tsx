import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { getCategories } from "@/lib/queries";
import { resourceConfigs } from "@/lib/resources";
import { PageHeader } from "@/components/ui";
import BackButton from "@/components/BackButton";
import DataManager, { type Row } from "@/components/DataManager";
import AdminFilterBar from "@/components/AdminFilterBar";

export const dynamic = "force-dynamic";
export const metadata = { title: "मेन्यू व श्रेणी प्रबंधन" };

export default async function AdminCategoriesPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const config = resourceConfigs.categories;
  const categories = await getCategories(false);
  const rows = JSON.parse(
    JSON.stringify(
      categories.map((c) => ({
        id: c.id,
        nameHi: c.nameHi,
        nameEn: c.nameEn,
        slug: c.slug,
        icon: c.icon,
        groupKey: c.groupKey,
        description: c.description,
        sortOrder: c.sortOrder,
        active: c.active,
        serviceCount: c.serviceCount,
      })),
    ),
  ) as Row[];

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="Admin · Menus"
        title="➕ Add Menu / श्रेणी प्रबंधन"
        subtitle="नई श्रेणी जोड़ें, नाम/आइकन बदलें, ON/OFF करें या हटाएँ। श्रेणी तुरंत साइडबार, सेवा फ़िल्टर व CSV में उपलब्ध होती है।"
      />
      <AdminFilterBar label="खोज" searchPlaceholder="श्रेणी खोजें…" showSearch />
      <DataManager
        resource="categories"
        label="श्रेणी"
        rows={rows}
        columns={[...config.columns, { key: "serviceCount", label: "सेवाएँ" }]}
        fields={config.fields}
        canCreate={canManage(session.role)}
        canDelete={canDelete(session.role)}
        searchPlaceholder="श्रेणी खोजें…"
      />
    </div>
  );
}
