import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { syncLogs } from "@/db/schema";
import { getStaffSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });
  const rows = await db.select().from(syncLogs).orderBy(desc(syncLogs.createdAt)).limit(100);
  return NextResponse.json({ ok: true, logs: rows });
}

export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const queue = Array.isArray(body.queue) ? (body.queue as Record<string, unknown>[]) : [];
  const results: { key: string; ok: boolean; message: string }[] = [];

  for (const entry of queue) {
    const entity = String(entry.entity ?? "");
    const key = String(entry.key ?? "");
    try {
      const payload = (entry.payload ?? {}) as Record<string, unknown>;
      if (entity === "bill") {
        const response = await fetch(new URL("/api/bills", request.url), {
          method: "POST",
          headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") ?? "" },
          body: JSON.stringify({ ...payload, offlineKey: key, device: String(body.device ?? "web") }),
        });
        const json = (await response.json()) as { ok?: boolean; error?: string; bill?: { billNo?: string } };
        if (!response.ok || !json.ok) throw new Error(json.error || "बिल सिंक विफल");
        results.push({ key, ok: true, message: `बिल ${json.bill?.billNo ?? ""} सिंक हुआ` });
      } else if (entity === "application") {
        results.push({ key, ok: true, message: "आवेदन ड्राफ्ट सर्वर पर सुरक्षित — पूर्ण सबमिशन दुकान से करें" });
        await db.insert(syncLogs).values({ entity, offlineKey: key, status: "synced", message: "draft-only", payload, device: String(body.device ?? "web") });
      } else {
        results.push({ key, ok: false, message: "अज्ञात रिकॉर्ड प्रकार" });
        await db.insert(syncLogs).values({ entity, offlineKey: key, status: "failed", message: "unknown entity", payload });
      }
    } catch (error) {
      results.push({ key, ok: false, message: error instanceof Error ? error.message : "सिंक विफल" });
      await db.insert(syncLogs).values({ entity, offlineKey: key, status: "failed", message: error instanceof Error ? error.message : "sync error", payload: entry.payload as Record<string, unknown> });
    }
  }
  return NextResponse.json({ ok: true, results });
}
