import JSZip from "jszip";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationDocuments, applications, files } from "@/db/schema";
import { getStaffSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getStaffSession();
  if (!session) return new Response("लॉगिन आवश्यक", { status: 401 });
  const mobile = (new URL(request.url).searchParams.get("mobile") ?? "").replace(/\D/g, "");
  if (mobile.length !== 10) return new Response("मोबाइल अमान्य", { status: 400 });

  const apps = await db.select().from(applications).where(eq(applications.mobile, mobile));
  if (apps.length === 0) return new Response("इस ग्राहक का कोई आवेदन नहीं", { status: 404 });

  const zip = new JSZip();
  zip.file(
    "README.txt",
    [
      "DHEERENDRA PRAJAPATI DIGITAL SEVA KENDRA — ग्राहक फोल्डर",
      `मोबाइल: ${mobile}`,
      `कुल आवेदन: ${apps.length}`,
      "",
      ...apps.map((app) => `${app.refNo} | ${app.customerName} | ${app.serviceName} | ₹${app.amount} | ${app.status} | ${app.createdAt.toLocaleString("en-IN")}`),
      "",
      "Bajar Mohalla, Amanganj, Panna (M.P.) 488441 · 7610420959",
    ].join("\n"),
  );

  let count = 0;
  for (const app of apps) {
    const docs = await db
      .select({ docType: applicationDocuments.docType, file: files })
      .from(applicationDocuments)
      .innerJoin(files, eq(files.id, applicationDocuments.fileId))
      .where(eq(applicationDocuments.applicationId, app.id));
    const folder = zip.folder(app.refNo) ?? zip;
    folder.file(
      "application.txt",
      [
        `Ref: ${app.refNo}`,
        `Customer: ${app.customerName} (${app.mobile})`,
        `Service: ${app.serviceName}`,
        `Status: ${app.status}`,
        `Amount: ₹${app.amount} | Paid: ₹${app.paidAmount} | Mode: ${app.paymentMode} | UTR: ${app.utr || "—"}`,
        `Address: ${app.address || "—"}`,
        `Query: ${app.customerQuery || "—"}`,
        `Admin Note: ${app.adminNote || "—"}`,
      ].join("\n"),
    );
    docs.forEach((doc, index) => {
      folder.file(`${String(index + 1).padStart(2, "0")}-${doc.docType.replace(/[^\w\u0900-\u097F.-]+/g, "_")}-${doc.file.name}`, Buffer.from(doc.file.data, "base64"));
      count += 1;
    });
    if (app.completedFileId) {
      const completed = await db.select().from(files).where(eq(files.id, app.completedFileId)).limit(1);
      if (completed[0]) {
        folder.file(`COMPLETED-${completed[0].name}`, Buffer.from(completed[0].data, "base64"));
        count += 1;
      }
    }
  }

  zip.file("documents-list.txt", `कुल फाइलें: ${count}\n` + apps.map((a) => `${a.refNo} — ${a.serviceName}`).join("\n"));
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="customer-${mobile}-folder.zip"`,
    },
  });
}
