import Link from "next/link";
import { ensureSeeded } from "@/db/seed";
import { getServices, getWebsites } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/utils";
import { Badge, Card, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "रेल टिकट बुकिंग व रेलवे सहायता" };

export default async function TrainPage() {
  await ensureSeeded().catch(() => undefined);
  const [services, sites, settings] = await Promise.all([
    getServices({ categorySlug: "railway", limit: 40 }),
    getWebsites(),
    getSettings(),
  ]);
  const railwaySites = sites.filter((s) => /rail|irctc|indianrail/i.test(s.url + s.name));

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-sky-700 via-indigo-700 to-violet-800 p-5 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Railway assistance counter</p>
        <h1 className="mt-1 text-2xl font-black">🚆 रेल टिकट बुकिंग व रेलवे पूछताछ</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/85">
          IRCTC टिकट बुकिंग सहायता, PNR स्टेटस, ट्रेन शेड्यूल, तत्काल बुकिंग व रिफंड सहायता। बुकिंग सहायता शुल्क
          दुकान द्वारा निर्धारित है — किराया IRCTC के अनुसार अलग देय होता है।
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`tel:${settings.phonePrimary}`} className="btn bg-white px-3 py-1.5 text-xs text-indigo-700">
            📞 टिकट बुक करवाएँ
          </a>
          <a
            href={`https://wa.me/91${settings.phonePrimary}?text=${encodeURIComponent("मुझे रेल टिकट बुकिंग सहायता चाहिए।")}`}
            target="_blank"
            rel="noreferrer"
            className="btn bg-white/15 px-3 py-1.5 text-xs"
          >
            💬 WhatsApp
          </a>
          <a href="https://enquiry.indianrail.gov.in/" target="_blank" rel="noreferrer" className="btn bg-white/15 px-3 py-1.5 text-xs">
            🔎 PNR एन्क्वायरी
          </a>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="flex flex-col gap-1.5 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{service.nameHi}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{service.nameEn}</p>
              </div>
              <Badge tone="emerald">{formatINR(service.shopFee)}</Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">⏱ {service.timeEstimate}</p>
            <div className="mt-auto flex gap-1.5 pt-1">
              <Link href={`/service/${service.slug}`} className="btn-primary px-2.5 py-1.5 text-xs">
                आवेदन करें
              </Link>
              {service.officialUrl ? (
                <a href={service.officialUrl} target="_blank" rel="noreferrer" className="btn-ghost px-2.5 py-1.5 text-xs">
                  ऑफिशियल ↗
                </a>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🔗 रेलवे ऑफिशियल पोर्टल</h2>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {(railwaySites.length
            ? railwaySites
            : [
                { id: 1, name: "IRCTC", url: "https://www.irctc.co.in/", section: "central", active: true, note: "", sortOrder: 1 },
                { id: 2, name: "भारतीय रेलवे", url: "https://indianrailways.gov.in/", section: "central", active: true, note: "", sortOrder: 2 },
              ]
          ).map((site) => (
            <a
              key={site.id}
              href={site.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300 dark:border-white/10 dark:text-slate-200"
            >
              <span>{site.name}</span>
              <span className="text-slate-400">↗</span>
            </a>
          ))}
        </div>
        <p className="mt-2 rounded-xl bg-slate-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-500 dark:bg-white/5 dark:text-slate-400">
          टिकट बुकिंग प्रमाणित IRCTC चैनल/अधिकृत व्यवस्था के माध्यम से की जाती है। हम स्वयं कोई रेलवे प्राधिकरण नहीं
          हैं — केवल बुकिंग सहायता सेवा।
        </p>
      </Card>
    </div>
  );
}
