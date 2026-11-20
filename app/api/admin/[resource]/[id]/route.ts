import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { canDelete, canManage, getStaffSession } from "@/lib/auth";
import { deleteResourceRow, preparePayload, resourceConfigs, updateResourceRow, type AnyRecord } from "@/lib/resources";

function sanitize(resource: string, row: AnyRecord | undefined): AnyRecord | undefined {
  if (!row) return row;
  if (resource === "users") {
    const copy = { ...row };
    delete copy.passwordHash;
    return copy;
  }
  return row;
}

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ resource: string; id: string }> },
) {
  const session = await getStaffSession();
  if (!session || !canManage(session.role)) {
    return NextResponse.json({ ok: false, error: "अनुमति नहीं" }, { status: 403 });
  }
  const { resource, id } = await params;
  const config = resourceConfigs[resource];
  if (!config) return NextResponse.json({ ok: false, error: "अज्ञात संसाधन" }, { status: 404 });
  if (resource === "users" && session.role !== "owner") {
    return NextResponse.json({ ok: false, error: "केवल Owner यूज़र बदल सकता है" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const payload = preparePayload(config, body, false);
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ ok: true, row: null });
  }
  try {
    const row = await updateResourceRow(config, Number(id), payload);
    await db.insert(auditLogs).values({
      actor: `${session.username} (${session.role})`,
      action: `${resource}.update`,
      detail: `ID ${id}`,
    });
    return NextResponse.json({ ok: true, row: sanitize(resource, row) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "अपडेट त्रुटि" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ resource: string; id: string }> },
) {
  const session = await getStaffSession();
  if (!session || !canDelete(session.role)) {
    return NextResponse.json({ ok: false, error: "केवल Owner हटा सकता है" }, { status: 403 });
  }
  const { resource, id } = await params;
  const config = resourceConfigs[resource];
  if (!config) return NextResponse.json({ ok: false, error: "अज्ञात संसाधन" }, { status: 404 });
  if (!config.allowDelete) {
    return NextResponse.json({ ok: false, error: "यहाँ हटाने की अनुमति नहीं" }, { status: 403 });
  }
  if (resource === "users" && Number(id) === session.id) {
    return NextResponse.json({ ok: false, error: "अपना खाता नहीं हटा सकते" }, { status: 400 });
  }
  await deleteResourceRow(config, Number(id));
  await db.insert(auditLogs).values({
    actor: session.username,
    action: `${resource}.delete`,
    detail: `ID ${id}`,
  });
  return NextResponse.json({ ok: true });
}
