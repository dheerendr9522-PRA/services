import { desc } from "drizzle-orm";
import { db } from "@/db";
import { banners, designVersions } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { requireStaff } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import BackButton from "@/components/BackButton";
import DesignStudio, { type DesignState } from "@/components/DesignStudio";

export const dynamic = "force-dynamic";
export const metadata = { title: "डिज़ाइन स्टूडियो" };

const defaultDesign: DesignState = {
  primary: "#4f46e5", accent: "#f97316", sidebar: "#0f172a", surface: "#ffffff", text: "#0f172a",
  radius: 16, cardShadow: "sm", cardPadding: 12, cardBorderWidth: 1, headingSize: 18, bodySize: 12,
  buttonRadius: 12, buttonStyle: "rounded", gridColumns: 4, sidebarWidth: 248, pagePadding: 16,
  preset: "dp-blue", fontHindi: "Noto Sans Devanagari", fontEnglish: "Inter",
};

export default async function AdminDesignPage() {
  await ensureSeeded().catch(() => undefined);
  await requireStaff();
  const [settings, bannerRows, versionRows] = await Promise.all([
    getSettings(),
    db.select().from(banners).orderBy(desc(banners.createdAt)),
    db.select().from(designVersions).orderBy(desc(designVersions.createdAt)).limit(15),
  ]);
  let design = defaultDesign;
  if (settings.designJson) {
    try {
      design = { ...defaultDesign, ...(JSON.parse(settings.designJson) as Partial<DesignState>) };
    } catch {
      design = defaultDesign;
    }
  }

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="🎨 Design Studio"
        title="डिज़ाइन स्टूडियो — रंग, कार्ड, बटन व लेआउट"
        subtitle="बिना कोड बदले पूरे ऐप का रंग, कार्ड स्टाइल, बटन शेप, ग्रिड और फ़ॉन्ट बदलें। हर Save पर नया संस्करण सुरक्षित रहता है और कभी भी Restore कर सकते हैं।"
        actions={<><a href="/admin/design-elements" className="btn-ghost px-3 py-1.5 text-xs">🗂️ कार्ड/बटन जोड़ें</a><a href="/admin/pages" className="btn-ghost px-3 py-1.5 text-xs">📄 पेज/मेन्यू</a></>}
      />
      <DesignStudio
        initial={design}
        banners={bannerRows.map((b) => ({ id: b.id, title: b.title, status: b.status, targetPage: b.targetPage }))}
        versions={versionRows.map((v) => ({ id: v.id, versionNo: v.versionNo, createdAt: v.createdAt.toISOString(), changedBy: v.changedBy }))}
      />
    </div>
  );
}
