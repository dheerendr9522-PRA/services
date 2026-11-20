import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationDocuments, auditLogs } from "@/db/schema";
import { canDelete, getStaffSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession();
  if (!session || !canDelete(session.role)) {
    return NextResponse.json({ ok: false, error: "केवल Owner दस्तावेज़ हटा सकता है" }, { status: 403 });
  }
  const { id } = await params;
  await db.delete(applicationDocuments).where(eq(applicationDocuments.id, Number(id)));
  await db.insert(auditLogs).values({
    actor: `${session.username} (${session.role})`,
    action: "document.delete",
    detail: `दस्तावेज़ ID ${id}`,
  });
  return NextResponse.json({ ok: true });
}
