import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationDocuments, applications, auditLogs, files } from "@/db/schema";
import { getCustomerSession, getStaffSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function loadDoc(id: number) {
  const rows = await db.select().from(applicationDocuments).where(eq(applicationDocuments.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ ok: false, error: "कस्टमर लॉगिन आवश्यक" }, { status: 401 });
  const { id } = await params;
  const doc = await loadDoc(Number(id));
  if (!doc) return NextResponse.json({ ok: false, error: "दस्तावेज़ नहीं मिला" }, { status: 404 });
  const mine = await db.select().from(applications).where(and(eq(applications.id, doc.applicationId), eq(applications.mobile, session.mobile))).limit(1);
  if (!mine[0]) return NextResponse.json({ ok: false, error: "यह दस्तावेज़ आपका नहीं है" }, { status: 403 });
  if (doc.uploadedBy !== "customer") return NextResponse.json({ ok: false, error: "दुकान द्वारा दिया दस्तावेज़ यहाँ से नहीं बदला जा सकता" }, { status: 403 });

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("docFile") as File | null;
    const docType = String(form.get("docType") ?? doc.docType);
    if (!file || file.size === 0) return NextResponse.json({ ok: false, error: "नई फाइल चुनें" }, { status: 400 });
    if (file.size < 5 * 1024 || file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "फाइल 5 KB–100 MB के बीच होनी चाहिए" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const inserted = await db.insert(files).values({ name: file.name || "document", mime: file.type || "application/octet-stream", size: file.size, data: buffer.toString("base64") }).returning({ id: files.id });
    await db.update(applicationDocuments).set({ fileId: inserted[0]!.id, docType, version: doc.version + 1 }).where(eq(applicationDocuments.id, doc.id));
    await db.insert(auditLogs).values({ actor: `customer:${session.mobile}`, action: "document.replace", detail: `ID ${doc.id} → v${doc.version + 1}` });
    return NextResponse.json({ ok: true, version: doc.version + 1 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  if (typeof body.docType === "string" && body.docType.trim()) patch.docType = body.docType.trim();
  if (typeof body.comment === "string") patch.comment = body.comment;
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: false, error: "कोई बदलाव नहीं" }, { status: 400 });
  await db.update(applicationDocuments).set(patch).where(eq(applicationDocuments.id, doc.id));
  await db.insert(auditLogs).values({ actor: `customer:${session.mobile}`, action: "document.edit", detail: `ID ${doc.id}` });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const customer = await getCustomerSession();
  const staff = await getStaffSession();
  if (!customer && !staff) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });
  const { id } = await params;
  const doc = await loadDoc(Number(id));
  if (!doc) return NextResponse.json({ ok: false, error: "दस्तावेज़ नहीं मिला" }, { status: 404 });

  if (customer) {
    const mine = await db.select().from(applications).where(and(eq(applications.id, doc.applicationId), eq(applications.mobile, customer.mobile))).limit(1);
    if (!mine[0]) return NextResponse.json({ ok: false, error: "यह दस्तावेज़ आपका नहीं है" }, { status: 403 });
    if (doc.uploadedBy !== "customer") return NextResponse.json({ ok: false, error: "दुकान द्वारा दिया दस्तावेज़ नहीं हटाया जा सकता" }, { status: 403 });
  } else if (staff && staff.role !== "owner" && staff.role !== "manager") {
    return NextResponse.json({ ok: false, error: "अनुमति नहीं" }, { status: 403 });
  }

  await db.delete(applicationDocuments).where(eq(applicationDocuments.id, doc.id));
  await db.insert(auditLogs).values({ actor: customer ? `customer:${customer.mobile}` : staff?.username ?? "staff", action: "document.delete", detail: `ID ${doc.id}` });
  return NextResponse.json({ ok: true });
}
