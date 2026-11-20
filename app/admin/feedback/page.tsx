import { db } from "@/db";
import { feedback } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { resourceConfigs } from "@/lib/resources";
import { Stat, PageHeader, Card } from "@/components/ui";
import BackButton from "@/components/BackButton";
import DataManager, { type Row } from "@/components/DataManager";
import AdminFilterBar from "@/components/AdminFilterBar";

export const dynamic = "force-dynamic";
export const metadata = { title: "फीडबैक व रेटिंग" };

export default async function AdminFeedbackPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const rows = await db.select().from(feedback);
  const avg = rows.length ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1) : "—";
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: rows.filter((r) => r.rating === star).length }));
  const max = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="एडमिन · फीडबैक"
        title="⭐ ग्राहक रेटिंग व फीडबैक"
        subtitle="5-स्टार रेटिंग, ग्राहक की राय और दुकान का जवाब — सब यहाँ प्रबंधित करें। प्रकाशित रेटिंग /offers व DP बिज़नेस प्रोफाइल पर दिखती है।"
        actions={<a href="/offers" className="btn-ghost px-3 py-1.5 text-xs">🌐 पब्लिक पेज</a>}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="⭐" label="औसत रेटिंग" value={`${avg} / 5`} tone="amber" />
        <Stat icon="💬" label="कुल फीडबैक" value={rows.length} tone="indigo" />
        <Stat icon="✅" label="प्रकाशित" value={rows.filter((r) => r.active).length} tone="emerald" />
        <Stat icon="↩️" label="जवाब दिए" value={rows.filter((r) => r.reply).length} tone="sky" />
      </div>
      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">रेटिंग वितरण</h2>
        <div className="mt-1.5 space-y-1">
          {distribution.map((d) => (
            <div key={d.star} className="flex items-center gap-2">
              <span className="w-12 text-[11px] font-bold text-amber-500">{d.star} ★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(d.count / max) * 100}%` }} />
              </span>
              <span className="w-6 text-right text-[10px] font-bold text-slate-500">{d.count}</span>
            </div>
          ))}
        </div>
      </Card>
      <AdminFilterBar label="फीडबैक खोज" searchPlaceholder="ग्राहक / राय खोजें…" showSearch />
      <DataManager resource="feedback" label="फीडबैक" rows={JSON.parse(JSON.stringify(rows)) as Row[]} columns={resourceConfigs.feedback.columns} fields={resourceConfigs.feedback.fields} canCreate={canManage(session.role)} canDelete={canDelete(session.role)} searchPlaceholder="फीडबैक खोजें…" />
    </div>
  );
}
