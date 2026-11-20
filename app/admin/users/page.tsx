import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canDelete } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { resourceConfigs } from "@/lib/resources";
import { getSettings } from "@/lib/settings";
import { Badge, Card, PageHeader } from "@/components/ui";
import BackButton from "@/components/BackButton";
import DataManager, { type Row } from "@/components/DataManager";
import ColumnFilterTable from "@/components/ColumnFilter";
import AdminFilterBar from "@/components/AdminFilterBar";
import { filterLabel, matchesFilters, matchesQuery, parseFilters } from "@/lib/filters";

export const dynamic = "force-dynamic";
export const metadata = { title: "यूज़र प्रबंधन" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const filters = parseFilters(await searchParams);
  const config = resourceConfigs.users;
  const [rows, settings] = await Promise.all([
    db.select().from(users),
    getSettings(),
  ]);
  const safeRows = JSON.parse(
    JSON.stringify(
      rows
        .filter((user) => matchesFilters(user.createdAt, filters) && matchesQuery([user.username, user.name, user.role], filters.q))
        .map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
          active: user.active,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          loginCount: user.loginCount,
        })),
    ),
  ) as Row[];
  const isOwner = session.role === "owner";

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="Admin · Staff accounts"
        title="👥 यूज़र प्रबंधन"
        subtitle="स्टाफ ID/पासवर्ड बदलें, नया यूज़र जोड़ें या निष्क्रिय करें। Owner ही यूज़र बना/हटा सकता है।"
      />
      {!isOwner ? (
        <Card className="border-amber-300 p-3 text-xs font-semibold text-amber-800 dark:border-amber-400/30 dark:text-amber-200">
          ⚠️ आपके पास केवल देखने की अनुमति है। यूज़र जोड़ने/बदलने के लिए Owner लॉगिन करें।
        </Card>
      ) : null}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <Badge tone="indigo">डिस्प्ले ID: {settings.displayLoginId}</Badge>
          <Badge tone="amber">डिस्प्ले पासवर्ड: {settings.showCredentials === "0" ? "छिपा हुआ" : settings.displayLoginPassword}</Badge>
          <Badge tone={settings.loginPageVisible === "0" ? "rose" : "emerald"}>
            लॉगिन पेज: {settings.loginPageVisible === "0" ? "बंद" : "खुला"}
          </Badge>
          <Badge tone="slate">Owner Access Key सेट है</Badge>
        </div>
      </Card>
      <AdminFilterBar label="यूज़र जुड़ने की तिथि" searchPlaceholder="यूज़र / भूमिका खोजें…" showSearch />
      <Badge tone="slate">{filterLabel(filters)}</Badge>
      <Card className="p-3">
        <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">👔 स्टाफ यूज़र — हर कॉलम पर फ़िल्टर</h2>
        <ColumnFilterTable
          rows={safeRows.map((row) => ({
            id: Number(row.id),
            values: {
              username: String(row.username ?? ""),
              name: String(row.name ?? ""),
              role: String(row.role ?? ""),
              active: row.active ? "ON" : "OFF",
              loginCount: Number(row.loginCount ?? 0),
            },
            actions: [{ label: "✏️ नीचे Edit", href: "/admin/users" }],
          }))}
          columns={[
            { key: "username", label: "ID" },
            { key: "name", label: "नाम" },
            { key: "role", label: "भूमिका", type: "select" },
            { key: "active", label: "स्थिति", type: "select" },
            { key: "loginCount", label: "लॉगिन", type: "number" },
          ]}
        />
      </Card>

      <DataManager
        resource="users"
        label="यूज़र"
        rows={safeRows}
        columns={[...config.columns, { key: "loginCount", label: "लॉगिन" }, { key: "lastLoginAt", label: "अंतिम लॉगिन" }]}
        fields={config.fields}
        canCreate={isOwner}
        canDelete={canDelete(session.role)}
        searchPlaceholder="यूज़र खोजें…"
      />
      <Card className="p-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        <p className="font-bold text-slate-700 dark:text-slate-200">भूमिका नियम</p>
        <p>owner — पूर्ण अधिकार (जोड़ें, बदलें, हटाएँ, सेटिंग्स, लॉगिन नियंत्रण)।</p>
        <p>manager — रिकॉर्ड बना व बदल सकता है; मुख्य आइटम हटाना/फंक्शन जोड़ना नहीं।</p>
        <p>operator — केवल दैनिक प्रविष्टि।</p>
      </Card>
    </div>
  );
}
