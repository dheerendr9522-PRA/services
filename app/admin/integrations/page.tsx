import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { integrations } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { resourceConfigs } from "@/lib/resources";
import { googleConfig } from "@/lib/googleSheet";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import DataManager, { type Row } from "@/components/DataManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "मेरी वेबसाइट / ऐप जोड़ें" };

export default async function AdminIntegrationsPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const rows = await db.select().from(integrations).orderBy(desc(integrations.createdAt));
  const sheet = googleConfig();

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="App / Website Integrations"
        title="🔗 मेरी वेबसाइट / ऐप जोड़ें"
        subtitle="कई वेबसाइट/ऐप रिकॉर्ड जोड़ें — URL, संबंधित सेवा, डेटाबेस, Google Sheet व Webhook कॉन्फ़िगरेशन। केवल URL जोड़ने से डेटा कनेक्शन पूरा नहीं माना जाता।"
        actions={<Link href="/admin/sheets" className="btn-primary px-3 py-1.5 text-xs">📊 Google Sheet सेटअप</Link>}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="🔗" label="कुल रिकॉर्ड" value={rows.length} tone="indigo" />
        <Stat icon="✅" label="सक्रिय" value={rows.filter((r) => r.status === "Active").length} tone="emerald" />
        <Stat icon="📊" label="Sheet कनेक्शन" value={sheet.configured ? "जुड़ा" : "नहीं"} tone={sheet.configured ? "emerald" : "rose"} />
        <Stat icon="🪝" label="Webhook" value={sheet.webhook ? "सेट" : "नहीं"} tone={sheet.webhook ? "emerald" : "amber"} />
      </div>
      <Card className="p-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
        <p className="font-bold text-slate-800 dark:text-slate-100">⚠️ वास्तविक सेटअप आवश्यकताएँ</p>
        <p>• Google Sheets: Service Account JSON कुंजियाँ सर्वर पर (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY) या Apps Script Webhook।</p>
        <p>• Database/Analytics: वास्तविक API कुंजी व अनुमति चाहिए — बिना कुंजी के &quot;Connected&quot; नहीं दिखाया जाता।</p>
        <p>• WhatsApp स्वचालित संदेश के लिए WhatsApp Business API/क्लाउड API अनुमोदन आवश्यक; अभी केवल क्लिक-to-chat लिंक उपलब्ध है।</p>
        <p>• Push Notification के लिए Web-Push (VAPID) या Firebase कुंजियाँ आवश्यक।</p>
      </Card>
      <DataManager
        resource="integrations"
        label="वेबसाइट / ऐप"
        rows={JSON.parse(JSON.stringify(rows)) as Row[]}
        columns={resourceConfigs.integrations.columns}
        fields={resourceConfigs.integrations.fields}
        canCreate={canManage(session.role)}
        canDelete={canDelete(session.role)}
        searchPlaceholder="वेबसाइट / ऐप खोजें…"
      />
      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">खोलें / जाँचें</h2>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-slate-200 px-2 py-1.5 text-[11px] dark:border-white/10">
              <p className="truncate font-bold text-slate-800 dark:text-slate-100">{row.name} <span className="text-[10px] text-slate-400">({row.type})</span></p>
              <p className="truncate text-slate-500 dark:text-slate-400">{row.url}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {row.url ? <a href={row.url} target="_blank" rel="noreferrer" className="btn-ghost px-1.5 py-0.5 text-[10px]">↗ Open</a> : null}
                <a href="/admin/sheets" className="btn-ghost px-1.5 py-0.5 text-[10px]">🔌 Test / Sync</a>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
