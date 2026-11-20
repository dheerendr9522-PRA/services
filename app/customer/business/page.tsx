import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { businessProfiles } from "@/db/schema";
import { getCustomerSession } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import BackButton from "@/components/BackButton";
import CustomerBusinessBuilder, { type ProfileDraft } from "@/components/CustomerBusinessBuilder";

export const dynamic = "force-dynamic";
export const metadata = { title: "मेरा बिज़नेस प्रोफाइल" };

export default async function CustomerBusinessPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/customer/login");
  const rows = await db.select().from(businessProfiles).where(eq(businessProfiles.ownerMobile, session.mobile)).orderBy(desc(businessProfiles.createdAt)).limit(1);
  const existing = rows[0];
  const draft: ProfileDraft | null = existing
    ? {
        slug: existing.slug, name: existing.name, category: existing.category ?? "", ownerName: existing.ownerName ?? "",
        phone: existing.phone ?? "", whatsapp: existing.whatsapp ?? "", email: existing.email ?? "", address: existing.address ?? "",
        mapsUrl: existing.mapsUrl ?? "", description: existing.description ?? "", servicesText: existing.servicesText ?? "",
        productsText: existing.productsText ?? "", workingHours: existing.workingHours ?? "", logoUrl: existing.logoUrl ?? "",
        coverUrl: existing.coverUrl ?? "", websiteUrl: existing.websiteUrl ?? "", socialLinks: existing.socialLinks ?? "",
        template: existing.template, primaryColor: existing.primaryColor, accentColor: existing.accentColor,
        layout: existing.layout, published: existing.published,
      }
    : null;

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="Business Profile Builder"
        title="🏪 मेरा बिज़नेस प्रोफाइल"
        subtitle="अपनी दुकान/व्यवसाय की ऑनलाइन प्रोफाइल बनाएँ — लोगो, कवर, सेवाएँ, उत्पाद, संपर्क व टेम्पलेट चुनें। प्रकाशित करते ही आपका अलग पब्लिक लिंक बन जाता है जिसे WhatsApp पर शेयर कर सकते हैं।"
        actions={<Link href="/customer" className="btn-ghost px-3 py-1.5 text-xs">← कस्टमर पोर्टल</Link>}
      />
      <CustomerBusinessBuilder initial={draft} mobile={session.mobile} />
      {existing ? (
        <Card className="p-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">✅ आपका प्रकाशित प्रोफाइल</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">लिंक: <Link href={`/business/${existing.slug}`} className="font-mono text-indigo-600 dark:text-indigo-300">/business/{existing.slug}</Link> · 👁 {existing.views} व्यू · {existing.published ? "प्रकाशित" : "ड्राफ्ट"}</p>
        </Card>
      ) : null}
      <Card className="p-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
        <p className="font-bold text-slate-800 dark:text-slate-100">सुझाव</p>
        <p>• साफ लोगो (512px) व कवर फोटो (1200×400) अपलोड करें — फोटो URL की जगह /api/files/ID भी डाल सकते हैं।</p>
        <p>• सेवाएँ व उत्पाद में वही लिखें जो आप वास्तव में देते हैं — गलत दावे न करें।</p>
        <p>• प्रकाशित लिंक आपकी अनुमति से सार्वजनिक होता है; कभी भी Draft में बदल सकते हैं।</p>
      </Card>
    </div>
  );
}
