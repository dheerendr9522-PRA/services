import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, bookings, notifications } from "@/db/schema";
import { autoSyncRow } from "@/lib/sheets";
import { canManage, getStaffSession } from "@/lib/auth";
import { insertResourceRow, listResourceRows, preparePayload, resourceConfigs, type AnyRecord } from "@/lib/resources";

export const dynamic = "force-dynamic";

function sanitize(resource: string, row: AnyRecord | undefined): AnyRecord | undefined {
  if (!row) return row;
  if (resource === "users") {
    const copy = { ...row };
    delete copy.passwordHash;
    return copy;
  }
  return row;
}

export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ ok: false, error: "लॉगिन आवश्यक" }, { status: 401 });
  const { resource } = await params;
  const config = resourceConfigs[resource];
  if (!config) return NextResponse.json({ ok: false, error: "अज्ञात संसाधन" }, { status: 404 });
  const url = new URL(request.url);
  const rows = await listResourceRows(config, url.searchParams.get("q") ?? undefined);
  return NextResponse.json({ ok: true, rows: rows.map((row) => sanitize(resource, row)) });
}

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const session = await getStaffSession();
  if (!session || !canManage(session.role)) {
    return NextResponse.json({ ok: false, error: "अनुमति नहीं" }, { status: 403 });
  }
  const { resource } = await params;
  const config = resourceConfigs[resource];
  if (!config) return NextResponse.json({ ok: false, error: "अज्ञात संसाधन" }, { status: 404 });
  if (!config.allowCreate) return NextResponse.json({ ok: false, error: "यहाँ नया जोड़ा नहीं जा सकता" }, { status: 403 });
  if (resource === "users" && session.role !== "owner") {
    return NextResponse.json({ ok: false, error: "केवल Owner यूज़र जोड़ सकता है" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const payload = preparePayload(config, body, true);
  if (resource === "users" && !payload.passwordHash) {
    payload.passwordHash = (await import("@/lib/auth")).hashPassword("Shop@2026");
  }
  try {
    let row: AnyRecord | undefined;
    try {
      row = await insertResourceRow(config, payload);
    } catch (insertError) {
      const message = insertError instanceof Error ? insertError.message : "";
      if (message.includes("duplicate key") && typeof payload.slug === "string") {
        row = await insertResourceRow(config, { ...payload, slug: `${payload.slug}-${Date.now().toString(36).slice(-4)}` });
      } else {
        throw insertError;
      }
    }
    if (resource === "bookings" && row) {
      const refNo = `BK-${3000 + Number(row.id)}`;
      await db.update(bookings).set({ refNo }).where((await import("drizzle-orm")).eq(bookings.id, Number(row.id)));
      row.refNo = refNo;
    }
    if (row) {
      const stamp = new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
      const push: Record<string, (string | number | null)[]> = {
        customers: [String(row.name ?? ""), String(row.mobile ?? ""), String(row.address ?? ""), String(row.village ?? ""), String(row.email ?? ""), row.active ? "ON" : "OFF", stamp],
        repairs: [String(row.jobNo ?? ""), String(row.customerName ?? ""), String(row.mobile ?? ""), String(row.device ?? ""), String(row.issue ?? ""), String(row.technician ?? ""), Number(row.estimate ?? 0), Number(row.finalAmount ?? 0), String(row.status ?? ""), stamp],
        invoices: [String(row.invoiceNo ?? ""), String(row.customerName ?? ""), String(row.mobile ?? ""), "", Number(row.discount ?? 0), Number(row.tax ?? 0), Number(row.total ?? 0), String(row.paymentMode ?? ""), String(row.status ?? ""), stamp],
        expenses: [Number(row.id ?? 0), String(row.title ?? ""), String(row.category ?? ""), Number(row.amount ?? 0), String(row.paidTo ?? ""), String(row.note ?? ""), stamp],
        sales: [String(row.billNo ?? ""), String(row.customerName ?? ""), String(row.mobile ?? ""), String(row.itemName ?? ""), Number(row.qty ?? 0), Number(row.rate ?? 0), Number(row.amount ?? 0), String(row.paymentMode ?? ""), String(row.status ?? ""), stamp],
        bookings: [String(row.refNo ?? ""), String(row.serviceName ?? ""), String(row.customerName ?? ""), String(row.mobile ?? ""), Number(row.fee ?? 0), String(row.status ?? ""), stamp],
      };
      if (push[resource]) void autoSyncRow(resource, push[resource]);
    }
    if (resource === "offers" && row) {
      await db.insert(notifications).values({
        audience: "all",
        title: `🎉 नया ऑफर: ${String(row.title ?? "")}`,
        body: `${String(row.discount ?? "")} — ${String(row.detail ?? "").slice(0, 110)}`,
      });
    }
    await db.insert(auditLogs).values({
      actor: `${session.username} (${session.role})`,
      action: `${resource}.create`,
      detail: JSON.stringify(payload).slice(0, 240),
    });
    return NextResponse.json({ ok: true, row: sanitize(resource, row) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "सहेजने में त्रुटि" }, { status: 400 });
  }
}
