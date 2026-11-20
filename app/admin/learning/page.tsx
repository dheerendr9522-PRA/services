import Link from "next/link";
import { db } from "@/db";
import { learnings } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { resourceConfigs } from "@/lib/resources";
import { formatDate } from "@/lib/utils";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import DataManager, { type Row } from "@/components/DataManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "सेवा सीखें — ट्रेनिंग प्रबंधन" };

export default async function AdminLearningPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const rows = await db.select().from(learnings);

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="एडमिन · सेवा सीखें"
        title="🎓 सेवा ट्रेनिंग प्रबंधन"
        subtitle="हर सेवा के लिए स्टेप-बाय-स्टेप गाइड, दस्तावेज़, वीडियो व PDF नोट्स जोड़ें। पब्लिक पेज /learning पर अपने-आप दिखेगा।"
        actions={<Link href="/learning" className="btn-primary px-3 py-1.5 text-xs">🌐 पब्लिक लर्निंग पेज</Link>}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat icon="🎓" label="कुल ट्रेनिंग" value={rows.length} tone="indigo" />
        <Stat icon="✅" label="प्रकाशित" value={rows.filter((r) => r.active).length} tone="emerald" />
        <Stat icon="▶️" label="वीडियो सहित" value={rows.filter((r) => r.videoUrl).length} tone="amber" />
      </div>
      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">ट्रेनिंग सामग्री</h2>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((item) => (
            <Link key={item.id} href={`/learning/${item.id}`} className="rounded-xl border border-slate-200 px-2.5 py-2 text-[11px] hover:border-indigo-300 dark:border-white/10">
              <p className="truncate font-bold text-slate-800 dark:text-slate-100">{item.serviceName}</p>
              <p className="text-slate-500 dark:text-slate-400">{item.steps.length} स्टेप · {formatDate(item.createdAt)}</p>
              <p className="text-indigo-600 dark:text-indigo-300">खोलें →</p>
            </Link>
          ))}
          {rows.length === 0 ? <p className="text-xs text-slate-400">कोई ट्रेनिंग नहीं।</p> : null}
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">
          स्टेप जोड़ने/बदलने के लिए नीचे Edit में जाएँ। (steps JSON को सर्वर सीड से प्रबंधित किया जाता है; टेक्स्ट फ़ील्ड यहाँ से बदलें।)
        </p>
      </Card>
      <DataManager
        resource="learnings"
        label="ट्रेनिंग"
        rows={JSON.parse(JSON.stringify(rows.map(({ steps, ...rest }) => ({ ...rest, stepCount: steps.length })))) as Row[]}
        columns={[...resourceConfigs.learnings.columns, { key: "stepCount", label: "स्टेप" }]}
        fields={resourceConfigs.learnings.fields}
        canCreate={canManage(session.role)}
        canDelete={canDelete(session.role)}
        searchPlaceholder="सेवा ट्रेनिंग खोजें…"
      />
    </div>
  );
}
