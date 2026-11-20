import { eq } from "drizzle-orm";
import type { ReactNode } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { requireStaff } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import AdminShell, { type AdminNavItem } from "@/components/AdminShell";

const uniqueNav = (items: AdminNavItem[]): AdminNavItem[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
};

export const dynamic = "force-dynamic";

const NAV: AdminNavItem[] = [
  { href: "/admin", label: "अवलोकन", icon: "📊", exact: true },
  { href: "/admin/applications", label: "सेवा अनुरोध", icon: "📥" },
  { href: "/admin/customers", label: "ग्राहक", icon: "👥" },
  { href: "/admin/repairs", label: "रिपेयर जॉब", icon: "🛠️" },
  { href: "/admin/invoices", label: "इनवॉइस", icon: "💳" },
  { href: "/admin/documents", label: "दस्तावेज़", icon: "📎" },
  { href: "/admin/services", label: "सेवा सूची", icon: "🗂️" },
  { href: "/admin/websites", label: "वेबसाइट चालू/बंद", icon: "🌐" },
  { href: "/admin/categories", label: "मेन्यू जोड़ें/संपादित", icon: "🗂️" },
  { href: "/admin/menus", label: "मेन्यू चालू/बंद", icon: "🎛️" },
  { href: "/admin/users", label: "उपयोगकर्ता प्रबंधन", icon: "👔" },
  { href: "/admin/expenses", label: "खर्च", icon: "💸" },
  { href: "/admin/reports", label: "रिपोर्ट", icon: "📈" },
  { href: "/admin/sheets", label: "गूगल शीट", icon: "📊" },
  { href: "/admin/csv", label: "CSV / शीट संग्रह", icon: "📑" },
  { href: "/admin/settings", label: "सेटिंग्स", icon: "⚙️" },
  { href: "/admin/audit", label: "ऑडिट लॉग", icon: "📜" },
  { href: "/admin/billing", label: "बिल बिल्डर", icon: "🧾" },
  { href: "/admin/accounting", label: "बिलिंग एवं अकाउंटिंग", icon: "🧮" },
  { href: "/admin/design", label: "डिज़ाइन स्टूडियो", icon: "🎨" },
  { href: "/admin/design-elements", label: "कार्ड व बटन डिज़ाइनर", icon: "🗂️" },
  { href: "/admin/pages", label: "पेज व मेन्यू डिज़ाइनर", icon: "📄" },
  { href: "/admin/banners", label: "बैनर प्रबंधन", icon: "🖼" },
  { href: "/admin/learning", label: "सेवा सीखें", icon: "🎓" },
  { href: "/admin/profiles", label: "बिज़नेस प्रोफाइल", icon: "🏪" },
  { href: "/admin/integrations", label: "वेबसाइट / ऐप जोड़ें", icon: "🔗" },
  { href: "/apps", label: "ऐप फ्रेम", icon: "🖥️" },
  { href: "/admin/sync", label: "बैकअप व ऑफलाइन सिंक", icon: "🔄" },
  { href: "/", label: "पब्लिक वेबसाइट", icon: "🌐" },
  { href: "/admin/offers", label: "ऑफर एवं छूट", icon: "🏷️" },
  { href: "/admin/feedback", label: "फीडबैक व रेटिंग", icon: "⭐" },
  { href: "/admin/business", label: "DP बिज़नेस प्रोफाइल", icon: "🏪" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const [settings, rows] = await Promise.all([
    getSettings(),
    db.select().from(users).where(eq(users.id, session.id)).limit(1).catch(() => []),
  ]);
  const user = rows[0];

  return (
    <AdminShell
      nav={uniqueNav(NAV)}
      businessName={settings.businessName}
      profile={{
        name: user?.name ?? session.name,
        username: session.username,
        role: session.role,
        profileUrl: settings.profileUrl,
        loginCount: user?.loginCount ?? 1,
        lastLoginAt:
          user?.lastLoginAt?.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" }) ?? "—",
      }}
    >
      {children}
    </AdminShell>
  );
}
