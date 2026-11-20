import Link from "next/link";
import { ensureSeeded } from "@/db/seed";
import { getCategories, getServices } from "@/lib/queries";
import { formatINR } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; category?: string; maxFee?: string; minFee?: string }>;

export default async function ServicesPage({ searchParams }: { searchParams: SearchParams }) {
  await ensureSeeded().catch(() => undefined);
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const categorySlug = params.category ?? "";
  const maxFee = params.maxFee ? Number(params.maxFee) : undefined;
  const minFee = params.minFee ? Number(params.minFee) : undefined;

  const [categories, services] = await Promise.all([
    getCategories(),
    getServices({
      q: q || undefined,
      categorySlug: categorySlug || undefined,
      maxFee: Number.isFinite(maxFee) ? maxFee : undefined,
      minFee: Number.isFinite(minFee) ? minFee : undefined,
      limit: 400,
    }),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Service catalogue"
        title="सभी सेवाएँ"
        subtitle="सरकारी सेवाएँ, योजनाएँ, बैंकिंग, बिल, यात्रा, कंप्यूटर रिपेयर व प्रिंटिंग — सभी श्रेणियाँ एक जगह। शुल्क दुकान द्वारा निर्धारित/अनुमानित हैं।"
        actions={
          <Link href="/directory" className="btn-ghost px-3 py-1.5 text-xs">
            🌐 सरकारी वेबसाइट
          </Link>
        }
      />

      <Card className="p-3">
        <form action="/services" className="grid gap-2 sm:grid-cols-[1.4fr_1fr_0.7fr_0.7fr_auto]">
          <input name="q" defaultValue={q} placeholder="सेवा खोजें… (जैसे आधार, पैन, रिपेयर)" className="input" />
          <select name="category" defaultValue={categorySlug} className="input">
            <option value="">सभी श्रेणियाँ</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.icon} {c.nameHi}
              </option>
            ))}
          </select>
          <input name="minFee" defaultValue={params.minFee ?? ""} placeholder="न्यूनतम ₹" inputMode="numeric" className="input" />
          <input name="maxFee" defaultValue={params.maxFee ?? ""} placeholder="अधिकतम ₹" inputMode="numeric" className="input" />
          <button type="submit" className="btn-primary">
            🔍 खोजें
          </button>
        </form>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Link href="/services" className={`chip ${!categorySlug ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
            सभी ({services.length})
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/services?category=${c.slug}`}
              className={`chip ${categorySlug === c.slug ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-indigo-50 dark:bg-white/10 dark:text-slate-300"}`}
            >
              {c.icon} {c.nameHi}
            </Link>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {services.length} सेवाएँ मिलीं {q ? <>— “{q}”</> : null}
        </p>
        <Badge tone="amber">सभी शुल्क अनुमानित · स्वीकृति की गारंटी नहीं</Badge>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="कोई सेवा नहीं मिली"
          description="खोज शब्द बदलें या फ़िल्टर हटाएँ। आप सीधे दुकान पर कॉल भी कर सकते हैं।"
          action={
            <Link href="/services" className="btn-primary mt-2 px-3 py-1.5 text-xs">
              फ़िल्टर हटाएँ
            </Link>
          }
        />
      ) : (
        <div className="auto-grid grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/service/${service.slug}`}
              className="group card flex flex-col gap-1.5 p-3 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-800 group-hover:text-indigo-700 dark:text-slate-100">
                    {service.nameHi}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{service.nameEn}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-emerald-50 px-1.5 py-0.5 text-xs font-extrabold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {formatINR(service.shopFee)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 dark:bg-white/10">
                  {service.categoryIcon} {service.categoryNameHi}
                </span>
                <span>⏱ {service.timeEstimate}</span>
                {service.govtFee > 0 ? <span>🏛 सरकारी {formatINR(service.govtFee)}</span> : null}
              </div>
              <span className="mt-auto text-[11px] font-bold text-indigo-600 dark:text-indigo-300">आवेदन करें →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
