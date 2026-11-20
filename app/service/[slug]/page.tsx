import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureSeeded } from "@/db/seed";
import { getServiceBySlug, getServices } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/utils";
import { makeQrDataUrl, upiUri } from "@/lib/upi";
import { Badge, Card } from "@/components/ui";
import ServiceForm from "@/components/ServiceForm";
import MultiServiceForm from "@/components/MultiServiceForm";
import UpiPayBox from "@/components/UpiPayBox";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  await ensureSeeded().catch(() => undefined);
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound();
  const [settings, related, allServices] = await Promise.all([
    getSettings(),
    getServices({ categoryId: service.categoryId, limit: 6 }),
    getServices({ limit: 500 }),
  ]);
  const total = service.shopFee + service.govtFee + service.bookingFee;
  const qrDataUrl = await makeQrDataUrl(
    upiUri(settings.upiId, settings.upiName, total, service.nameEn.slice(0, 40)),
  );
  const waText = encodeURIComponent(`नमस्ते, मुझे इस सेवा की जानकारी चाहिए: ${service.nameHi}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <BackButton label="Back" />
        <Link href={`/category/${service.categorySlug}`} className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
          ← {service.categoryNameHi}
        </Link>
        <Link href="/services" className="text-xs font-bold text-slate-500 dark:text-slate-400">सभी सेवाएँ</Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">{service.nameHi}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">{service.nameEn}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="indigo">
                  {service.categoryIcon} {service.categoryNameHi}
                </Badge>
                <Badge tone="amber">⏱ अनुमानित समय: {service.timeEstimate}</Badge>
                <Badge tone="emerald">{service.feeStatus}</Badge>
                <Badge tone={service.serviceMode === "online" ? "sky" : service.serviceMode === "both" ? "indigo" : "amber"}>
                  {service.serviceMode === "online"
                    ? "🌐 बिना दुकान आए (ऑनलाइन) भी हो सकती है"
                    : service.serviceMode === "both"
                      ? "🏪 दुकान सहायता + 🌐 ऑनलाइन दोनों"
                      : "🏪 दुकान सहायता आवश्यक"}
                </Badge>
                {!service.active ? <Badge tone="rose">सेवा बंद</Badge> : null}
              </div>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right dark:bg-emerald-500/10">
              <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                अनुमानित कुल
              </p>
              <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{formatINR(total)}</p>
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{service.description}</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 px-2.5 py-2 dark:border-white/10">
              <p className="text-[10px] font-bold uppercase text-slate-500">दुकान सेवा शुल्क</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">{formatINR(service.shopFee)}</p>
              <p className="text-[10px] text-slate-400">दुकान द्वारा निर्धारित</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-2.5 py-2 dark:border-white/10">
              <p className="text-[10px] font-bold uppercase text-slate-500">सरकारी शुल्क</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">{formatINR(service.govtFee)}</p>
              <p className="text-[10px] text-slate-400">पोर्टल पर देय (अनुमानित)</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-2.5 py-2 dark:border-white/10">
              <p className="text-[10px] font-bold uppercase text-slate-500">बुकिंग / तृतीय पक्ष</p>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">{formatINR(service.bookingFee)}</p>
              <p className="text-[10px] text-slate-400">जैसे IRCTC सुविधा शुल्क</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`https://wa.me/91${settings.phonePrimary}?text=${waText}`}
              target="_blank"
              rel="noreferrer"
              className="btn bg-emerald-500 px-3 py-1.5 text-xs text-white hover:bg-emerald-600"
            >
              💬 WhatsApp पूछताछ
            </a>
            <a href={`tel:${settings.phonePrimary}`} className="btn-ghost px-3 py-1.5 text-xs">
              📞 कॉल करें
            </a>
            <Link href="/track" className="btn-ghost px-3 py-1.5 text-xs">
              📍 आवेदन ट्रैक
            </Link>
            {service.officialUrl ? (
              <a href={service.officialUrl} target="_blank" rel="noreferrer" className="btn-soft px-3 py-1.5 text-xs">
                🌐 ऑफिशियल वेबसाइट
              </a>
            ) : null}
          </div>

          <div className={`mt-3 rounded-xl border p-2.5 ${service.serviceMode === "shop" ? "border-amber-200 bg-amber-50/60 dark:border-amber-400/20 dark:bg-amber-500/10" : "border-emerald-200 bg-emerald-50/60 dark:border-emerald-400/20 dark:bg-emerald-500/10"}`}>
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              {service.serviceMode === "shop"
                ? "🏪 दुकान पर आकर करवाना आवश्यक"
                : service.serviceMode === "online"
                  ? "🌐 बिना दुकान आए भी करवा सकते हैं"
                  : "🏪 दुकान सहायता या 🌐 ऑनलाइन — आपकी पसंद"}
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              {service.onlineModeNote ||
                (service.serviceMode === "shop"
                  ? "दस्तावेज़ जाँच व सत्यापन के लिए ग्राहक को दुकान पर आना होगा।"
                  : "दस्तावेज़ फोटो/कैमरा से ऑनलाइन अपलोड करें, फॉर्म व शुल्क की पुष्टि फोन/WhatsApp पर हो जाएगी।")}
            </p>
          </div>

          <div className="mt-3 rounded-xl border border-slate-200 p-2.5 dark:border-white/10">
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">📋 आवश्यक दस्तावेज़</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {(service.documents.length ? service.documents : ["आधार कार्ड", "मोबाइल नंबर"]).map((doc) => (
                <span
                  key={doc}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300"
                >
                  {doc}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-3 rounded-xl bg-amber-50 px-2.5 py-2 text-[11px] font-semibold leading-relaxed text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            ⚖️ अनुपालन सूचना: यह दुकान केवल आवेदन सहायता सेवा देती है। सरकारी विभाग द्वारा स्वीकृति/अस्वीकृति का
            अधिकार पूर्णतः विभाग का है। कोई भी राशि सरकारी शुल्क के रूप में दुकान नहीं रखती।
          </p>
        </Card>

        <div className="space-y-3">
          <Card className="p-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">दुकान सहायता</p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{settings.ownerName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{settings.address}</p>
            <div className="mt-2 grid gap-1.5">
              <a href={`tel:${settings.phonePrimary}`} className="btn-ghost justify-start px-2.5 py-1.5 text-xs">
                📞 {settings.phonePrimary}
              </a>
              <a href={`tel:${settings.phoneSecondary}`} className="btn-ghost justify-start px-2.5 py-1.5 text-xs">
                📞 {settings.phoneSecondary}
              </a>
              <a href={`mailto:${settings.email}`} className="btn-ghost justify-start px-2.5 py-1.5 text-xs">
                ✉️ {settings.email}
              </a>
            </div>
          </Card>
          {settings.upiEnabled === "0" ? (
            <Card className="p-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              ऑनलाइन UPI भुगतान इस समय बंद है — दुकान पर नकद भुगतान करें। 📞 {settings.phonePrimary}
            </Card>
          ) : (
          <UpiPayBox
            upiName={settings.upiName}
            upiId={settings.upiId}
            upiMobile={settings.upiMobile}
            qrDataUrl={qrDataUrl}
            amount={total}
            compact
          />
          )}
          {related.filter((r) => r.slug !== service.slug).length > 0 ? (
            <Card className="p-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">इसी श्रेणी की सेवाएँ</p>
              <div className="mt-1.5 space-y-1">
                {related
                  .filter((r) => r.slug !== service.slug)
                  .slice(0, 5)
                  .map((r) => (
                    <Link
                      key={r.id}
                      href={`/service/${r.slug}`}
                      className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-xs hover:bg-slate-50 dark:hover:bg-white/5"
                    >
                      <span className="truncate text-slate-700 dark:text-slate-200">{r.nameHi}</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-300">{formatINR(r.shopFee)}</span>
                    </Link>
                  ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">🧩 एक साथ कई सेवाओं का आवेदन (मास्टर आवेदन)</h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          कई सेवाएँ चुनें — हर सेवा के दस्तावेज़, शुल्क व स्थिति अलग रहेगी, लेकिन एक ही मास्टर आवेदन ID मिलेगा।
        </p>
        <MultiServiceForm
          options={related.map((r) => ({
            slug: r.slug,
            nameHi: r.nameHi,
            nameEn: r.nameEn,
            shopFee: r.shopFee,
            govtFee: r.govtFee,
            bookingFee: r.bookingFee,
            documents: r.documents ?? [],
          }))}
          upi={{ name: settings.upiName, id: settings.upiId, mobile: settings.upiMobile, qrDataUrl }}
          pickerOptions={allServices.map((item) => ({
            slug: item.slug,
            nameHi: item.nameHi,
            nameEn: item.nameEn,
            shopFee: item.shopFee,
            govtFee: item.govtFee,
            bookingFee: item.bookingFee,
            documents: item.documents ?? [],
            serviceMode: item.serviceMode ?? "shop",
            categoryNameHi: item.categoryNameHi,
            categorySlug: item.categorySlug,
            categoryIcon: item.categoryIcon,
            timeEstimate: item.timeEstimate,
          }))}
        />
      </Card>

      <Card className="p-4">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white">सेवा आवेदन फॉर्म (एकल सेवा)</h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          फॉर्म भरें, दस्तावेज़ (कई फाइलें) अपलोड करें, UPI भुगतान का UTR दर्ज करें और आवेदन जमा करें। आपको ट्रैकिंग
          नंबर मिलेगा।
        </p>
        {settings.upiEnabled === "0" ? null : null}
        <ServiceForm
          service={{
            slug: service.slug,
            nameHi: service.nameHi,
            documents: service.documents,
            shopFee: service.shopFee,
            govtFee: service.govtFee,
            bookingFee: service.bookingFee,
            formFields: service.formFields ?? [],
          }}
          relatedOptions={related
            .filter((r) => r.slug !== service.slug)
            .slice(0, 4)
            .map((r) => ({ slug: r.slug, nameHi: r.nameHi, shopFee: r.shopFee }))}
          upi={{
            name: settings.upiName,
            id: settings.upiId,
            mobile: settings.upiMobile,
            qrDataUrl,
          }}
        />
      </Card>
    </div>
  );
}
