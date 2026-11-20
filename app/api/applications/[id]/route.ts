import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, auditLogs, files, notifications } from "@/db/schema";
import { canDelete, getStaffSession } from "@/lib/auth";
import { syncToGoogleSheet } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });
  const { id } = await params;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) {
    return NextResponse.json({ ok: false, error: "अमान्य ID" }, { status: 400 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.resendRequest) {
    const rows = await db.select().from(applications).where(eq(applications.id, applicationId)).limit(1);
    const target = rows[0];
    if (!target) return NextResponse.json({ ok: false, error: "आवेदन नहीं मिला" }, { status: 404 });
    const remark = String(body.remark ?? "कृपया आवश्यक दस्तावेज़ दोबारा अपलोड करें");
    const docsNeeded = String(body.documentsNeeded ?? "");
    await db
      .update(applications)
      .set({
        status: "Documents Pending",
        adminNote: `[दस्तावेज़ अनुरोध ${new Date().toLocaleDateString("en-IN")}] ${remark}${docsNeeded ? ` · आवश्यक: ${docsNeeded}` : ""}`,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, applicationId));
    await db.insert(notifications).values([
      { audience: "customer", title: "दस्तावेज़ दोबारा भेजने का अनुरोध", body: `${target.refNo} — ${remark}` },
      { audience: "staff", title: "दस्तावेज़ अनुरोध भेजा", body: `${target.refNo} · ${target.customerName}` },
    ]);
    await db.insert(auditLogs).values({
      actor: `${session.username} (${session.role})`,
      action: "application.resend_request",
      detail: `${target.refNo} — ${remark}`,
    });
    return NextResponse.json({
      ok: true,
      message: `दस्तावेज़ अनुरोध भेजा गया — ग्राहक ${target.mobile} के पोर्टल पर सूचना जाएगी`,
      whatsapp: `https://wa.me/91${target.mobile}?text=${encodeURIComponent(`नमस्ते ${target.customerName}, आपके आवेदन ${target.refNo} के लिए दस्तावेज़ दोबारा भेजें। नोट: ${remark}`)}`,
    });
  }
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.status === "string") patch.status = body.status;
  if (typeof body.adminNote === "string") patch.adminNote = body.adminNote;
  if (typeof body.amount === "number") patch.amount = body.amount;
  if (typeof body.utr === "string") patch.utr = body.utr;
  if (typeof body.customerName === "string" && body.customerName.trim()) patch.customerName = body.customerName.trim();
  if (typeof body.mobile === "string") patch.mobile = body.mobile.replace(/\D/g, "").slice(0, 10);
  if (typeof body.whatsapp === "string") patch.whatsapp = body.whatsapp;
  if (typeof body.guardianName === "string") patch.guardianName = body.guardianName;
  if (typeof body.address === "string") patch.address = body.address;
  if (typeof body.email === "string") patch.email = body.email;
  if (typeof body.familyId === "string") patch.familyId = body.familyId;
  if (typeof body.notes === "string") patch.notes = body.notes;
  if (typeof body.customerQuery === "string") patch.customerQuery = body.customerQuery;
  if (typeof body.paymentMode === "string") patch.paymentMode = body.paymentMode;
  if (typeof body.paymentVerify === "string") patch.paymentVerify = body.paymentVerify;
  if (body.paidAmount !== undefined) patch.paidAmount = Number(body.paidAmount) || 0;
  if (body.govtFee !== undefined) patch.govtFee = Number(body.govtFee) || 0;
  const dateOrNull = (value: unknown) => {
    const text = String(value ?? "").trim();
    if (!text) return null;
    const parsed = new Date(text.length <= 10 ? `${text}T10:00:00` : text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  if (body.serviceDate !== undefined) patch.serviceDate = dateOrNull(body.serviceDate);
  if (body.followUpDate !== undefined) patch.followUpDate = dateOrNull(body.followUpDate);
  if (body.estCompletion !== undefined) patch.estCompletion = dateOrNull(body.estCompletion);

  const updated = await db
    .update(applications)
    .set(patch)
    .where(eq(applications.id, applicationId))
    .returning();

  if (patch.status) {
    await db.insert(notifications).values({
      audience: "customer",
      title: `आवेदन स्थिति अपडेट: ${String(patch.status)}`,
      body: `${updated[0]?.refNo ?? applicationId} — ${updated[0]?.serviceName ?? ""}`,
    });
  }
  await db.insert(auditLogs).values({
    actor: `${session.username} (${session.role})`,
    action: "application.update",
    detail: `${updated[0]?.refNo ?? applicationId} → ${String(patch.status ?? "अपडेट")}`,
  });

  return NextResponse.json({ ok: true, application: updated[0] });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });
  const { id } = await params;
  const applicationId = Number(id);
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "फॉर्म त्रुटि" }, { status: 400 });

  const file = form.get("completedFile") as File | null;
  const note = String(form.get("note") ?? "");
  const patch: Record<string, unknown> = { status: "Completed", adminNote: note, updatedAt: new Date() };

  if (file && file.size > 0) {
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "फाइल 100MB से कम होनी चाहिए" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const inserted = await db
      .insert(files)
      .values({
        name: file.name || "completed-document",
        mime: file.type || "application/octet-stream",
        size: file.size,
        data: buffer.toString("base64"),
      })
      .returning({ id: files.id });
    patch.completedFileId = inserted[0]?.id ?? null;
    patch.completedFileName = file.name || "completed-document";
  }

  const updated = await db
    .update(applications)
    .set(patch)
    .where(eq(applications.id, applicationId))
    .returning();

  await db.insert(notifications).values({
    audience: "customer",
    title: "आपका काम पूरा हुआ",
    body: `${updated[0]?.refNo ?? applicationId} — तैयार दस्तावेज़ डाउनलोड करें।`,
  });
  if (updated[0]) {
    void syncToGoogleSheet("deliverables", {
      refNo: updated[0].refNo,
      customerName: updated[0].customerName,
      mobile: updated[0].mobile,
      service: updated[0].serviceName,
      amount: updated[0].amount,
      status: updated[0].status,
      completedFileName: updated[0].completedFileName,
      completedFileId: updated[0].completedFileId,
      updatedAt: updated[0].updatedAt.toISOString(),
    });
  }
  await db.insert(auditLogs).values({
    actor: `${session.username} (${session.role})`,
    action: "application.complete",
    detail: `${updated[0]?.refNo ?? applicationId} · ${patch.completedFileName ?? "बिना फाइल"}`,
  });

  return NextResponse.json({ ok: true, application: updated[0] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession();
  if (!session || !canDelete(session.role)) {
    return NextResponse.json({ ok: false, error: "केवल Owner हटा सकता है" }, { status: 403 });
  }
  const { id } = await params;
  await db.delete(applications).where(eq(applications.id, Number(id)));
  await db.insert(auditLogs).values({
    actor: session.username,
    action: "application.delete",
    detail: `ID ${id}`,
  });
  return NextResponse.json({ ok: true });
}
