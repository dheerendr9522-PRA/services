import Link from "next/link";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { formatDate } from "@/lib/utils";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import DataManager, { type Row } from "@/components/DataManager";
import AdminFilterBar from "@/components/AdminFilterBar";

export const dynamic = "force-dynamic";
export const metadata = { title: "बैनर प्रबंधन" };

const FIELDS = [
  { key: "title", label: "बैनर शीर्षक", type: "text", required: true },
  { key: "subtitle", label: "उप-शीर्षक", type: "text" },
  { key: "description", label: "विवरण", type: "textarea" },
  { key: "imageUrl", label: "डेस्कटॉप इमेज URL / /api/files/ID", type: "text" },
  { key: "mobileImageUrl", label: "मोबाइल इमेज URL", type: "text" },
  { key: "buttonLabel", label: "बटन लेबल", type: "text" },
  { key: "buttonLink", label: "बटन लिंक (जैसे /services)", type: "text" },
  { key: "secondaryLabel", label: "दूसरा बटन लेबल", type: "text" },
  { key: "secondaryLink", label: "दूसरा बटन लिंक", type: "text" },
  { key: "targetPage", label: "किस पेज पर", type: "select", options: ["home", "services", "admin", "customer", "offers", "business", "login", "directory", "learning", "billing"] },
  { key: "position", label: "स्थान (position)", type: "select", options: ["top-header", "below-header", "above-heading", "below-heading", "above-footer", "sidebar", "between-sections"] },
  { key: "displayType", label: "प्रकार", type: "select", options: ["hero", "promotional", "offer", "announcement", "image", "small", "carousel"] },
  { key: "bgColor", label: "बैकग्राउंड रंग", type: "text" },
  { key: "textColor", label: "टेक्स्ट रंग", type: "text" },
  { key: "overlayOpacity", label: "ओवरले ओपेसिटी (0–90)", type: "number" },
  { key: "radius", label: "कोना गोलाई (px)", type: "number" },
  { key: "startDate", label: "शुरू तारीख", type: "date" },
  { key: "endDate", label: "समाप्ति तारीख", type: "date" },
  { key: "displayOrder", label: "क्रम", type: "number" },
  { key: "status", label: "स्थिति", type: "select", options: ["Draft", "Scheduled", "Active", "Expired", "Inactive"] },
  { key: "active", label: "ON/OFF", type: "boolean" },
  { key: "altText", label: "Alt Text (accessibility)", type: "text" },
];

export default async function AdminBannersPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const rows = await db.select().from(banners);
  const now = new Date();
  const activeCount = rows.filter((b) => b.active && b.startDate <= now && b.endDate >= now).length;

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="🖼 Banner Manager"
        title={`बैनर प्रबंधन (${rows.length})`}
        subtitle="किसी भी पेज पर बैनर जोड़ें — होम, सेवाएँ, ऑफर, बिज़नेस प्रोफाइल आदि। तारीख से शेड्यूल करें, ऊपर-नीचे क्रम बदलें, ON/OFF करें।"
        actions={<><Link href="/admin/design" className="btn-ghost px-3 py-1.5 text-xs">🎨 डिज़ाइन स्टूडियो</Link><Link href="/" className="btn-primary px-3 py-1.5 text-xs">🌐 होम पर देखें</Link></>}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="🖼" label="कुल बैनर" value={rows.length} tone="indigo" />
        <Stat icon="✅" label="सक्रिय" value={activeCount} tone="emerald" />
        <Stat icon="🕘" label="शेड्यूल्ड" value={rows.filter((b) => b.startDate > now).length} tone="amber" />
        <Stat icon="⌛" label="समाप्त" value={rows.filter((b) => b.endDate < now).length} tone="rose" />
      </div>
      <AdminFilterBar label="बैनर खोज" searchPlaceholder="बैनर खोजें…" showSearch />
      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">बैनर झलक</h2>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((banner) => (
            <div key={banner.id} className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
              <div className="px-2 py-1.5 text-[11px] font-bold text-white" style={{ background: banner.bgColor ?? "#4f46e5" }}>
                {banner.title}
              </div>
              <div className="px-2 py-1 text-[10px] text-slate-500 dark:text-slate-400">
                {banner.targetPage} · {banner.position} · {banner.status} · {formatDate(banner.startDate)}–{formatDate(banner.endDate)}
              </div>
            </div>
          ))}
          {rows.length === 0 ? <p className="text-xs text-slate-400">कोई बैनर नहीं — नीचे से जोड़ें।</p> : null}
        </div>
      </Card>
      <DataManager
        resource="banners"
        label="बैनर"
        rows={JSON.parse(JSON.stringify(rows)) as Row[]}
        columns={[
          { key: "title", label: "शीर्षक" }, { key: "targetPage", label: "पेज" }, { key: "position", label: "स्थान" },
          { key: "status", label: "स्थिति" }, { key: "displayOrder", label: "क्रम" }, { key: "active", label: "ON/OFF" },
        ]}
        fields={FIELDS}
        canCreate={canManage(session.role)}
        canDelete={canDelete(session.role)}
        searchPlaceholder="बैनर खोजें…"
      />
    </div>
  );
}
