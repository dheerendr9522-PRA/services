import Link from "next/link";
import { ensureSeeded } from "@/db/seed";
import { globalSearch } from "@/lib/queries";
import { formatINR } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "ग्लोबल सर्च" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await ensureSeeded().catch(() => undefined);
  const { q = "" } = await searchParams;
  const { serviceRows, websiteRows, categoryRows } = q ? await globalSearch(q) : { serviceRows: [], websiteRows: [], categoryRows: [] };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Global search"
        title="ग्लोबल सर्च"
        subtitle="सेवाएँ, श्रेणियाँ व सरकारी वेबसाइट — सब एक साथ खोजें।"
      />
      <Card className="p-3">
        <form action="/search" className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="आधार, पैन, लैपटॉप रिपेयर, IRCTC…" className="input" autoFocus />
          <button type="submit" className="btn-primary">
            🔍 खोजें
          </button>
        </form>
      </Card>

      {!q ? (
        <EmptyState icon="🔎" title="कुछ खोजें" description="जैसे: आधार, पैन, जाति प्रमाण, लैपटॉप रिपेयर, IRCTC, लाड़ली बहना।" />
      ) : serviceRows.length + websiteRows.length + categoryRows.length === 0 ? (
        <EmptyState icon="🤷" title={`“${q}” के लिए कुछ नहीं मिला`} description="अलग शब्द आज़माएँ या दुकान पर कॉल करें।" />
      ) : (
        <>
          {serviceRows.length > 0 ? (
            <Card className="p-3">
              <h2 className="mb-2 text-sm font-extrabold text-slate-900 dark:text-white">
                🧾 सेवाएँ <Badge tone="indigo">{serviceRows.length}</Badge>
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {serviceRows.map(({ service, categorySlug }) => (
                  <Link
                    key={service.id}
                    href={`/service/${service.slug}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-2.5 text-xs hover:border-indigo-300 dark:border-white/10"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">{service.nameHi}</span>
                      <span className="block truncate text-[11px] text-slate-400">
                        {service.nameEn} · {categorySlug} · ⏱ {service.timeEstimate}
                      </span>
                    </span>
                    <span className="shrink-0 font-extrabold text-emerald-600 dark:text-emerald-300">{formatINR(service.shopFee)}</span>
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}

          {categoryRows.length > 0 ? (
            <Card className="p-3">
              <h2 className="mb-2 text-sm font-extrabold text-slate-900 dark:text-white">
                🗂️ श्रेणियाँ <Badge tone="emerald">{categoryRows.length}</Badge>
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {categoryRows.map((category) => (
                  <Link key={category.id} href={`/category/${category.slug}`} className="chip bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">
                    {category.icon} {category.nameHi}
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}

          {websiteRows.length > 0 ? (
            <Card className="p-3">
              <h2 className="mb-2 text-sm font-extrabold text-slate-900 dark:text-white">
                🌐 वेबसाइट <Badge tone="amber">{websiteRows.length}</Badge>
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {websiteRows.map((site) => (
                  <a
                    key={site.id}
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-2.5 text-xs font-semibold hover:border-indigo-300 dark:border-white/10"
                  >
                    <span>{site.name}</span>
                    <span className="text-slate-400">↗</span>
                  </a>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
