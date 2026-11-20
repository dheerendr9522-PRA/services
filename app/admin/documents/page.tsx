import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationDocuments, applications, files } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canDelete } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { formatDateTime } from "@/lib/utils";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import ColumnFilterTable from "@/components/ColumnFilter";
import DeleteDocButton from "@/components/DeleteDocButton";
import AdminDocumentUpload from "@/components/AdminDocumentUpload";

export const dynamic = "force-dynamic";
export const metadata = { title: "ग्राहक दस्तावेज़" };

export default async function AdminDocumentsPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();

  const rows = await db
    .select({
      id: applicationDocuments.id,
      docType: applicationDocuments.docType,
      createdAt: applicationDocuments.createdAt,
      uploadedBy: applicationDocuments.uploadedBy,
      comment: applicationDocuments.comment,
      fileId: files.id,
      fileName: files.name,
      fileSize: files.size,
      refNo: applications.refNo,
      customer: applications.customerName,
      mobile: applications.mobile,
      service: applications.serviceName,
      applicationId: applications.id,
    })
    .from(applicationDocuments)
    .innerJoin(files, eq(files.id, applicationDocuments.fileId))
    .innerJoin(applications, eq(applications.id, applicationDocuments.applicationId))
    .orderBy(desc(applicationDocuments.createdAt));

  const completed = await db
    .select({
      id: applications.id,
      refNo: applications.refNo,
      customer: applications.customerName,
      mobile: applications.mobile,
      service: applications.serviceName,
      fileName: applications.completedFileName,
      fileId: applications.completedFileId,
      updatedAt: applications.updatedAt,
    })
    .from(applications)
    .where(eq(applications.status, "Completed"))
    .orderBy(desc(applications.updatedAt));

  const pendingApps = await db
    .select({ id: applications.id, refNo: applications.refNo, customer: applications.customerName, service: applications.serviceName })
    .from(applications)
    .orderBy(desc(applications.createdAt))
    .limit(300);

  const flat = rows.map((row) => ({
    id: row.id,
    docType: row.docType,
    fileName: row.fileName,
    refNo: row.refNo,
    customer: `${row.customer} · ${row.mobile}`,
    mobile: row.mobile,
    service: row.service,
    size: `${Math.max(1, Math.round(row.fileSize / 1024))} KB`,
    uploaded: row.uploadedBy === "customer" ? "ग्राहक" : "दुकान",
    createdAt: row.createdAt.toISOString(),
    fileId: row.fileId,
    applicationId: row.applicationId,
    comment: row.comment ?? "",
  }));

  const doneRows = completed.filter((row) => row.fileId).map((row) => ({
    id: `done-${row.id}`,
    docType: "✅ तैयार दस्तावेज़",
    fileName: row.fileName ?? "—",
    refNo: row.refNo,
    customer: `${row.customer} · ${row.mobile}`,
    mobile: row.mobile,
    service: row.service,
    size: "—",
    uploaded: "दुकान",
    createdAt: row.updatedAt.toISOString(),
    fileId: row.fileId as number,
    applicationId: row.id,
    comment: "",
  }));

  const all = [...doneRows, ...flat];

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="एडमिन · दस्तावेज़"
        title="📎 ग्राहक दस्तावेज़ (कॉलम-वाइज़ फ़िल्टर)"
        subtitle="ऑनलाइन अपलोड हुए सभी दस्तावेज़ — हर कॉलम (प्रकार, फाइल, संदर्भ, ग्राहक, सेवा, आकार, अपलोड, तिथि) पर अलग फ़िल्टर, View/Edit/Download/Print/Delete और ग्राहक-वार ZIP फोल्डर।"
        actions={<Link href="/admin/applications" className="btn-ghost px-3 py-1.5 text-xs">📥 सेवा अनुरोध</Link>}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="📎" label="कुल दस्तावेज़" value={all.length} tone="indigo" />
        <Stat icon="🧑" label="ग्राहक के" value={flat.filter((r) => r.uploaded === "ग्राहक").length} tone="sky" />
        <Stat icon="🏪" label="दुकान के" value={flat.filter((r) => r.uploaded === "दुकान").length} tone="emerald" />
        <Stat icon="✅" label="तैयार दस्तावेज़" value={doneRows.length} tone="amber" />
      </div>

      <Card className="p-3">
        <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">⬆️ दस्तावेज़ जोड़ें (एक साथ कई फाइलें)</h2>
        <AdminDocumentUpload applications={pendingApps} />
      </Card>

      <ColumnFilterTable
        rows={all.map((row) => ({
          id: row.id,
          values: {
            docType: row.docType,
            fileName: row.fileName,
            refNo: row.refNo,
            customer: row.customer,
            service: row.service,
            size: row.size,
            uploaded: row.uploaded,
            createdAt: formatDateTime(row.createdAt as string),
          },
          actions: [
            { label: "👁", href: `/api/files/${row.fileId}` },
            { label: "⬇", href: `/api/files/${row.fileId}` },
            { label: "✏️", href: `/admin/applications/${row.applicationId}` },
          ],
        }))}
        perPage={15}
        columns={[
          { key: "docType", label: "दस्तावेज़ प्रकार", type: "select" },
          { key: "fileName", label: "फाइल" },
          { key: "refNo", label: "संदर्भ", type: "select" },
          { key: "customer", label: "ग्राहक" },
          { key: "service", label: "सेवा", type: "select" },
          { key: "size", label: "आकार" },
          { key: "uploaded", label: "अपलोड", type: "select" },
          { key: "createdAt", label: "तिथि", type: "date" },
        ]}
      />

      <Card className="p-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
        <p className="font-bold text-slate-800 dark:text-slate-100">गोपनीयता</p>
        <p>दस्तावेज़ ग्राहक की सहमति से ही सहेजे जाते हैं और केवल लॉगिन किए एडमिन को दिखते हैं। काम पूरा होने के बाद अनावश्यक दस्तावेज़ हटा दें।</p>
        <p>Google Sheet में केवल फाइल का नाम व लिंक जाता है, फाइल नहीं।</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <a href="/exports/documents.csv" className="btn-ghost px-2.5 py-1.5 text-[11px]">⬇ सभी दस्तावेज़ CSV</a>
          <Link href="/admin/applications" className="btn-ghost px-2.5 py-1.5 text-[11px]">📥 सेवा अनुरोध</Link>
        </div>
      </Card>
    </div>
  );
}
