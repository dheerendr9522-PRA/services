import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { getWebsites } from "@/lib/queries";
import { resourceConfigs } from "@/lib/resources";
import { PageHeader } from "@/components/ui";
import BackButton from "@/components/BackButton";
import DataManager, { type Row } from "@/components/DataManager";
import AdminFilterBar from "@/components/AdminFilterBar";

export const dynamic = "force-dynamic";
export const metadata = { title: "ऑफिशियल लिंक प्रबंधन" };

export default async function AdminWebsitesPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const config = resourceConfigs.websites;
  const sites = await getWebsites(false);
  const rows = JSON.parse(JSON.stringify(sites)) as Row[];

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="Admin · Official links manager"
        title={`🌐 ऑफिशियल वेबसाइट प्रबंधन (${rows.length})`}
        subtitle="म.प्र. व केंद्र सरकार के सभी लिंक — ON/OFF करें, नई वेबसाइट जोड़ें या हटाएँ। बंद लिंक ग्राहक डायरेक्टरी से छिप जाते हैं।"
      />
      <AdminFilterBar label="खोज" searchPlaceholder="वेबसाइट खोजें…" showSearch />
      <DataManager
        resource="websites"
        label="वेबसाइट"
        rows={rows}
        columns={config.columns}
        fields={config.fields}
        canCreate={canManage(session.role)}
        canDelete={canDelete(session.role)}
        searchPlaceholder="वेबसाइट या URL खोजें…"
      />
    </div>
  );
}
