import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { businessProfiles, inquiries } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { resourceConfigs } from "@/lib/resources";
import { formatDate, statusTone } from "@/lib/utils";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import DataManager, { type Row } from "@/components/DataManager";
import AdminFilterBar from "@/components/AdminFilterBar";

export const dynamic = "force-dynamic";
export const metadata = { title: "DP बिज़नेस प्रोफाइल प्रबंधन" };

export default async function AdminProfilesPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const [profiles, inquiryRows] = await Promise.all([
    db.select().from(businessProfiles).orderBy(desc(businessProfiles.createdAt)),
    db.select().from(inquiries).orderBy(desc(inquiries.createdAt)).limit(50),
  ]);

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="DP Business Profile"
        title="🏪 बिज़नेस प्रोफाइल प्रबंधन"
        subtitle="कई बिज़नेस प्रोफाइल बनाएँ — हर प्रोफाइल का अलग शेयर-लिंक ( /business/slug ), फोटो, सेवाएँ, समय व पूछताछ।"
        actions={<Link href="/business" className="btn-primary px-3 py-1.5 text-xs">🌐 पब्लिक पेज</Link>}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="🏪" label="कुल प्रोफाइल" value={profiles.length} tone="indigo" />
        <Stat icon="✅" label="प्रकाशित" value={profiles.filter((p) => p.published).length} tone="emerald" />
        <Stat icon="👁" label="कुल व्यू" value={profiles.reduce((s, p) => s + p.views, 0)} tone="sky" />
        <Stat icon="📩" label="पूछताछ" value={inquiryRows.length} tone="amber" />
      </div>
      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">शेयर लिंक</h2>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <div key={profile.id} className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] dark:border-white/10">
              <p className="truncate font-bold text-slate-800 dark:text-slate-100">{profile.name}</p>
              <Link href={`/business/${profile.slug}`} className="font-mono text-[10px] text-indigo-600 dark:text-indigo-300">/business/{profile.slug}</Link>
              <p className="text-[10px] text-slate-400">👁 {profile.views} · {profile.published ? "प्रकाशित" : "ड्राफ्ट"}</p>
            </div>
          ))}
        </div>
      </Card>
      <AdminFilterBar label="प्रोफाइल खोज" searchPlaceholder="बिज़नेस खोजें…" showSearch />
      <DataManager
        resource="profiles"
        label="बिज़नेस प्रोफाइल"
        rows={JSON.parse(JSON.stringify(profiles)) as Row[]}
        columns={resourceConfigs.profiles.columns}
        fields={resourceConfigs.profiles.fields}
        canCreate={canManage(session.role)}
        canDelete={canDelete(session.role)}
        searchPlaceholder="प्रोफाइल खोजें…"
      />
      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">📩 ग्राहक पूछताछ ({inquiryRows.length})</h2>
        <div className="mt-1.5 space-y-1">
          {inquiryRows.map((inquiry) => (
            <div key={inquiry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-2 py-1 text-[11px] dark:border-white/10">
              <span className="min-w-0">
                <b>{inquiry.name}</b> · {inquiry.mobile} · <span className="text-slate-400">{inquiry.profileSlug}</span>
                <span className="block text-slate-500 dark:text-slate-400">{inquiry.message}</span>
              </span>
              <span className={`chip ${statusTone(inquiry.status)}`}>{inquiry.status}</span>
            </div>
          ))}
          {inquiryRows.length === 0 ? <p className="text-xs text-slate-400">कोई पूछताछ नहीं।</p> : null}
        </div>
        <p className="mt-1 text-[10px] text-slate-400">स्थिति बदलने के लिए /admin/api (inquiries) या DataManager का उपयोग करें।</p>
      </Card>
    </div>
  );
}
