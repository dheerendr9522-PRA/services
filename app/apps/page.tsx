import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { integrations, websites } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { getSettings } from "@/lib/settings";
import { Badge, Card, PageHeader } from "@/components/ui";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "मेरे ऐप व वेबसाइट" };

const TYPE_LABEL: Record<string, string> = {
  app: "📱 ऐप",
  website: "🌐 वेबसाइट",
  sheet: "📊 Google Sheet",
  api: "🔌 API",
};

export default async function AppsPage() {
  await ensureSeeded().catch(() => undefined);
  const [rows, siteRows, settings] = await Promise.all([
    db.select().from(integrations).orderBy(desc(integrations.createdAt)).catch(() => []),
    db.select().from(websites).where(eq(websites.active, true)).limit(24).catch(() => []),
    getSettings(),
  ]);
  const active = rows.filter((row) => row.status === "Active");

  return (
    <div className="space-y-4">
      <BackButton />
      <PageHeader
        eyebrow="My Apps & Websites"
        title="📱 मेरे ऐप व वेबसाइट"
        subtitle="एक ही जगह से अपनी सभी वेबसाइट, ऐप, Google Sheet व API खोलें — हर लिंक ऐप के अंदर सुरक्षित फ्रेम में खुलता है, बाहर जाने की जरूरत नहीं।"
        actions={<Link href="/admin/integrations" className="btn-ghost px-3 py-1.5 text-xs">➕ नया जोड़ें (एडमिन)</Link>}
      />

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {active.map((row) => (
          <Card key={row.id} className="flex flex-col gap-1.5 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{row.name}</p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{row.description || row.relatedService || "—"}</p>
              </div>
              <span className="chip shrink-0 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{TYPE_LABEL[row.type] ?? row.type}</span>
            </div>
            <p className="truncate font-mono text-[10px] text-slate-400">{row.url}</p>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {row.url ? (
                <a href={`/apps/view?url=${encodeURIComponent(row.url)}&name=${encodeURIComponent(row.name)}`} className="btn-primary px-2.5 py-1.5 text-[11px]">🖥️ ऐप में खोलें</a>
              ) : null}
              {row.url && /^https?:\/\//.test(row.url) ? (
                <a href={row.url} target="_blank" rel="noreferrer" className="btn-ghost px-2.5 py-1.5 text-[11px]">↗ नए टैब में</a>
              ) : null}
            </div>
          </Card>
        ))}
        {active.length === 0 ? <Card className="p-4 text-xs text-slate-500">अभी कोई ऐप/वेबसाइट नहीं जोड़ी — एडमिन → “वेबसाइट / ऐप जोड़ें” से जोड़ें।</Card> : null}
      </div>

      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🌐 सरकारी व सहायक वेबसाइट (फ्रेम में खोलें)</h2>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {siteRows.map((site) => (
            <a
              key={site.id}
              href={`/apps/view?url=${encodeURIComponent(site.url)}&name=${encodeURIComponent(site.name)}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-2 py-1.5 text-[11px] font-semibold hover:border-indigo-300 dark:border-white/10"
            >
              <span className="truncate text-slate-700 dark:text-slate-200">{site.name}</span>
              <span className="shrink-0 text-indigo-600 dark:text-indigo-300">🖥️</span>
            </a>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Link href="/directory" className="btn-ghost px-2.5 py-1.5 text-[11px]">सभी वेबसाइट डायरेक्टरी</Link>
          <Badge tone="amber">कुछ सरकारी साइटें फ्रेम में खुलने से रोक सकती हैं (X-Frame-Options) — तब “नए टैब” बटन उपयोग करें।</Badge>
        </div>
      </Card>

      <Card className="p-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
        <p className="font-bold text-slate-800 dark:text-slate-100">दुकान संपर्क</p>
        <p>{settings.businessName} · 📞 {settings.phonePrimary} / {settings.phoneSecondary} · ✉️ {settings.email}</p>
      </Card>
    </div>
  );
}
