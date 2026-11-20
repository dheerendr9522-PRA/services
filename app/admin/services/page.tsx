import { db } from "@/db";
import { categories } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { getServices } from "@/lib/queries";
import { resourceConfigs } from "@/lib/resources";
import { Badge, PageHeader } from "@/components/ui";
import BackButton from "@/components/BackButton";
import AdminFilterBar from "@/components/AdminFilterBar";
import { filterLabel, matchesFilters, matchesQuery, parseFilters } from "@/lib/filters";
import DataManager, { type Row } from "@/components/DataManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "सेवा प्रबंधन" };

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const filters = parseFilters(await searchParams);
  const config = resourceConfigs.services;
  const [services, categoryRows] = await Promise.all([getServices({ limit: 400, activeOnly: false }), db.select().from(categories)]);
  const categoryFilter = typeof (await searchParams).category === "string" ? String((await searchParams).category) : "";
  const filteredServices = services.filter(
    (service) =>
      matchesFilters(service.createdAt, filters) &&
      matchesQuery([service.nameHi, service.nameEn, service.slug, service.categoryNameHi], filters.q) &&
      (!categoryFilter || String(service.categoryId) === categoryFilter),
  );
  const rows = JSON.parse(
    JSON.stringify(
      filteredServices.map((service) => ({
        id: service.id,
        nameHi: service.nameHi,
        nameEn: service.nameEn,
        categoryId: service.categoryId,
        description: service.description,
        shopFee: service.shopFee,
        govtFee: service.govtFee,
        bookingFee: service.bookingFee,
        timeEstimate: service.timeEstimate,
        officialUrl: service.officialUrl,
        documents: service.documents,
        feeStatus: service.feeStatus,
        featured: service.featured,
        active: service.active,
        slug: service.slug,
      })),
    ),
  ) as Row[];

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="Admin · Catalogue"
        title={`➕ सेवा प्रबंधन (${rows.length})`}
        subtitle="किसी भी सेवा को जोड़ें, शुल्क/समय बदलें, ON/OFF करें या हटाएँ — बिना कोड बदले। नई सेवा अपने आप फॉर्म, फ़िल्टर, बिलिंग व CSV में जुड़ जाती है।"
      />
      <AdminFilterBar
        label="सेवा जोड़ने की तिथि"
        searchPlaceholder="सेवा खोजें…"
        exportHref="/exports/all-services.csv"
        categories={categoryRows.map((c) => ({ value: String(c.id), label: `${c.icon} ${c.nameHi}` }))}
      />
      <Badge tone="slate">{filterLabel(filters)}</Badge>
      <DataManager
        resource="services"
        label="सेवा"
        rows={rows}
        columns={config.columns}
        fields={config.fields}
        canCreate={canManage(session.role)}
        canDelete={canDelete(session.role)}
        optionsMap={{
          categoryId: categoryRows.map((c) => ({ value: String(c.id), label: `${c.icon} ${c.nameHi}` })),
        }}
        searchPlaceholder="सेवा खोजें (हिंदी/English)…"
      />
    </div>
  );
}
