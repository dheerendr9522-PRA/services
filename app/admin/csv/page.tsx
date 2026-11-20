import { ensureSeeded } from "@/db/seed";
import { requireStaff } from "@/lib/guard";
import { getApplications, getServices } from "@/lib/queries";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import SheetsPanel from "@/components/SheetsPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "CSV / शीट संग्रह" };

export default async function AdminCsvPage() {
  await ensureSeeded().catch(() => undefined);
  await requireStaff();
  const [services, applications] = await Promise.all([getServices({ limit: 500, activeOnly: false }), getApplications({ limit: 500 })]);
  const counts = new Map<string, number>();
  applications.forEach((app) => counts.set(app.serviceSlug ?? "", (counts.get(app.serviceSlug ?? "") ?? 0) + 1));

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="एडमिन · संग्रह"
        title="📑 CSV / शीट संग्रह"
        subtitle="हर सेवा की अलग CSV फाइल, ग्राहक, आवेदन, पूर्ण कार्य, बिलिंग, खर्च व रिपेयर — डाउनलोड करें या Google Sheet में =IMPORTDATA से जोड़ें।"
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="🧾" label="सेवा CSV" value={services.length} tone="indigo" />
        <Stat icon="📥" label="आवेदन रिकॉर्ड" value={applications.length} tone="sky" />
        <Stat icon="✅" label="पूर्ण कार्य" value={applications.filter((a) => a.status === "Completed").length} tone="emerald" />
        <Stat icon="🗂️" label="सक्रिय सेवाएँ" value={services.filter((s) => s.active).length} tone="amber" />
      </div>
      <Card className="p-3">
        <SheetsPanel
          services={services.map((s) => ({
            slug: s.slug,
            nameHi: s.nameHi,
            nameEn: s.nameEn,
            shopFee: s.shopFee,
            count: counts.get(s.slug) ?? 0,
          }))}
        />
      </Card>
    </div>
  );
}
