import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationDocuments,
  applications,
  customers,
  files,
  notifications,
  auditLogs,
  services,
} from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { getCustomerSession, getStaffSession } from "@/lib/auth";
import { autoSyncRow, syncToGoogleSheet } from "@/lib/sheets";

export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MIN_FILE_BYTES = 5 * 1024;

async function storeFile(file: File): Promise<number | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_BYTES || file.size < MIN_FILE_BYTES) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  const inserted = await db
    .insert(files)
    .values({
      name: file.name || "document",
      mime: file.type || "application/octet-stream",
      size: file.size,
      data: buffer.toString("base64"),
    })
    .returning({ id: files.id });
  return inserted[0]?.id ?? null;
}

export async function POST(request: Request) {
  try {
    await ensureSeeded();
  } catch {
    /* best effort */
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "फॉर्म डेटा त्रुटि" }, { status: 400 });
  }

  const str = (key: string) => String(form.get(key) ?? "").trim();
  const customerName = str("customerName");
  const mobile = str("mobile").replace(/\D/g, "");
  const serviceSlug = str("serviceSlug");

  if (!customerName || customerName.length < 2) {
    return NextResponse.json({ ok: false, error: "ग्राहक का पूरा नाम आवश्यक है" }, { status: 400 });
  }
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return NextResponse.json({ ok: false, error: "सही 10 अंकों का मोबाइल नंबर दर्ज करें" }, { status: 400 });
  }
  if (!serviceSlug) {
    return NextResponse.json({ ok: false, error: "सेवा चुनें" }, { status: 400 });
  }

  const serviceRows = await db.select().from(services).where(eq(services.slug, serviceSlug)).limit(1);
  const service = serviceRows[0];
  if (!service) {
    return NextResponse.json({ ok: false, error: "सेवा नहीं मिली" }, { status: 404 });
  }

  const total = Number(str("amount")) || service.shopFee + service.govtFee + service.bookingFee;
  const existingCount = await db.select({ value: count() }).from(applications);
  let refNo = `DP-R${2001 + Number(existingCount[0]?.value ?? 0)}`;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const clash = await db.select({ id: applications.id }).from(applications).where(eq(applications.refNo, refNo)).limit(1);
    if (!clash[0]) break;
    refNo = `DP-R${2001 + Number(existingCount[0]?.value ?? 0) + attempt + 1}`;
  }

  const session = await getStaffSession();
  const customerSession = await getCustomerSession();
  const paymentScreenshotId = await storeFile(form.get("paymentScreenshot") as File);

  const inserted = await db
    .insert(applications)
    .values({
      refNo,
      serviceId: service.id,
      serviceSlug: service.slug,
      serviceName: service.nameHi,
      customerName,
      mobile,
      whatsapp: str("whatsapp") || mobile,
      guardianName: str("guardianName"),
      address: str("address"),
      email: str("email"),
      familyId: str("familyId"),
      notes: str("notes"),
      formData: (() => {
        try {
          return JSON.parse(str("formData") || "{}") as Record<string, string>;
        } catch {
          return {};
        }
      })(),
      servicesList: (() => {
        try {
          const parsed = JSON.parse(str("servicesList") || "[]") as unknown;
          return Array.isArray(parsed) ? (parsed as { slug: string; nameHi: string; fee: number; status: string; documents: string[] }[]) : [];
        } catch {
          return [];
        }
      })(),
      relatedTasks: (() => {
        try {
          const parsed = JSON.parse(str("relatedTasks") || "[]") as unknown;
          return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
          return [];
        }
      })(),
      amount: total,
      govtFee: service.govtFee,
      paymentMode: str("paymentMode") || "UPI",
      utr: str("utr"),
      status: "Pending",
    })
    .returning();

  const application = inserted[0];

  const docTypes = form.getAll("docType").map((d) => String(d));
  const docFiles = form.getAll("docFile");
  for (let i = 0; i < docFiles.length; i += 1) {
    const file = docFiles[i] as File;
    const fileId = await storeFile(file);
    if (fileId) {
      await db.insert(applicationDocuments).values({
        applicationId: application.id,
        docType: docTypes[i] || `दस्तावेज़ ${i + 1}`,
        fileId,
        serviceSlug: String((form.getAll("docService")[i] as string) ?? ""),
        uploadedBy: "customer",
      });
    }
  }

  if (paymentScreenshotId) {
    await db.insert(applicationDocuments).values({
      applicationId: application.id,
      docType: "पेमेंट स्क्रीनशॉट",
      fileId: paymentScreenshotId,
    });
  }

  await db
    .insert(customers)
    .values({
      name: customerName,
      mobile,
      address: str("address"),
      email: str("email"),
    })
    .catch(() => undefined);

  await db.insert(notifications).values([
    {
      audience: "staff",
      title: `नई आवेदन: ${service.nameHi}`,
      body: `${refNo} — ${customerName} (${mobile}) · ${total ? `₹${total}` : "शुल्क बाकी"}`,
    },
    {
      audience: "customer",
      title: "आवेदन प्राप्त हुआ",
      body: `${refNo} — ${service.nameHi}। ट्रैकिंग पेज पर स्थिति देखें।`,
    },
  ]);

  await db.insert(auditLogs).values({
    actor: session ? `${session.username} (${session.role})` : customerSession ? `customer:${customerSession.mobile}` : "public",
    action: "application.create",
    detail: `${refNo} · ${service.nameHi} · ₹${total}`,
  });

  void syncToGoogleSheet("applications", {
    refNo,
    customerName,
    mobile,
    service: service.nameHi,
    amount: total,
    paymentMode: str("paymentMode") || "UPI",
    utr: str("utr"),
    status: "Pending",
    createdAt: new Date().toISOString(),
  });

  void autoSyncRow("applications", [
    refNo,
    customerName,
    mobile,
    str("whatsapp") || mobile,
    service.nameHi,
    total,
    str("paymentMode") || "UPI",
    str("utr"),
    "Pending",
    "",
    new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
  ]);
  void autoSyncRow("customers", [
    customerName,
    mobile,
    str("address"),
    "",
    str("email"),
    "ON",
    new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
  ]);

  return NextResponse.json({ ok: true, refNo, id: application.id, amount: total });
}
