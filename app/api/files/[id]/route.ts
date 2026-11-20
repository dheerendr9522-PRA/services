import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { files } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fileId = Number(id);
  if (!Number.isFinite(fileId)) return NextResponse.json({ error: "अमान्य" }, { status: 400 });
  const rows = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  const file = rows[0];
  if (!file) return NextResponse.json({ error: "फाइल नहीं मिली" }, { status: 404 });
  const buffer = Buffer.from(file.data, "base64");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": file.mime || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
