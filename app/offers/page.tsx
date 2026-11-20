import Link from "next/link";
import { desc, gte } from "drizzle-orm";
import { db } from "@/db";
import { feedback, offers } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";
import { Card, PageHeader } from "@/components/ui";
import BackButton from "@/components/BackButton";
import FeedbackForm from "@/components/FeedbackForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "ऑफर, छूट व ग्राहक रेटिंग" };

export default async function OffersPage() {
  await ensureSeeded().catch(() => undefined);
  const [offerRows, reviews, settings] = await Promise.all([
    db.select().from(offers).orderBy(desc(offers.createdAt)),
    db.select().from(feedback).orderBy(desc(feedback.createdAt)).limit(12),
    getSettings(),
  ]);
  const now = new Date();
  const active = offerRows.filter((o) => o.active && o.endDate >= now && o.startDate <= now);
  const upcoming = offerRows.filter((o) => o.active && o.startDate > now);
  const published = reviews.filter((r) => r.active);
  const average = published.length ? (published.reduce((sum, r) => sum + r.rating, 0) / published.length).toFixed(1) : "—";

  return (
    <div className="space-y-4">
      <BackButton />
      <PageHeader
        eyebrow="Offers & reviews"
        title="🏷️ ऑफर, छूट व ग्राहक रेटिंग"
        subtitle="आज के विशेष ऑफर, समाप्ति तिथि, ग्राहक समीक्षा व 5-स्टार रेटिंग — सब एक जगह।"
        actions={
          <Link href="/business" className="btn-ghost px-3 py-1.5 text-xs">
            🏪 DP बिज़नेस प्रोफाइल
          </Link>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-2.5">
          {active.length === 0 ? (
            <Card className="p-4 text-center text-sm text-slate-500">अभी कोई सक्रिय ऑफर नहीं है — जल्द नए ऑफर आएँगे।</Card>
          ) : (
            active.map((offer) => (
              <Card key={offer.id} className="overflow-hidden p-0">
                <div className="flex flex-wrap items-start justify-between gap-2 bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-600 px-3 py-2.5 text-white">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">विशेष ऑफर · {offer.discount || "छूट"}</p>
                    <h2 className="text-base font-extrabold">{offer.title}</h2>
                  </div>
                  <span className="rounded-lg bg-white/20 px-2 py-1 text-[10px] font-bold">
                    {formatDate(offer.startDate)} – {formatDate(offer.endDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{offer.detail}</p>
                  {offer.linkUrl ? (
                    <Link href={offer.linkUrl} className="btn-primary shrink-0 px-2.5 py-1.5 text-[11px]">अभी देखें</Link>
                  ) : null}
                </div>
              </Card>
            ))
          )}
          {upcoming.length > 0 ? (
            <Card className="p-3">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">आने वाले ऑफर</h2>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] text-slate-600 dark:text-slate-300">
                {upcoming.map((offer) => (
                  <li key={offer.id}>
                    {offer.title} — शुरू {formatDate(offer.startDate)}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <div className="space-y-3">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">⭐ ग्राहक रेटिंग</h2>
              <span className="rounded-xl bg-amber-50 px-2 py-1 text-sm font-black text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">{average} / 5</span>
            </div>
            <div className="mt-1.5 space-y-0.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = published.filter((r) => r.rating === star).length;
                const percent = published.length ? Math.round((count / published.length) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-8 font-bold text-amber-500">{star} ★</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <span className="block h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
                    </span>
                    <span className="w-14 text-right text-slate-400">{count} · {percent}%</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-1 text-[10px] text-slate-400">कुल समीक्षाएँ: {published.length}</p>
            <div className="mt-1.5 max-h-56 space-y-1.5 overflow-y-auto">
              {published.map((review) => (
                <div key={review.id} className="rounded-xl border border-slate-200 p-2 dark:border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{review.name}</p>
                    <span className="text-[11px] text-amber-400">{"★".repeat(review.rating)}<span className="text-slate-300 dark:text-slate-600">{"★".repeat(5 - review.rating)}</span></span>
                  </div>
                  {review.comment ? <p className="text-[11px] text-slate-500 dark:text-slate-400">{review.comment}</p> : null}
                  {review.reply ? (
                    <p className="mt-1 rounded-lg bg-slate-50 px-1.5 py-1 text-[10px] text-slate-600 dark:bg-white/5 dark:text-slate-300">दुकान: {review.reply}</p>
                  ) : null}
                </div>
              ))}
              {published.length === 0 ? <p className="text-xs text-slate-400">अभी कोई समीक्षा नहीं।</p> : null}
            </div>
          </Card>

          {settings.feedbackEnabled !== "0" ? (
            <Card className="p-3">
              <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">अपनी रेटिंग दें</h2>
              <FeedbackForm services={[]} />
            </Card>
          ) : null}

          <Card className="p-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            <p className="font-bold text-slate-800 dark:text-slate-100">🔔 ऑफर नोटिफिकेशन</p>
            <p>
              नया ऑफर जोड़ते ही ऐप की 🔔 सूचना सूची में सभी स्टाफ/ग्राहक को सूचना जुड़ जाती है। मोबाइल पर सीधे
              Push Notification भेजने के लिए ऐप इंस्टॉल करें (Chrome → Add to Home screen); पूर्ण push के लिए
              Firebase/Web-Push कुंजियाँ सर्वर पर सेट करें — यह अलग इंटीग्रेशन है।
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
