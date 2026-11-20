import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, services } from "@/db/schema";
import { toCsv } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const serviceRows = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
  const service = serviceRows[0];

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.serviceSlug, slug));

  const header = `# ${service?.nameHi ?? slug} | ${service?.nameEn ?? ""} | दुकान शुल्क ₹${service?.shopFee ?? 0} | सरकारी शुल्क ₹${service?.govtFee ?? 0} | अनुमानित समय: ${service?.timeEstimate ?? "—"}`;
  const csv = toCsv(
    ["Ref", "ग्राहक", "मोबाइल", "व्हाट्सएप", "पता", "राशि", "भुगतान", "UTR", "स्थिति", "नोट", "दिनांक"],
    rows.map((a) => [
      a.refNo,
      a.customerName,
      a.mobile,
      a.whatsapp,
      a.address,
      a.amount,
      a.paymentMode,
      a.utr,
      a.status,
      a.notes,
      a.createdAt.toISOString(),
    ]),
  );

  return new Response(`\uFEFF${header}\n${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `inline; filename="${slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
