import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { customPages } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rows = await db.select().from(customPages).where(and(eq(customPages.slug, slug), eq(customPages.published, true))).limit(1);
  const page = rows[0];
  if (!page) notFound();
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="card overflow-hidden p-0">
        <div className="bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">{settings.businessName}</p>
          <h1 className="mt-1 text-2xl font-black">{page.title}</h1>
          {page.subtitle ? <p className="mt-1 text-sm text-white/85">{page.subtitle}</p> : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <a href={`tel:${settings.phonePrimary}`} className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-indigo-700">📞 {settings.phonePrimary}</a>
            <a href={`https://wa.me/91${settings.phonePrimary}`} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-white">💬 WhatsApp</a>
            <Link href="/services" className="rounded-lg bg-white/15 px-2.5 py-1.5 text-[11px] font-bold">सभी सेवाएँ</Link>
          </div>
        </div>
      </div>
      {page.sections.map((section, index) => (
        <Card key={index} className="p-4">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{section.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{section.text}</p>
          {section.buttonLabel && section.buttonHref ? (
            <Link href={section.buttonHref} className="btn-primary mt-2 px-3 py-1.5 text-xs">{section.buttonLabel}</Link>
          ) : null}
        </Card>
      ))}
      {page.sections.length === 0 ? <Card className="p-4 text-sm text-slate-500">इस पेज में अभी सेक्शन नहीं जोड़े गए।</Card> : null}
      <Card className="p-3 text-[10px] text-slate-400">
        यह पेज एडमिन द्वारा Design Studio → पेज व मेन्यू से बनाया गया है — <span className="font-mono">/p/{page.slug}</span>
      </Card>
    </div>
  );
}
