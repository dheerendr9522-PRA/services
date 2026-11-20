import Link from "next/link";
import { ensureSeeded } from "@/db/seed";
import { getCategories, getServices, getWebsites } from "@/lib/queries";
import { db } from "@/db";
import { customButtons, customCards, feedback, offers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { getStaffSession, getCustomerSession } from "@/lib/auth";
import { formatINR } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader, QuickLink, Stat } from "@/components/ui";
import BannerStrip, { type BannerItem } from "@/components/BannerStrip";
import { getBannersForPage } from "@/lib/banners";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeeded().catch(() => undefined);
  const [offerRows, reviewRows] = await Promise.all([
    db.select().from(offers).orderBy(desc(offers.createdAt)).limit(4).catch(() => []),
    db.select().from(feedback).orderBy(desc(feedback.rating)).limit(3).catch(() => []),
  ]);
  const activeOffers = offerRows.filter((offer) => offer.active && offer.endDate >= new Date());
  const avgRating = reviewRows.length
    ? (reviewRows.reduce((sum, review) => sum + review.rating, 0) / reviewRows.length).toFixed(1)
    : "5.0";
  const [settings, categories, featured, sites, staff, customer] = await Promise.all([
    getSettings(),
    getCategories(),
    getServices({ featured: true, limit: 9 }),
    getWebsites(),
    getStaffSession(),
    getCustomerSession(),
  ]);

  const [topBanners, headingBanners] = await Promise.all([getBannersForPage("home", "below-header"), getBannersForPage("home", "above-heading")]);
  const [cardRows, buttonRows] = await Promise.all([
    db.select().from(customCards).where(eq(customCards.surface, "home")).orderBy(customCards.sortOrder).catch(() => []),
    db.select().from(customButtons).where(eq(customButtons.surface, "home")).orderBy(customButtons.sortOrder).catch(() => []),
  ]);
  const liveCards = cardRows.filter((card) => card.visible);
  const liveButtons = buttonRows.filter((button) => button.visible);
  const bannerItems: BannerItem[] = [...topBanners, ...headingBanners].map((b) => ({
    id: b.id, title: b.title, subtitle: b.subtitle, description: b.description, imageUrl: b.imageUrl,
    buttonLabel: b.buttonLabel, buttonLink: b.buttonLink, secondaryLabel: b.secondaryLabel, secondaryLink: b.secondaryLink,
    bgColor: b.bgColor, textColor: b.textColor, overlayOpacity: b.overlayOpacity, radius: b.radius, displayType: b.displayType, altText: b.altText,
  }));
  const totalServices = categories.reduce((sum, c) => sum + c.serviceCount, 0);
  const popular = featured.length ? featured : (await getServices({ limit: 9 }));
  const mpSites = sites.filter((s) => s.section === "mp").slice(0, 6);
  const centralSites = sites.filter((s) => s.section === "central").slice(0, 6);

  return (
    <div className="space-y-5">
      <section className="card relative overflow-hidden border-0 bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-5 text-white shadow-lg sm:p-7">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
              🏛️ CSC Digital Seva Kendra · अमानगंज, पन्ना
            </p>
            <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
              {settings.businessName}
            </h1>
            <p className="mt-1 text-base font-semibold text-white/90">“{settings.tagline}”</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
              {totalServices}+ सेवाएँ एक ही छत के नीचे — आधार/पैन/प्रमाण पत्र, म.प्र. व केंद्र सरकारी योजनाएँ, बैंकिंग,
              BBPS बिल, रेल/फ्लाइट टिकट, कंप्यूटर-लैपटॉप रिपेयर, प्रिंटिंग व बिलिंग। आवेदन ऑनलाइन जमा करें, स्थिति
              ट्रैक करें और तैयार दस्तावेज़ डाउनलोड करें।
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/services" className="btn bg-white px-3.5 py-2 text-indigo-700 hover:bg-white/90">
                🔎 सभी सेवाएँ देखें
              </Link>
              <a href={`tel:${settings.phonePrimary}`} className="btn bg-emerald-500 px-3.5 py-2 text-white hover:bg-emerald-600">
                📞 अभी कॉल करें
              </a>
              <a
                href={`https://wa.me/91${settings.phonePrimary}?text=${encodeURIComponent("नमस्ते, मुझे सेवा की जानकारी चाहिए।")}`}
                target="_blank"
                rel="noreferrer"
                className="btn bg-white/15 px-3.5 py-2 text-white hover:bg-white/25"
              >
                💬 WhatsApp
              </a>
              <Link href="/track" className="btn bg-white/15 px-3.5 py-2 text-white hover:bg-white/25">
                📍 आवेदन ट्रैक
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-white/85">
              <span className="rounded-full bg-white/10 px-2 py-0.5">✅ {settings.heroNote}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5">📲 PWA मोबाइल ऐप सपोर्ट</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5">🔒 सुरक्षित डेटा</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/20 text-lg font-black">
                {settings.profileUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.profileUrl} alt={settings.ownerName} className="h-full w-full object-cover" />
                ) : (
                  "DP"
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">Proprietor</p>
                <p className="truncate text-base font-extrabold">{settings.ownerName}</p>
                <p className="text-[11px] text-white/80">Computer Hardware, Software & Digital Seva</p>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-[12px] text-white/90">
              <p>📍 {settings.address}</p>
              <p>📞 {settings.phonePrimary} · {settings.phoneSecondary}</p>
              <p>✉️ {settings.email}</p>
              <p>💳 UPI: {settings.upiId}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <Link href="/pay" className="rounded-xl bg-white/15 px-2 py-2 text-xs font-bold hover:bg-white/25">
                💳 UPI भुगतान
              </Link>
              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-white/15 px-2 py-2 text-xs font-bold hover:bg-white/25"
              >
                🗺️ दिशा-निर्देश
              </a>
            </div>
            {staff ? (
              <Link href="/admin" className="mt-2 block rounded-xl bg-emerald-500 px-2 py-2 text-center text-xs font-bold">
                📋 एडमिन डैशबोर्ड ({staff.role})
              </Link>
            ) : customer ? (
              <Link href="/customer" className="mt-2 block rounded-xl bg-emerald-500 px-2 py-2 text-center text-xs font-bold">
                📁 मेरे आवेदन ({customer.name})
              </Link>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link href="/login" className="rounded-xl bg-white px-2 py-2 text-center text-xs font-bold text-indigo-700">
                  🔐 स्टाफ लॉगिन
                </Link>
                <Link href="/customer/login" className="rounded-xl bg-white/15 px-2 py-2 text-center text-xs font-bold">
                  👤 कस्टमर लॉगिन
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <BannerStrip items={bannerItems} position="home" />

      {liveButtons.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {liveButtons.map((button) =>
            button.action === "call" ? (
              <a key={button.id} href={`tel:${(button.href ?? "").replace(/\D/g, "")}`} className="px-3 py-1.5 text-xs font-bold" style={{ background: button.bgColor ?? "#4f46e5", color: button.textColor ?? "#fff", borderRadius: button.style === "pill" ? 999 : button.style === "square" ? 4 : 12 }}>{button.icon} {button.label}</a>
            ) : button.action === "whatsapp" ? (
              <a key={button.id} href={`https://wa.me/91${(button.href ?? "").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="px-3 py-1.5 text-xs font-bold" style={{ background: button.bgColor ?? "#059669", color: button.textColor ?? "#fff", borderRadius: 12 }}>{button.icon} {button.label}</a>
            ) : (
              <Link key={button.id} href={button.href ?? "/services"} className="px-3 py-1.5 text-xs font-bold" style={{ background: button.bgColor ?? "#4f46e5", color: button.textColor ?? "#fff", borderRadius: button.style === "pill" ? 999 : button.style === "square" ? 4 : 12 }}>{button.icon} {button.label}</Link>
            ),
          )}
        </div>
      ) : null}

      {liveCards.length > 0 ? (
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {liveCards.map((card) => (
            <Link key={card.id} href={card.href ?? "/services"} className="flex items-start gap-2.5 p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ background: card.bgColor ?? "#eef2ff", color: card.textColor ?? "#1e293b", borderRadius: card.radius }}>
              <span className="text-xl">{card.icon}</span>
              <span className="min-w-0">
                <span className="block text-xs font-extrabold">{card.title}</span>
                <span className="block text-[10px] opacity-80">{card.subtitle}</span>
              </span>
            </Link>
          ))}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon="🧾" label="कुल सेवाएँ" value={`${totalServices}+`} hint="प्री-लोडेड शुल्क सूची" tone="indigo" />
        <Stat icon="🗂️" label="श्रेणियाँ" value={categories.length} hint="म.प्र., केंद्र, शिक्षा, जॉब्स" tone="emerald" />
        <Stat icon="🌐" label="सरकारी वेबसाइट" value={sites.length} hint="ON/OFF नियंत्रण के साथ" tone="amber" />
        <Stat icon="📍" label="सेवा क्षेत्र" value="अमानगंज" hint="पन्ना, म.प्र. 488441" tone="sky" />
      </section>

      {activeOffers.length > 0 ? (
        <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {activeOffers.slice(0, 4).map((offer) => (
            <Link
              key={offer.id}
              href="/offers"
              className="card flex items-start gap-2.5 border-orange-200 bg-gradient-to-br from-orange-50 to-rose-50 p-3 transition hover:-translate-y-0.5 hover:shadow-md dark:border-orange-400/20 dark:from-orange-500/10 dark:to-rose-500/10"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-500 text-white">🏷️</span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">{offer.discount || "ऑफर"}</span>
                <span className="line-clamp-2 text-xs font-extrabold text-slate-800 dark:text-slate-100">{offer.title}</span>
                <span className="mt-0.5 block text-[10px] text-slate-500 dark:text-slate-400">तक {formatDate(offer.endDate)}</span>
              </span>
            </Link>
          ))}
        </section>
      ) : null}

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/business" className="card flex items-center gap-2.5 p-3 hover:border-indigo-300">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">🏪</span>
          <span>
            <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-100">DP बिज़नेस प्रोफाइल</span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400">Google पर दुकान · रिव्यू ⭐ {avgRating}</span>
          </span>
        </Link>
        <Link href="/offers" className="card flex items-center gap-2.5 p-3 hover:border-indigo-300">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-500 text-white">🏷️</span>
          <span>
            <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-100">ऑफर एवं छूट</span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400">{activeOffers.length} सक्रिय ऑफर</span>
          </span>
        </Link>
        <Link href="/accounting" className="card flex items-center gap-2.5 p-3 hover:border-indigo-300">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white">🧮</span>
          <span>
            <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-100">बिलिंग एवं अकाउंटिंग</span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400">बिलिंग सेटअप · स्टॉक · डेटा एंट्री</span>
          </span>
        </Link>
        <Link href="/offers" className="card flex items-center gap-2.5 p-3 hover:border-indigo-300">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500 text-white">⭐</span>
          <span>
            <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-100">ग्राहक रेटिंग</span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400">5-स्टार रेटिंग दें व रिव्यू पढ़ें</span>
          </span>
        </Link>
      </section>

      <div>
        <PageHeader
          eyebrow="Quick actions"
          title="त्वरित सेवाएँ"
          subtitle="सबसे ज़्यादा मांगी जाने वाली सेवाएँ — एक क्लिक में आवेदन शुरू करें।"
          actions={
            <Link href="/services" className="btn-ghost px-3 py-1.5 text-xs">
              सभी सेवाएँ →
            </Link>
          }
        />
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <QuickLink href="/service/aadhaar-update-assistance" icon="🆔" title="आधार अपडेट" hint="₹100 · 24 घंटे" />
          <QuickLink href="/service/pan-card-new-correction-e-pan" icon="💳" title="पैन कार्ड नया/सुधार" hint="₹150 · 7–15 दिन" />
          <QuickLink href="/service/income-certificate" icon="📄" title="आय प्रमाण पत्र" hint="₹80 · 7–21 दिन" />
          <QuickLink href="/service/ladli-behna-yojana-assistance" icon="🏵️" title="लाड़ली बहना" hint="₹50 · उसी दिन" />
          <QuickLink href="/service/laptop-repair" icon="💻" title="लैपटॉप रिपेयर" hint="₹600 से · 2–5 दिन" />
          <QuickLink href="/service/bw-print-photocopy-2page" icon="🖨️" title="प्रिंट / फोटोकॉपी" hint="₹2 प्रति पेज" />
          <QuickLink href="/service/train-ticket-booking-assistance" icon="🚆" title="रेल टिकट बुकिंग" hint="₹40 + किराया" />
          <QuickLink href="/service/aeps-cash-withdrawal" icon="🏦" title="AEPS नकद निकासी" hint="₹10 प्रति ट्रांजैक्शन" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">सभी श्रेणियाँ</h2>
            <Badge tone="indigo">{categories.length} श्रेणियाँ</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group flex items-start gap-2.5 rounded-xl border border-slate-200 p-2.5 transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-white/10 dark:hover:border-indigo-400/40 dark:hover:bg-white/5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg dark:bg-white/10">
                  {category.icon}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-800 group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-300">
                    {category.nameHi}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    {category.nameEn} · {category.serviceCount} सेवाएँ
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🎯 लोकप्रिय सेवाएँ</h2>
            <div className="mt-2 space-y-1.5">
              {popular.map((service) => (
                <Link
                  key={service.id}
                  href={`/service/${service.slug}`}
                  className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <span className="min-w-0 truncate text-slate-700 dark:text-slate-200">{service.nameHi}</span>
                  <span className="shrink-0 rounded-lg bg-indigo-50 px-1.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                    {formatINR(service.shopFee)}
                  </span>
                </Link>
              ))}
              {popular.length === 0 ? <EmptyState title="सेवाएँ लोड हो रही हैं" /> : null}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🌐 सरकारी पोर्टल शॉर्टकट</h2>
            <div className="mt-2 grid gap-1.5">
              {[...mpSites.slice(0, 4), ...centralSites.slice(0, 4)].map((site) => (
                <a
                  key={site.id}
                  href={site.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:text-slate-200"
                >
                  <span className="truncate">{site.name}</span>
                  <span className="text-slate-400">↗</span>
                </a>
              ))}
            </div>
            <Link href="/directory" className="btn-soft mt-2 w-full px-2 py-1.5 text-xs">
              सभी {sites.length} वेबसाइट देखें
            </Link>
          </Card>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["📝", "ऑनलाइन आवेदन", "फॉर्म भरें, दस्तावेज़ अपलोड करें — कैमरा से फोटो भी।"],
            ["💳", "UPI / QR भुगतान", "dheerendr9522@upi पर सीधा भुगतान, UTR दर्ज करें।"],
            ["📦", "तैयार दस्तावेज़", "काम पूरा होने पर सर्टिफिकेट डाउनलोड व रसीद प्रिंट।"],
            ["🤝", "दुकान सहायता", "हर सेवा पर WhatsApp व कॉल बटन — सीधे बात करें।"],
          ].map(([icon, title, text]) => (
            <div key={title} className="rounded-2xl border border-slate-200 p-3 dark:border-white/10">
              <p className="text-xl">{icon}</p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
