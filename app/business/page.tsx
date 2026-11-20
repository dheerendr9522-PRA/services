import Link from "next/link";
import { desc, gte } from "drizzle-orm";
import { db } from "@/db";
import { businessProfiles, feedback, offers, profileEvents, services } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { getSettings } from "@/lib/settings";
import { formatDate, formatINR } from "@/lib/utils";
import { Card, PageHeader } from "@/components/ui";
import FeedbackForm from "@/components/FeedbackForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "DP Business Profile" };

export default async function BusinessProfilePage() {
  await ensureSeeded().catch(() => undefined);
  const [settings, offerRows, reviews, topServices, events] = await Promise.all([
    getSettings(),
    db.select().from(offers).orderBy(desc(offers.createdAt)),
    db.select().from(feedback).orderBy(desc(feedback.createdAt)).limit(10),
    db.select().from(services).limit(400),
    db.select().from(profileEvents).orderBy(desc(profileEvents.createdAt)).limit(200),
  ]);
  const now = new Date();
  const activeOffers = offerRows.filter((o) => o.active && o.endDate >= now);
  const published = reviews.filter((r) => r.active);
  const avg = published.length ? (published.reduce((s, r) => s + r.rating, 0) / published.length).toFixed(1) : "—";
  const views = events.filter((e) => e.kind === "view").length;
  const calls = events.filter((e) => e.kind === "call").length;
  const whatsapp = events.filter((e) => e.kind === "whatsapp").length;
  const directions = events.filter((e) => e.kind === "direction").length;
  const keywords = Object.entries(events.reduce<Record<string, number>>((acc, e) => {
    if (e.label) acc[e.label] = (acc[e.label] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const featured = topServices.filter((s) => s.active).slice(0, 8);

  const profiles = await db.select().from(businessProfiles).catch(() => []);

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🏪 सभी प्रकाशित बिज़नेस प्रोफाइल ({profiles.filter((p) => p.published).length})</h2>
          <Link href="/admin/profiles" className="btn-ghost px-2.5 py-1.5 text-[11px]">➕ नया प्रोफाइल (एडमिन)</Link>
        </div>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.filter((p) => p.published).map((profile) => (
            <Link key={profile.id} href={`/business/${profile.slug}`} className="rounded-xl border border-slate-200 px-2.5 py-2 hover:border-indigo-300 dark:border-white/10">
              <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{profile.name}</p>
              <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{profile.category} · 👁 {profile.views}</p>
              <p className="mt-0.5 text-[10px] font-mono text-indigo-600 dark:text-indigo-300">/business/{profile.slug}</p>
            </Link>
          ))}
          {profiles.length === 0 ? <p className="text-xs text-slate-400">कोई प्रोफाइल नहीं।</p> : null}
        </div>
      </Card>

      <PageHeader
        eyebrow="DP Business Profile"
        title="🏪 DP बिज़नेस प्रोफाइल"
        subtitle="Google Search व Maps पर आपकी दुकान की पूरी जानकारी, ऑफर, रिव्यू, फोटो, सेवाएँ व ऑनलाइन पहुँच की रिपोर्ट — केवल इसी ऐप में।"
        actions={
          <a href={settings.gmbLink} target="_blank" rel="noreferrer" className="btn-primary px-3 py-1.5 text-xs">
            🔗 Google Business Profile
          </a>
        }
      />

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-4 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Business Profile · {settings.ownerName}</p>
            <h1 className="mt-1 max-w-2xl text-xl font-black sm:text-2xl">{settings.businessName}</h1>
            <p className="mt-1 text-sm text-white/85">“{settings.tagline}”</p>
            <div className="mt-2 space-y-0.5 text-[12px] text-white/90">
              <p>📍 {settings.address}</p>
              <p>📞 {settings.phonePrimary} · {settings.phoneSecondary} · ✉️ {settings.email}</p>
              <p>🕘 {settings.businessHours}</p>
              <p>💳 UPI: {settings.upiId} · मोबाइल UPI: {settings.upiMobile}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <a href={`tel:${settings.phonePrimary}`} className="btn bg-white px-3 py-1.5 text-xs text-indigo-700">📞 कॉल करें</a>
            <a href={`https://wa.me/91${settings.phonePrimary}`} target="_blank" rel="noreferrer" className="btn bg-emerald-500 px-3 py-1.5 text-xs text-white">💬 WhatsApp</a>
            <a href={settings.mapsUrl} target="_blank" rel="noreferrer" className="btn bg-white/15 px-3 py-1.5 text-xs">🗺️ दिशा-निर्देश</a>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["👁", views, "प्रोफाइल व्यू"],
          ["📞", calls, "कॉल क्लिक"],
          ["💬", whatsapp, "WhatsApp क्लिक"],
          ["🗺️", directions, "दिशा क्लिक"],
        ].map(([icon, value, label]) => (
          <Card key={String(label)} className="p-3 text-center">
            <p className="text-lg">{icon}</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{value}</p>
            <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🏷️ ऑफर एवं छूट</h2>
          <div className="mt-1.5 space-y-1.5">
            {activeOffers.map((offer) => (
              <div key={offer.id} className="rounded-xl border border-orange-200 bg-orange-50/70 p-2 dark:border-orange-400/20 dark:bg-orange-500/10">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{offer.title}</p>
                  <span className="chip shrink-0 bg-white text-orange-700 dark:bg-white/10 dark:text-orange-300">{offer.discount}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">{offer.detail}</p>
                <p className="text-[10px] text-slate-400">{formatDate(offer.startDate)} – {formatDate(offer.endDate)}</p>
              </div>
            ))}
            {activeOffers.length === 0 ? <p className="text-xs text-slate-400">अभी कोई ऑफर नहीं।</p> : null}
          </div>
          <Link href="/offers" className="btn-soft mt-2 w-full px-2 py-1.5 text-[11px]">सभी ऑफर देखें</Link>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">⭐ ग्राहक रिव्यू व रेटिंग</h2>
            <span className="text-sm font-black text-amber-500">{avg} / 5</span>
          </div>
          <div className="mt-1.5 max-h-48 space-y-1 overflow-y-auto">
            {published.map((review) => (
              <div key={review.id} className="rounded-lg border border-slate-200 px-2 py-1.5 dark:border-white/10">
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-100">{review.name}</p>
                  <span className="text-[10px] text-amber-400">{"★".repeat(review.rating)}</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{review.comment}</p>
                {review.reply ? <p className="text-[10px] text-indigo-600 dark:text-indigo-300">दुकान: {review.reply}</p> : null}
              </div>
            ))}
          </div>
          <div className="mt-2"><FeedbackForm services={featured.map((s) => s.nameHi)} /></div>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🖼️ दुकान की फोटो व उत्पाद</h2>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {["दुकान", "कंप्यूटर रिपेयर", "प्रिंटिंग", "CCTV", "एक्सेसरीज़", "सर्विस डेस्क"].map((label) => (
              <div key={label} className="flex h-20 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-center text-[10px] font-bold text-slate-500 dark:from-white/10 dark:to-white/5 dark:text-slate-300">
                <span className="text-xl">🖥️</span>
                {label}
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">एडमिन सेटिंग्स से लोगो/प्रोफाइल फोटो बदलें — फोटो डेटाबेस में सुरक्षित रहती है।</p>
        </Card>

        <Card className="p-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🔍 ग्राहक किन शब्दों से खोजते हैं</h2>
          <div className="mt-1.5 space-y-1">
            {keywords.map(([label, count]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-40 truncate text-[11px] text-slate-600 dark:text-slate-300">{label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (count / (keywords[0]?.[1] ?? 1)) * 100)}%` }} />
                </span>
                <span className="w-6 text-right text-[10px] font-bold text-slate-500">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <a href={`tel:${settings.phonePrimary}`} className="btn-ghost px-2 py-1.5 text-[11px]">📞 कॉल</a>
            <a href={settings.mapsUrl} target="_blank" rel="noreferrer" className="btn-ghost px-2 py-1.5 text-[11px]">🗺️ Maps</a>
          </div>
        </Card>
      </div>

      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🛠️ हमारी प्रमुख सेवाएँ व शुल्क</h2>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((service) => (
            <Link key={service.id} href={`/service/${service.slug}`} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-2 py-1.5 text-[11px] hover:border-indigo-300 dark:border-white/10">
              <span className="truncate">{service.nameHi}</span>
              <span className="shrink-0 font-bold text-emerald-600 dark:text-emerald-300">{formatINR(service.shopFee)}</span>
            </Link>
          ))}
        </div>
        <p className="mt-2 rounded-xl bg-amber-50 px-2 py-1.5 text-[10px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          सरकारी वेबसाइटों पर सेवा की उपलब्धता, शुल्क व पात्रता संबंधित आधिकारिक पोर्टल पर जाँचें। यह प्रोफाइल केवल दुकान की जानकारी देती है।
        </p>
      </Card>
    </div>
  );
}
