import Link from "next/link";
import { ensureSeeded } from "@/db/seed";
import { getServices } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/utils";
import { Card, PageHeader } from "@/components/ui";
import BookingForm from "@/components/BookingForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "बिलिंग एवं अकाउंटिंग सहायता" };

export default async function AccountingPublicPage() {
  await ensureSeeded().catch(() => undefined);
  const [services, settings] = await Promise.all([
    getServices({ categorySlug: "billing-accounting", limit: 40 }),
    getSettings(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Billing & Accounting"
        title="🧮 बिलिंग एवं अकाउंटिंग सहायता"
        subtitle="दुकान के लिए बिलिंग सॉफ्टवेयर, Excel अकाउंटिंग शीट, स्टॉक रजिस्टर, पुराने डेटा की एंट्री व मासिक डेटा एंट्री सेवा — बुकिंग करें और ID पाएँ।"
        actions={<Link href="/admin/accounting" className="btn-ghost px-3 py-1.5 text-xs">🧮 एडमिन मॉड्यूल</Link>}
      />

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-2 sm:grid-cols-2">
          {services.map((service) => (
            <Card key={service.id} className="flex flex-col gap-1 p-3">
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">{service.nameHi}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{service.nameEn}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">⏱ {service.timeEstimate} · 📄 {(service.documents ?? []).join(", ") || "कोई दस्तावेज़ नहीं"}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{formatINR(service.shopFee)} से</span>
                <Link href={`/service/${service.slug}`} className="btn-primary px-2 py-1 text-[11px]">आवेदन करें</Link>
              </div>
            </Card>
          ))}
          {services.length === 0 ? <Card className="p-4 text-sm text-slate-500">सेवाएँ लोड हो रही हैं…</Card> : null}
        </div>

        <div className="space-y-3">
          <Card className="p-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">📅 सेवा बुकिंग फॉर्म</h2>
            <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">सेवा चुनें, नाम व मोबाइल दर्ज करें — बुकिंग ID तुरंत मिलेगा।</p>
            <BookingForm services={services.map((s) => ({ name: s.nameHi, fee: s.shopFee }))} />
          </Card>
          <Card className="p-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            <p className="font-bold text-slate-800 dark:text-slate-100">📞 सहायता</p>
            <p>📞 {settings.phonePrimary} · {settings.phoneSecondary}</p>
            <p>✉️ {settings.email}</p>
            <p className="mt-1 text-slate-400">बुकिंग स्थिति (New Request / In Progress / Completed) दुकान से या एडमिन पैनल से देखी जा सकती है।</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
