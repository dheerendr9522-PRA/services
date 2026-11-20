import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationDocuments, applications, auditLogs, files } from "@/db/schema";
import { getCustomerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ ok: false, error: "कस्टमर लॉगिन आवश्यक" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "फॉर्म त्रुटि" }, { status: 400 });

  const refNo = String(form.get("applicationRef") ?? "").trim().toUpperCase();
  const comment = String(form.get("comment") ?? "").slice(0, 300);
  const rows = await db.select().from(applications).where(and(eq(applications.refNo, refNo), eq(applications.mobile, session.mobile))).limit(1);
  const application = rows[0];
  if (!application) return NextResponse.json({ ok: false, error: "आवेदन नहीं मिला — अपना ट्रैकिंग नंबर जाँचें" }, { status: 404 });

  const docTypes = form.getAll("docType").map(String);
  const uploads = form.getAll("docFile") as File[];
  let saved = 0;
  for (let i = 0; i < uploads.length; i += 1) {
    const file = uploads[i];
    if (!file || file.size === 0) continue;
    if (file.size < 5 * 1024 || file.size > 100 * 1024 * 1024) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    const inserted = await db.insert(files).values({ name: file.name || "document", mime: file.type || "application/octet-stream", size: file.size, data: buffer.toString("base64") }).returning({ id: files.id });
    await db.insert(applicationDocuments).values({
      applicationId: application.id,
      docType: docTypes[i] || `दस्तावेज़ ${i + 1}`,
      fileId: inserted[0]!.id,
      serviceSlug: application.serviceSlug ?? "",
      comment,
      uploadedBy: "customer",
    });
    saved += 1;
  }
  await db.insert(auditLogs).values({ actor: `customer:${session.mobile}`, action: "document.customer_upload", detail: `${refNo} · ${saved} फाइलें` });
  return NextResponse.json({ ok: true, saved });
}
