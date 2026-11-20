import Link from "next/link";
import { db } from "@/db";
import { customMenus, customPages } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { resourceConfigs } from "@/lib/resources";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import DataManager, { type Row } from "@/components/DataManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "पेज व मेन्यू डिज़ाइनर" };

export default async function AdminPagesPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const [pages, menus] = await Promise.all([db.select().from(customPages), db.select().from(customMenus)]);

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="🎨 Design Studio · Pages & Menus"
        title="पेज, मेन्यू व सेक्शन डिज़ाइनर"
        subtitle="नए पेज बनाएँ (Heading, Text, Image, Card Grid, Button Group सेक्शन), नए मेन्यू जोड़ें — सेव होते ही पब्लिक साइडबार व /p/slug लिंक में दिखते हैं।"
        actions={<Link href="/admin/design" className="btn-primary px-3 py-1.5 text-xs">🎨 कार्ड/बटन डिज़ाइनर</Link>}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="📄" label="कुल पेज" value={pages.length} tone="indigo" />
        <Stat icon="✅" label="प्रकाशित" value={pages.filter((p) => p.published).length} tone="emerald" />
        <Stat icon="🧭" label="कस्टम मेन्यू" value={menus.length} tone="sky" />
        <Stat icon="👁" label="दिखने वाले" value={menus.filter((m) => m.visible).length} tone="amber" />
      </div>
      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">प्रकाशित पेज लिंक</h2>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {pages.map((page) => (
            <Link key={page.id} href={`/p/${page.slug}`} className="rounded-xl border border-slate-200 px-2 py-1.5 text-[11px] hover:border-indigo-300 dark:border-white/10">
              <p className="truncate font-bold text-slate-800 dark:text-slate-100">{page.title}</p>
              <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-300">/p/{page.slug}</p>
              <p className="text-[10px] text-slate-400">{page.sections.length} सेक्शन · {page.published ? "प्रकाशित" : "ड्राफ्ट"}</p>
            </Link>
          ))}
        </div>
      </Card>
      <DataManager resource="pages" label="कस्टम पेज" rows={JSON.parse(JSON.stringify(pages)) as Row[]} columns={resourceConfigs.pages.columns} fields={resourceConfigs.pages.fields} canCreate={canManage(session.role)} canDelete={canDelete(session.role)} searchPlaceholder="पेज खोजें…" />
      <DataManager resource="menusDesigner" label="कस्टम मेन्यू" rows={JSON.parse(JSON.stringify(menus)) as Row[]} columns={resourceConfigs.menusDesigner.columns} fields={resourceConfigs.menusDesigner.fields} canCreate={canManage(session.role)} canDelete={canDelete(session.role)} searchPlaceholder="मेन्यू खोजें…" />
      <Card className="p-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
        <p className="font-bold text-slate-800 dark:text-slate-100">सेक्शन JSON का उदाहरण</p>
        <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-900 p-2 text-[10px] text-emerald-200">{`[{"type":"section","title":"शीर्षक","text":"विवरण","buttonLabel":"देखें","buttonHref":"/services"}]`}</pre>
        <p className="mt-1">बदलाव तुरंत पब्लिक पेज पर लागू होते हैं; Duplicate/Copy बटन से पेज या मेन्यू की नकल बनाएँ।</p>
      </Card>
    </div>
  );
}
