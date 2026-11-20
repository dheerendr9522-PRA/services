import JSZip from "jszip";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationDocuments, applications, files } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const applicationId = Number(id);
  const rows = await db.select().from(applications).where(eq(applications.id, applicationId)).limit(1);
  const application = rows[0];
  if (!application) return new Response("आवेदन नहीं मिला", { status: 404 });

  const zip = new JSZip();
  zip.file(
    "README.txt",
    [
      `DHEERENDRA PRAJAPATI DIGITAL SEVA KENDRA`,
      `Ref: ${application.refNo}`,
      `Customer: ${application.customerName} (${application.mobile})`,
      `Service: ${application.serviceName}`,
      `Status: ${application.status}`,
      `Amount: ₹${application.amount}`,
      `UTR: ${application.utr || "—"}`,
      "",
      "Bajar Mohalla, Amanganj, Panna, M.P. – 488441",
      "Mobile: 7610420959 / 8962680352 | UPI: dheerendr9522@upi",
    ].join("\n"),
  );

  const docs = await db
    .select({ docType: applicationDocuments.docType, file: files })
    .from(applicationDocuments)
    .innerJoin(files, eq(files.id, applicationDocuments.fileId))
    .where(eq(applicationDocuments.applicationId, applicationId));

  for (const doc of docs) {
    const safeName = `${doc.docType.replace(/[^\w\u0900-\u097F.-]+/g, "_")}-${doc.file.name}`;
    zip.file(safeName, Buffer.from(doc.file.data, "base64"));
  }

  if (application.completedFileId) {
    const completed = await db
      .select()
      .from(files)
      .where(eq(files.id, application.completedFileId))
      .limit(1);
    if (completed[0]) {
      zip.file(`COMPLETED-${completed[0].name}`, Buffer.from(completed[0].data, "base64"));
    }
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${application.refNo}-documents.zip"`,
    },
  });
}
