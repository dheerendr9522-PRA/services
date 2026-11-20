import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { learnings } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { Card, PageHeader } from "@/components/ui";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function LearningDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(learnings).where(eq(learnings.id, Number(id))).limit(1);
  const item = rows[0];
  if (!item) notFound();
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <Link href="/learning" className="text-xs font-bold text-indigo-600 dark:text-indigo-300">← सभी ट्रेनिंग</Link>
      <PageHeader
        eyebrow="Step-by-step guide"
        title={item.serviceName}
        subtitle={item.intro ?? undefined}
        actions={<PrintButton label="🖨 गाइड प्रिंट करें" />}
      />
      <Card className="space-y-1.5 p-3 text-xs text-slate-600 dark:text-slate-300">
        <p><b className="text-slate-800 dark:text-slate-100">पात्रता:</b> {item.eligibility || "—"}</p>
        <p><b className="text-slate-800 dark:text-slate-100">आवश्यक दस्तावेज़:</b> {item.documents || "—"}</p>
        {item.officialUrl ? <p><b className="text-slate-800 dark:text-slate-100">आधिकारिक वेबसाइट:</b> <a href={item.officialUrl} target="_blank" rel="noreferrer" className="font-bold text-indigo-600 underline dark:text-indigo-300">{item.officialUrl}</a></p> : null}
      </Card>
      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">प्रक्रिया (स्टेप बाय स्टेप)</h2>
        <ol className="mt-2 space-y-1.5">
          {item.steps.map((step, index) => (
            <li key={index} className="flex gap-2 rounded-xl border border-slate-200 px-2.5 py-2 dark:border-white/10">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-indigo-600 text-[11px] font-bold text-white">{index + 1}</span>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{step.title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
      {item.mistakes ? (
        <Card className="border-amber-300 p-3 text-[11px] text-amber-800 dark:border-amber-400/30 dark:text-amber-200">
          <b>सामान्य गलतियाँ व समाधान:</b> {item.mistakes}
        </Card>
      ) : null}
      <Card className="flex flex-wrap gap-1.5 p-3">
        {item.videoUrl ? <a href={item.videoUrl} target="_blank" rel="noreferrer" className="btn-ghost px-2.5 py-1.5 text-[11px]">▶️ वीडियो देखें</a> : null}
        {item.notesUrl ? <a href={item.notesUrl} target="_blank" rel="noreferrer" className="btn-ghost px-2.5 py-1.5 text-[11px]">📄 PDF नोट्स</a> : null}
        {item.serviceSlug ? <Link href={`/service/${item.serviceSlug}`} className="btn-primary px-2.5 py-1.5 text-[11px]">📝 आवेदन करें</Link> : null}
        <a href={`tel:${settings.phonePrimary}`} className="btn-soft px-2.5 py-1.5 text-[11px]">📞 दुकान से पूछें</a>
      </Card>
    </div>
  );
}
