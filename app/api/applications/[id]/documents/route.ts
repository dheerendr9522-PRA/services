import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationDocuments, applications, auditLogs, files, notifications } from "@/db/schema";
import { canManage, getStaffSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession();
  if (!session || !canManage(session.role)) return NextResponse.json({ ok: false, error: "अनुमति नहीं" }, { status: 403 });
  const { id } = await params;
  const applicationId = Number(id);
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "फॉर्म त्रुटि" }, { status: 400 });

  const rows = await db.select().from(applications).where(eq(applications.id, applicationId)).limit(1);
  const application = rows[0];
  if (!application) return NextResponse.json({ ok: false, error: "आवेदन नहीं मिला" }, { status: 404 });

  const docTypes = form.getAll("docType").map(String);
  const uploads = form.getAll("docFile") as File[];
  const note = String(form.get("note") ?? "");
  const markCompleted = String(form.get("markCompleted") ?? "") === "1";
  let saved = 0;
  let firstFileId: number | null = null;
  let firstName = "";

  for (let i = 0; i < uploads.length; i += 1) {
    const file = uploads[i];
    if (!file || file.size === 0) continue;
    if (file.size > 100 * 1024 * 1024) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    const inserted = await db.insert(files).values({ name: file.name || "document", mime: file.type || "application/octet-stream", size: file.size, data: buffer.toString("base64") }).returning({ id: files.id });
    await db.insert(applicationDocuments).values({
      applicationId,
      docType: docTypes[i] || "तैयार दस्तावेज़",
      fileId: inserted[0]!.id,
      serviceSlug: application.serviceSlug ?? "",
      comment: note,
      uploadedBy: "staff",
    });
    if (!firstFileId) { firstFileId = inserted[0]!.id; firstName = file.name; }
    saved += 1;
  }

  if (markCompleted && saved > 0) {
    await db
      .update(applications)
      .set({
        status: "Completed",
        completedFileId: firstFileId,
        completedFileName: firstName,
        adminNote: note || application.adminNote,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId));
    await db.insert(notifications).values({
      audience: "customer",
      title: "आपका काम पूरा — दस्तावेज़ तैयार",
      body: `${application.refNo} · ${saved} दस्तावेज़ अपलोड · अब कस्टमर पोर्टल से डाउनलोड करें`,
    });
  }

  await db.insert(auditLogs).values({ actor: `${session.username} (${session.role})`, action: "application.documents_upload", detail: `${application.refNo} · ${saved} फाइलें` });
  return NextResponse.json({ ok: true, saved, completed: markCompleted && saved > 0 });
}
