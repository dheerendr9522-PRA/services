import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  applications,
  bookings,
  categories,
  creditLedger,
  customers,
  expenses,
  feedback,
  invoices,
  offers,
  products,
  profileEvents,
  purchases,
  repairs,
  sales,
  services,
  settings,
  users,
  websites,
} from "@/db/schema";
import { canManage, getStaffSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getStaffSession();
  if (!session || !canManage(session.role)) {
    return NextResponse.json({ ok: false, error: "अनुमति नहीं" }, { status: 403 });
  }
  const tables = {
    services,
    categories,
    websites,
    customers,
    applications,
    repairs,
    invoices,
    expenses,
    products,
    sales,
    purchases,
    creditLedger,
    bookings,
    offers,
    feedback,
    profileEvents,
    users,
    settings,
  } as const;
  const payload: Record<string, unknown> = {
    backupAt: new Date().toISOString(),
    business: "Dheerendra Prajapati Computer Hardware, Software & Digital Seva Kendra",
    version: 2,
  };
  for (const [key, table] of Object.entries(tables)) {
    const rows = (await db.select().from(table as never)) as Record<string, unknown>[];
    payload[key] =
      key === "users"
        ? rows.map((row) => {
            const copy = { ...row };
            delete copy.passwordHash;
            return copy;
          })
        : rows;
  }
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="dp-seva-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
