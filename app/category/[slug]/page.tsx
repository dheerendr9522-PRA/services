import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureSeeded } from "@/db/seed";
import { getCategories, getCategoryBySlug, getServices } from "@/lib/queries";
import { formatINR } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureSeeded().catch(() => undefined);
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const [services, categories] = await Promise.all([
    getServices({ categoryId: category.id, limit: 200, activeOnly: false }),
    getCategories(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={`${category.icon} ${category.nameEn}`}
        title={category.nameHi}
        subtitle={category.description ?? undefined}
        actions={
          <Link href="/services" className="btn-ghost px-3 py-1.5 text-xs">
            ← सभी सेवाएँ
          </Link>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className={`chip ${c.slug === slug ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-indigo-50 dark:bg-white/10 dark:text-slate-300"}`}
          >
            {c.icon} {c.nameHi} ({c.serviceCount})
          </Link>
        ))}
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={category.icon}
          title="इस श्रेणी में अभी सेवा नहीं है"
          description="एडमिन डैशबोर्ड से नई सेवा जोड़ी जा सकती है।"
          action={
            <Link href="/services" className="btn-primary mt-2 px-3 py-1.5 text-xs">
              अन्य सेवाएँ देखें
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{services.length} सेवाएँ उपलब्ध</p>
            <Badge tone="amber">शुल्क अनुमानित · सरकारी स्वीकृति की गारंटी नहीं</Badge>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="flex flex-col gap-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/service/${service.slug}`}
                      className="line-clamp-2 text-sm font-extrabold text-slate-800 hover:text-indigo-700 dark:text-slate-100"
                    >
                      {service.nameHi}
                    </Link>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{service.nameEn}</p>
                  </div>
                  {!service.active ? <Badge tone="rose">बंद</Badge> : null}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 font-extrabold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    दुकान {formatINR(service.shopFee)}
                  </span>
                  {service.govtFee > 0 ? <span>🏛 {formatINR(service.govtFee)}</span> : null}
                  {service.bookingFee > 0 ? <span>🎫 {formatINR(service.bookingFee)}</span> : null}
                  <span>⏱ {service.timeEstimate}</span>
                </div>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {service.description}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <Link href={`/service/${service.slug}`} className="btn-primary px-2.5 py-1.5 text-xs">
                    आवेदन करें
                  </Link>
                  <Link href={`/service/${service.slug}`} className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {service.feeStatus}
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
