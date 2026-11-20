import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { canDelete } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { getApplicationDocuments } from "@/lib/queries";
import { formatDateTime, formatINR, statusTone } from "@/lib/utils";
import { Card } from "@/components/ui";
import BackButton from "@/components/BackButton";
import ApplicationActions from "@/components/ApplicationActions";
import ApplicationEditForm from "@/components/ApplicationEditForm";
import FolderButton from "@/components/FolderButton";
import ResendDocsForm from "@/components/ResendDocsForm";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function AdminApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  const { id } = await params;
  const rows = await db.select().from(applications).where(eq(applications.id, Number(id))).limit(1);
  const app = rows[0];
  if (!app) notFound();
  const documents = await getApplicationDocuments([app.id]);

  return (
    <div className="space-y-3">
      <BackButton />
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/applications" className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
          ← सेवा अनुरोध सूची
        </Link>
        <div className="flex flex-wrap gap-1.5">
          <FolderButton refNo={app.refNo} mobile={app.mobile} />
          <a href={`/api/applications/${app.id}/zip`} className="btn-ghost px-2.5 py-1.5 text-[11px]">
            ⬇ सभी दस्तावेज़ (ZIP)
          </a>
          <PrintButton label="🖨 Print / PDF" />
          <Link href={`/service/${app.serviceSlug}`} className="btn-ghost px-2.5 py-1.5 text-[11px]">
            🔗 सेवा पेज
          </Link>
        </div>
      </div>

      <ApplicationEditForm
        application={{
          id: app.id,
          refNo: app.refNo,
          customerName: app.customerName,
          mobile: app.mobile,
          whatsapp: app.whatsapp ?? "",
          guardianName: app.guardianName ?? "",
          address: app.address ?? "",
          email: app.email ?? "",
          familyId: app.familyId ?? "",
          serviceName: app.serviceName,
          status: app.status,
          amount: app.amount,
          govtFee: app.govtFee,
          paidAmount: app.paidAmount,
          paymentMode: app.paymentMode,
          paymentVerify: app.paymentVerify,
          utr: app.utr ?? "",
          notes: app.notes ?? "",
          adminNote: app.adminNote ?? "",
          customerQuery: app.customerQuery ?? "",
          serviceDate: app.serviceDate ? app.serviceDate.toISOString().slice(0, 10) : "",
          followUpDate: app.followUpDate ? app.followUpDate.toISOString().slice(0, 10) : "",
          estCompletion: app.estCompletion ? app.estCompletion.toISOString().slice(0, 10) : "",
        }}
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-2 dark:border-white/10">
          <div>
            <p className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-300">{app.refNo}</p>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">{app.serviceName}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {app.customerName} · {app.mobile} · {formatDateTime(app.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <span className={`chip ${statusTone(app.status)}`}>{app.status}</span>
            <p className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-300">{formatINR(app.amount)}</p>
            <p className="text-[10px] text-slate-400">{app.paymentMode}{app.utr ? ` · ${app.utr}` : ""}</p>
          </div>
        </div>

        <div className="mt-2 grid gap-1.5 text-xs sm:grid-cols-2">
          {[
            ["व्हाट्सएप", app.whatsapp || "—"],
            ["पिता/पति", app.guardianName || "—"],
            ["पता", app.address || "—"],
            ["ईमेल", app.email || "—"],
            ["समग्र आईडी", app.familyId || "—"],
            ["सरकारी शुल्क", formatINR(app.govtFee)],
            ["ग्राहक नोट", app.notes || "—"],
            ["एडमिन नोट", app.adminNote || "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 px-2.5 py-1.5 dark:border-white/10">
              <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
          ))}
        </div>

        {Object.keys(app.formData ?? {}).length > 0 ? (
          <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50/50 p-2 dark:border-indigo-400/20 dark:bg-indigo-500/10">
            <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100">📋 सेवा-विशेष जानकारी</p>
            <div className="mt-1 grid gap-1 sm:grid-cols-2">
              {Object.entries(app.formData ?? {}).map(([key, value]) => (
                <p key={key} className="text-[11px] text-slate-600 dark:text-slate-300"><b>{key}</b>: {String(value)}</p>
              ))}
            </div>
          </div>
        ) : null}
        {(app.servicesList ?? []).length > 1 ? (
          <div className="mt-2 rounded-xl bg-indigo-50 px-2 py-1.5 dark:bg-indigo-500/10">
            <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100">🧩 मास्टर आवेदन — {app.servicesList.length} सेवाएँ</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {app.servicesList.map((item) => (
                <span key={item.slug} className="chip bg-white text-indigo-700 dark:bg-white/10 dark:text-indigo-300">{item.nameHi} · ₹{item.fee}</span>
              ))}
            </div>
          </div>
        ) : null}

        {(app.relatedTasks ?? []).length > 0 ? (
          <p className="mt-2 rounded-xl bg-emerald-50 px-2 py-1.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            ➕ साथ के कार्य: {(app.relatedTasks ?? []).join(", ")}
          </p>
        ) : null}

        <div className="mt-3">
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">📎 ग्राहक दस्तावेज़ ({documents.length})</p>
          <div className="mt-1 grid gap-1.5 sm:grid-cols-2">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={`/api/files/${doc.fileId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] hover:border-indigo-300 dark:border-white/10"
              >
                <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{doc.docType}</span>
                <span className="shrink-0 text-slate-400">{doc.fileName}</span>
              </a>
            ))}
            {documents.length === 0 ? <p className="text-[11px] text-slate-400">कोई दस्तावेज़ अपलोड नहीं।</p> : null}
          </div>
        </div>

        {app.completedFileId ? (
          <a href={`/api/files/${app.completedFileId}`} className="btn-primary mt-3 px-3 py-1.5 text-xs">
            ⬇ तैयार दस्तावेज़ ({app.completedFileName})
          </a>
        ) : null}

        <div className="no-print mt-3">
          <ResendDocsForm applicationId={app.id} refNo={app.refNo} />
          <ApplicationActions
            application={{
              id: app.id,
              refNo: app.refNo,
              status: app.status,
              adminNote: app.adminNote,
              amount: app.amount,
              completedFileId: app.completedFileId,
              completedFileName: app.completedFileName,
              documentCount: documents.length,
            }}
            canDelete={canDelete(session.role)}
          />
        </div>
      </Card>
    </div>
  );
}
