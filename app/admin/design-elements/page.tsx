import Link from "next/link";
import { db } from "@/db";
import { customButtons, customCards } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { resourceConfigs } from "@/lib/resources";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import DataManager, { type Row } from "@/components/DataManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "कार्ड व बटन डिज़ाइनर" };

export default async function AdminDesignElementsPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const [cards, buttons] = await Promise.all([db.select().from(customCards), db.select().from(customButtons)]);

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="🎨 Card & Button Designer"
        title="कार्ड व बटन डिज़ाइनर"
        subtitle="होम पेज के कार्ड और बटन जोड़ें, नाम/रंग/आकार/लिंक बदलें, Copy से डुप्लिकेट करें, क्रम बदलें, Hide (दिखाएँ = OFF) या Delete करें — बदलाव तुरंत लाइव।"
        actions={<><Link href="/admin/pages" className="btn-ghost px-3 py-1.5 text-xs">📄 पेज व मेन्यू</Link><Link href="/" className="btn-primary px-3 py-1.5 text-xs">🌐 होम पर देखें</Link></>}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="🗂️" label="कुल कार्ड" value={cards.length} tone="indigo" />
        <Stat icon="👁" label="दिखने वाले कार्ड" value={cards.filter((c) => c.visible).length} tone="emerald" />
        <Stat icon="🔘" label="कुल बटन" value={buttons.length} tone="sky" />
        <Stat icon="👁" label="दिखने वाले बटन" value={buttons.filter((b) => b.visible).length} tone="amber" />
      </div>
      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">लाइव झलक</h2>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.filter((c) => c.visible).map((card) => (
            <div key={card.id} className="p-2.5" style={{ background: card.bgColor ?? "#eef2ff", color: card.textColor ?? "#1e293b", borderRadius: card.radius }}>
              <p className="text-[11px] font-bold">{card.icon} {card.title}</p>
              <p className="text-[10px] opacity-80">{card.subtitle}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {buttons.filter((b) => b.visible).map((button) => (
            <span key={button.id} className="px-2.5 py-1.5 text-[11px] font-bold" style={{ background: button.bgColor ?? "#4f46e5", color: button.textColor ?? "#fff", borderRadius: button.style === "pill" ? 999 : button.style === "square" ? 4 : 12 }}>
              {button.icon} {button.label}
            </span>
          ))}
        </div>
      </Card>
      <DataManager resource="cards" label="कार्ड" rows={JSON.parse(JSON.stringify(cards)) as Row[]} columns={resourceConfigs.cards.columns} fields={resourceConfigs.cards.fields} canCreate={canManage(session.role)} canDelete={canDelete(session.role)} searchPlaceholder="कार्ड खोजें…" />
      <DataManager resource="buttons" label="बटन" rows={JSON.parse(JSON.stringify(buttons)) as Row[]} columns={resourceConfigs.buttons.columns} fields={resourceConfigs.buttons.fields} canCreate={canManage(session.role)} canDelete={canDelete(session.role)} searchPlaceholder="बटन खोजें…" />
    </div>
  );
}
