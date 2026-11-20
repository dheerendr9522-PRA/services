import { NextResponse } from "next/server";
import { db } from "@/db";
import { files } from "@/db/schema";
import { getStaffSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "फॉर्म त्रुटि" }, { status: 400 });
  const file = form.get("file") as File | null;
  if (!file || file.size === 0) return NextResponse.json({ ok: false, error: "फाइल चुनें" }, { status: 400 });
  if (file.size > 100 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "फाइल 100MB से कम होनी चाहिए" }, { status: 400 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const inserted = await db
    .insert(files)
    .values({
      name: file.name || "upload",
      mime: file.type || "application/octet-stream",
      size: file.size,
      data: buffer.toString("base64"),
    })
    .returning({ id: files.id });
  return NextResponse.json({ ok: true, url: `/api/files/${inserted[0]?.id}`, id: inserted[0]?.id });
}
