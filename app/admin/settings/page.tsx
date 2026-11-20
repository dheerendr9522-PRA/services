import { ensureSeeded } from "@/db/seed";
import { requireStaff } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import { Card, PageHeader } from "@/components/ui";
import BackButton from "@/components/BackButton";
import SettingsForm from "@/components/SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "एडमिन सेटिंग्स" };

export default async function AdminSettingsPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const settings = await getSettings();

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="Admin · Settings"
        title="⚙️ डैशबोर्ड, ब्रांडिंग, UPI व मेन्यू नियंत्रण"
        subtitle="लोगो/प्रोफाइल अपलोड, UPI विवरण, चारों साइडबार मेन्यू के ON/OFF, एडमिन लॉगिन पेज Show/Hide, ID/पासवर्ड डिस्प्ले नियंत्रण व Owner Access Key — सब यहीं से बदलें।"
      />
      {session.role !== "owner" ? (
        <Card className="border-amber-300 p-3 text-xs font-semibold text-amber-800 dark:border-amber-400/30 dark:text-amber-200">
          ⚠️ लॉगिन व सुरक्षा सेटिंग्स में बदलाव के लिए Owner लॉगिन आवश्यक है।
        </Card>
      ) : null}
      <SettingsForm settings={settings} />
    </div>
  );
}
