import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { businessProfiles, feedback, offers, profileEvents } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui";
import InquiryForm from "@/components/InquiryForm";

export const dynamic = "force-dynamic";

export default async function BusinessProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rows = await db.select().from(businessProfiles).where(and(eq(businessProfiles.slug, slug), eq(businessProfiles.published, true))).limit(1);
  const profile = rows[0];
  if (!profile) notFound();
  await db.update(businessProfiles).set({ views: sql`${businessProfiles.views} + 1` }).where(eq(businessProfiles.id, profile.id)).catch(() => undefined);
  await db.insert(profileEvents).values({ kind: "view", label: profile.slug, source: "profile" }).catch(() => undefined);
  const [offerRows, reviewRows] = await Promise.all([
    db.select().from(offers).where(eq(offers.active, true)).orderBy(desc(offers.createdAt)).limit(4).catch(() => []),
    db.select().from(feedback).where(eq(feedback.active, true)).orderBy(desc(feedback.createdAt)).limit(6).catch(() => []),
  ]);
  const avg = reviewRows.length ? (reviewRows.reduce((s, r) => s + r.rating, 0) / reviewRows.length).toFixed(1) : "—";

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
        <div className="relative h-28" style={{ background: `linear-gradient(135deg, ${profile.primaryColor}, ${profile.accentColor})` }}>
          {profile.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.coverUrl} alt={profile.name} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-start gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl text-lg font-black text-white" style={{ backgroundColor: profile.primaryColor }}>
              {profile.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logoUrl} alt={profile.name} className="h-full w-full object-cover" />
              ) : (
                profile.name.slice(0, 1)
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">{profile.category} · Business ID: {profile.slug}</p>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">{profile.name}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{profile.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-amber-500">⭐ {avg} / 5</p>
              <p className="text-[10px] text-slate-400">{profile.views} व्यू</p>
            </div>
          </div>
          <div className="mt-2 grid gap-1.5 text-[11px] text-slate-600 sm:grid-cols-2 dark:text-slate-300">
            <p>👤 {profile.ownerName || "—"}</p>
            <p>🕘 {profile.workingHours || "—"}</p>
            <p>📞 {profile.phone} · 💬 {profile.whatsapp}</p>
            <p>✉️ {profile.email}</p>
            <p className="sm:col-span-2">📍 {profile.address}</p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <a href={`tel:${profile.phone}`} className="btn-primary px-2.5 py-1.5 text-[11px]">📞 कॉल</a>
            <a href={`https://wa.me/${profile.whatsapp}`} target="_blank" rel="noreferrer" className="btn bg-emerald-500 px-2.5 py-1.5 text-[11px] text-white">💬 WhatsApp</a>
            {profile.mapsUrl ? <a href={profile.mapsUrl} target="_blank" rel="noreferrer" className="btn-ghost px-2.5 py-1.5 text-[11px]">🗺️ दिशा</a> : null}
            <Link href="/offers" className="btn-ghost px-2.5 py-1.5 text-[11px]">🏷️ ऑफर</Link>
            <Link href="/services" className="btn-ghost px-2.5 py-1.5 text-[11px]">🧾 सेवाएँ</Link>
            {profile.socialLinks ? <a href={profile.socialLinks} target="_blank" rel="noreferrer" className="btn-ghost px-2.5 py-1.5 text-[11px]">🌐 वेबसाइट</a> : null}
            <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">टेम्पलेट: {profile.template} · {profile.layout}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🛠️ सेवाएँ व उत्पाद</h2>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(profile.servicesText ?? "").split(",").filter(Boolean).map((service) => (
              <span key={service} className="chip bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">{service.trim()}</span>
            ))}
          </div>
          {(profile.productsText ?? "").trim() ? (
            <>
              <h2 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">📦 उत्पाद</h2>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(profile.productsText ?? "").split(",").filter(Boolean).map((product) => (
                  <span key={product} className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{product.trim()}</span>
                ))}
              </div>
            </>
          ) : null}
          <h2 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">🏷️ सक्रिय ऑफर</h2>
          <div className="mt-1 space-y-1">
            {offerRows.map((offer) => (
              <div key={offer.id} className="rounded-lg border border-orange-200 px-2 py-1 text-[11px] dark:border-orange-400/20">
                <p className="font-bold text-slate-800 dark:text-slate-100">{offer.title}</p>
                <p className="text-slate-500 dark:text-slate-400">{offer.discount} · तक {formatDate(offer.endDate)}</p>
              </div>
            ))}
            {offerRows.length === 0 ? <p className="text-xs text-slate-400">कोई ऑफर नहीं।</p> : null}
          </div>
        </Card>
        <Card className="p-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">📩 पूछताछ करें / Inquiry</h2>
          <InquiryForm profileSlug={profile.slug} />
          <h2 className="mt-3 text-sm font-extrabold text-slate-900 dark:text-white">⭐ ग्राहक रिव्यू</h2>
          <div className="mt-1 space-y-1">
            {reviewRows.map((review) => (
              <div key={review.id} className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] dark:border-white/10">
                <p className="font-bold text-slate-800 dark:text-slate-100">{review.name} <span className="text-amber-400">{"★".repeat(review.rating)}</span></p>
                <p className="text-slate-500 dark:text-slate-400">{review.comment}</p>
              </div>
            ))}
            {reviewRows.length === 0 ? <p className="text-xs text-slate-400">अभी कोई रिव्यू नहीं।</p> : null}
          </div>
        </Card>
      </div>
      <Card className="p-3 text-[10px] text-slate-400">
        यह सार्वजनिक बिज़नेस प्रोफाइल पेज है — <span className="font-mono">/business/{profile.slug}</span> · शेयर करने योग्य लिंक। सरकारी सेवाओं की पुष्टि संबंधित आधिकारिक पोर्टल से ही करें।
      </Card>
    </div>
  );
}
