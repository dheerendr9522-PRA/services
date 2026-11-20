import { ensureSeeded } from "@/db/seed";
import { requireStaff } from "@/lib/guard";
import { PageHeader } from "@/components/ui";
import BackButton from "@/components/BackButton";
import GoogleSheetPanel from "@/components/GoogleSheetPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "गूगल शीट कनेक्शन" };

export default async function AdminSheetsPage() {
  await ensureSeeded().catch(() => undefined);
  await requireStaff();
  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="एडमिन · Google Sheets"
        title="📊 गूगल शीट कनेक्शन"
        subtitle="दुकान का पूरा डेटा अपनी निजी Google Sheet में भेजें — बैकअप व मोबाइल पर देखने के लिए।"
      />
      <GoogleSheetPanel />
    </div>
  );
}
