import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, businessProfiles, customers } from "@/db/schema";
import { getCustomerSession } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ ok: false, error: "बिज़नेस नाम आवश्यक" }, { status: 400 });
  const requestedSlug = String(body.slug ?? "").trim();
  let baseSlug = slugify(requestedSlug || name);
  if (!baseSlug || baseSlug.startsWith("item-") || baseSlug.length < 3) {
    baseSlug = `biz-${session.mobile.slice(-6)}`;
  }
  const existing = await db.select().from(businessProfiles).where(eq(businessProfiles.slug, baseSlug)).limit(1);
  const ownExisting = existing[0] && existing[0].ownerMobile === session.mobile ? existing[0] : null;
  const slug = existing[0] && !ownExisting ? `${baseSlug}-${session.mobile.slice(-4)}` : baseSlug;

  const payload = {
    slug,
    name,
    category: String(body.category ?? "स्थानीय व्यवसाय"),
    ownerName: String(body.ownerName ?? session.name),
    phone: String(body.phone ?? session.mobile),
    whatsapp: String(body.whatsapp ?? session.mobile),
    email: String(body.email ?? ""),
    address: String(body.address ?? ""),
    mapsUrl: String(body.mapsUrl ?? ""),
    description: String(body.description ?? ""),
    servicesText: String(body.servicesText ?? ""),
    productsText: String(body.productsText ?? ""),
    workingHours: String(body.workingHours ?? ""),
    logoUrl: String(body.logoUrl ?? ""),
    coverUrl: String(body.coverUrl ?? ""),
    websiteUrl: String(body.websiteUrl ?? ""),
    socialLinks: String(body.socialLinks ?? ""),
    template: String(body.template ?? "classic"),
    primaryColor: String(body.primaryColor ?? "#4f46e5"),
    accentColor: String(body.accentColor ?? "#f97316"),
    layout: String(body.layout ?? "hero"),
    published: body.published !== false,
    ownerMobile: session.mobile,
  };

  const row = ownExisting
    ? (await db.update(businessProfiles).set(payload).where(eq(businessProfiles.id, ownExisting.id)).returning())[0]
    : (await db.insert(businessProfiles).values(payload).returning())[0];

  await db.insert(customers).values({ name: session.name, mobile: session.mobile }).catch(() => undefined);
  await db.insert(auditLogs).values({ actor: `customer:${session.mobile}`, action: "profile.business_save", detail: slug });
  return NextResponse.json({ ok: true, slug: row?.slug, published: row?.published });
}
