import { db } from "@/db";
import { categories, websites } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { requireStaff } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import BackButton from "@/components/BackButton";
import MenuTogglePanel from "@/components/MenuTogglePanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "मेन्यू चालू/बंद" };

export default async function AdminMenusPage() {
  await ensureSeeded().catch(() => undefined);
  await requireStaff();
  const [settings, categoryRows, websiteRows] = await Promise.all([
    getSettings(),
    db.select().from(categories),
    db.select().from(websites),
  ]);

  const items = [
    { key: "groupDigital", label: "🏛️ डिजिटल सेवा केंद्र मेन्यू", hint: "साइडबार ग्रुप 1", value: settings.groupDigital, kind: "setting" as const },
    { key: "groupShop", label: "🖥️ कंप्यूटर शॉप मेन्यू", hint: "साइडबार ग्रुप 2", value: settings.groupShop, kind: "setting" as const },
    { key: "groupAccount", label: "📁 मेरा खाता व आवेदन मेन्यू", hint: "साइडबार ग्रुप 3", value: settings.groupAccount, kind: "setting" as const },
    { key: "groupAdmin", label: "📋 प्रबंधन (एडमिन) मेन्यू", hint: "ग्रुप 4 — कस्टमर को कभी नहीं दिखता", value: settings.groupAdmin, kind: "setting" as const },
    { key: "adminLoginEnabled", label: "एडमिन लॉगिन लिंक", hint: "मेन्यू में Admin Login दिखे या नहीं", value: settings.adminLoginEnabled, kind: "setting" as const },
    { key: "loginPageVisible", label: "एडमिन लॉगिन पेज", hint: "बंद होने पर Owner Access Key स्क्रीन आएगी", value: settings.loginPageVisible, kind: "setting" as const },
    { key: "showCredentials", label: "लॉगिन पेज पर ID/पासवर्ड दिखाएँ", hint: "डेमो हेल्पर कार्ड Show/Hide", value: settings.showCredentials, kind: "setting" as const },
    ...categoryRows.map((c) => ({
      key: `category-${c.id}`,
      label: `${c.icon} ${c.nameHi}`,
      hint: `${c.nameEn} · /category/${c.slug}`,
      value: c.active ? "1" : "0",
      kind: "category" as const,
      id: c.id,
      active: c.active,
    })),
    ...websiteRows.map((w) => ({
      key: `website-${w.id}`,
      label: w.name,
      hint: w.url,
      value: w.active ? "1" : "0",
      kind: "website" as const,
      id: w.id,
      active: w.active,
    })),
  ];

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="एडमिन · मेन्यू नियंत्रण"
        title="🎛️ मेन्यू चालू/बंद"
        subtitle="ग्राहक को कौन-सा मेन्यू, श्रेणी व वेबसाइट दिखे — यहाँ से एक क्लिक में चालू/बंद करें। बंद किया गया मेन्यू पब्लिक साइडबार व डायरेक्टरी से तुरंत छिप जाता है।"
      />
      <MenuTogglePanel items={items} />
    </div>
  );
}
