import { db } from "@/db";
import { offers } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { resourceConfigs } from "@/lib/resources";
import { formatDate } from "@/lib/utils";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import DataManager, { type Row } from "@/components/DataManager";
import AdminFilterBar from "@/components/AdminFilterBar";

export const dynamic = "force-dynamic";
export const metadata = { title: "ऑफर एवं छूट" };

export default async function AdminOffersPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const rows = await db.select().from(offers);
  const now = new Date();
  const active = rows.filter((o) => o.active && o.endDate >= now && o.startDate <= now);
  const expired = rows.filter((o) => o.endDate < now);

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="एडमिन · ऑफर"
        title="🏷️ ऑफर एवं छूट पैनल"
        subtitle="ऑफर का नाम, छूट, फोटो, शुरू व समाप्ति तारीख जोड़ें। सेव होते ही ऐप के /offers पेज, DP बिज़नेस प्रोफाइल व 🔔 नोटिफिकेशन में जुड़ जाता है।"
        actions={<a href="/offers" className="btn-ghost px-3 py-1.5 text-xs">🌐 पब्लिक ऑफर पेज</a>}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat icon="🔥" label="सक्रिय ऑफर" value={active.length} tone="emerald" />
        <Stat icon="🏷️" label="कुल ऑफर" value={rows.length} tone="indigo" />
        <Stat icon="⌛" label="समाप्त" value={expired.length} tone="rose" />
      </div>
      <AdminFilterBar label="ऑफर खोज" searchPlaceholder="ऑफर खोजें…" showSearch />
      <Card className="p-2.5 text-[11px] text-slate-600 dark:text-slate-300">
        🔔 नोट: Google Sheet में सेव करने मात्र से मोबाइल पर Push नहीं जाता — ऐप में सूचना अपने-आप जुड़ती है; मोबाइल Push के लिए Web-Push/Firebase कुंजियाँ सर्वर पर सेट करें।
        ऑफर की फोटो के लिए /api/files/ID या बाहरी इमेज लिंक डालें।
      </Card>

      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🔥 सक्रिय ऑफर झलक</h2>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((offer) => (
            <div key={offer.id} className="rounded-xl border border-orange-200 bg-orange-50/60 p-2 dark:border-orange-400/20 dark:bg-orange-500/10">
              <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{offer.title}</p>
              <p className="text-[10px] text-slate-600 dark:text-slate-300">{offer.discount}</p>
              <p className="text-[10px] text-slate-400">{formatDate(offer.startDate)} – {formatDate(offer.endDate)}</p>
            </div>
          ))}
          {active.length === 0 ? <p className="text-xs text-slate-400">कोई सक्रिय ऑफर नहीं।</p> : null}
        </div>
      </Card>

      <DataManager resource="offers" label="ऑफर" rows={JSON.parse(JSON.stringify(rows)) as Row[]} columns={resourceConfigs.offers.columns} fields={resourceConfigs.offers.fields} canCreate={canManage(session.role)} canDelete={canDelete(session.role)} searchPlaceholder="ऑफर खोजें…" />
    </div>
  );
}
