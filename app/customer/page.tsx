import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureSeeded } from "@/db/seed";
import { getCustomerSession, getStaffSession } from "@/lib/auth";
import { getApplicationDocuments, getApplications } from "@/lib/queries";
import { db } from "@/db";
import { bills, repairs } from "@/db/schema";
import { formatDateTime, formatINR, statusTone } from "@/lib/utils";
import { eq } from "drizzle-orm";
import CustomerDocumentUpload from "@/components/CustomerDocumentUpload";
import DocumentManager, { type DocItem } from "@/components/DocumentManager";
import { Badge, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import PrintButton from "@/components/PrintButton";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "मेरे आवेदन — कस्टमर पोर्टल" };

export default async function CustomerPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await ensureSeeded().catch(() => undefined);
  const session = await getCustomerSession();
  if (!session) redirect("/customer/login");
  const staff = await getStaffSession();
  const { tab = "applications" } = await searchParams;

  const applications = await getApplications({ mobile: session.mobile });
  const documents = await getApplicationDocuments(applications.map((a) => a.id));
  const [myBills, allRepairs] = await Promise.all([
    db.select().from(bills).where(eq(bills.mobile, session.mobile)).catch(() => []),
    db.select().from(repairs).where(eq(repairs.mobile, session.mobile)).catch(() => []),
  ]);
  const outstanding = myBills.reduce((sum, bill) => sum + bill.balanceDue, 0);
  const customerDocs = documents.filter((doc) => !applications.some((app) => app.completedFileId === doc.fileId));
  const finalDocs = applications.filter((app) => app.completedFileId);
  const completed = applications.filter((a) => a.status === "Completed");
  const pending = applications.filter((a) => a.status !== "Completed");

  const tabs = [
    { key: "applications", label: "मेरे आवेदन", count: applications.length },
    { key: "repairs", label: "रिपेयर जॉब", count: allRepairs.length },
    { key: "bills", label: "मेरे बिल", count: myBills.length },
    { key: "documents", label: "मेरे दस्तावेज़", count: documents.length },
    { key: "completed", label: "तैयार दस्तावेज़", count: finalDocs.length },
    { key: "receipts", label: "रसीद प्रिंट", count: myBills.length + applications.length },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Customer account"
        title={`नमस्ते, ${session.name}`}
        subtitle={`Customer ID: DP-C-${session.mobile.slice(-6)} · मोबाइल: ${session.mobile} · आपके सभी आवेदन, बिल, रिपेयर व दस्तावेज़ यहाँ सुरक्षित हैं।`}
        actions={
          <>
            <Link href="/services" className="btn-primary px-3 py-1.5 text-xs">+ नई सेवा</Link>
            <Link href="/customer/business" className="btn-ghost px-3 py-1.5 text-xs">🏪 मेरा बिज़नेस प्रोफाइल</Link>
            <Link href="/track" className="btn-ghost px-3 py-1.5 text-xs">📍 ट्रैक</Link>
            {staff ? <Link href="/admin" className="btn-ghost px-3 py-1.5 text-xs">📋 एडमिन</Link> : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat icon="📁" label="कुल आवेदन" value={applications.length} tone="indigo" />
        <Stat icon="⏳" label="प्रगति में" value={pending.length} tone="amber" />
        <Stat icon="✅" label="पूर्ण" value={completed.length} tone="emerald" />
        <Stat icon="🛠️" label="रिपेयर जॉब" value={allRepairs.length} tone="sky" />
        <Stat icon="⏳" label="बकाया राशि" value={formatINR(outstanding)} hint={`${documents.length} दस्तावेज़`} tone="rose" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">📤 नया दस्तावेज़ भेजें</h2>
          <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">
            आवेदन चुनें, टिप्पणी लिखें, कई फाइलें (JPG/PNG/WEBP/PDF/Word/Excel/PowerPoint) चुनें — प्रति फाइल 5 KB–100 MB — फिर सहमति देकर अपलोड करें।
          </p>
          {applications.length > 0 ? (
            <CustomerDocumentUpload applications={applications.map((app) => ({ refNo: app.refNo, serviceName: app.serviceName }))} />
          ) : (
            <p className="rounded-xl bg-slate-50 px-2 py-2 text-[11px] text-slate-500 dark:bg-white/5 dark:text-slate-400">दस्तावेज़ भेजने के लिए पहले कोई सेवा आवेदन जमा करें।</p>
          )}
        </Card>
        <Card className="p-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🔐 सुरक्षा व गोपनीयता</h2>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            <li>आप केवल अपने रिकॉर्ड व दस्तावेज़ देख सकते हैं।</li>
            <li>दुकान द्वारा दिए दस्तावेज़ आप हटा नहीं सकते।</li>
            <li>OTP, PIN या पासवर्ड कभी न भेजें।</li>
            <li>पूरा आधार/पैन नंबर फॉर्म में न लिखें।</li>
          </ul>
          <Link href="/customer/business" className="btn-soft mt-2 w-full px-2 py-1.5 text-[11px]">🏪 अपना बिज़नेस प्रोफाइल बनाएँ</Link>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <BackButton label="Back" href="/" />
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={`/customer?tab=${item.key}`}
            className={`chip ${tab === item.key ? "bg-indigo-600 text-white" : "bg-white text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}
          >
            {item.label} ({item.count})
          </Link>
        ))}
      </div>

      {tab === "repairs" ? (
        allRepairs.length === 0 ? <EmptyState icon="🛠️" title="कोई रिपेयर जॉब नहीं" description="रिपेयर जॉब दुकान द्वारा दर्ज होने पर यहाँ दिखेगा।" /> : (
          <div className="space-y-2">
            {allRepairs.map((job) => (
              <Card key={job.id} className="flex flex-wrap items-start justify-between gap-2 p-3">
                <div>
                  <p className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-300">{job.jobNo}</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{job.device}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{job.issue} · {formatDateTime(job.createdAt)}</p>
                </div>
                <div className="text-right">
                  <span className={`chip ${statusTone(job.status)}`}>{job.status}</span>
                  <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-200">{formatINR(job.finalAmount || job.estimate)}</p>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : null}

      {tab === "bills" ? (
        myBills.length === 0 ? <EmptyState icon="🧾" title="कोई बिल नहीं" description="दुकान से बिल बनने पर यहाँ दिखेगा व रसीद प्रिंट हो सकेगी।" /> : (
          <div className="space-y-2">
            {myBills.map((bill) => (
              <Card key={bill.id} className="flex flex-wrap items-start justify-between gap-2 p-3">
                <div>
                  <p className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-300">{bill.billNo}</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatINR(bill.grandTotal)} · {bill.paymentMode}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{bill.items.length} आइटम · जमा {formatINR(bill.amountPaid)} · बाकी {formatINR(bill.balanceDue)} · {formatDateTime(bill.createdAt)}</p>
                </div>
                <span className={`chip ${statusTone(bill.status)}`}>{bill.status}</span>
              </Card>
            ))}
          </div>
        )
      ) : null}

      {tab === "documents" ? (
        <Card className="p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">📎 मेरे दस्तावेज़ ({documents.length})</h2>
            <span className="text-[10px] text-slate-400">View · Edit · Replace · Delete · Download · Print</span>
          </div>
          <DocumentManager
            documents={documents.map((doc) => ({
              id: doc.id, docType: doc.docType, fileId: doc.fileId, fileName: doc.fileName, fileSize: doc.fileSize,
              comment: doc.comment ?? "", uploadedBy: doc.uploadedBy ?? "staff", serviceSlug: doc.serviceSlug ?? "",
              version: 1, createdAt: formatDateTime(doc.createdAt),
            })) as DocItem[]}
          />
        </Card>
      ) : null}

      {applications.length === 0 && tab !== "repairs" && tab !== "bills" && tab !== "documents" ? (
        <EmptyState
          icon="📭"
          title="अभी कोई आवेदन नहीं"
          description="कोई सेवा चुनें और आवेदन जमा करें — ट्रैकिंग नंबर तुरंत मिलेगा।"
          action={
            <Link href="/services" className="btn-primary mt-2 px-3 py-1.5 text-xs">
              सेवाएँ देखें
            </Link>
          }
        />
      ) : tab === "applications" || tab === "completed" || tab === "receipts" ? (
        <div className="space-y-2.5">
          {applications
            .filter((app) => (tab === "completed" ? app.status === "Completed" : true))
            .map((app) => {
              const appDocs = documents.filter((doc) => doc.applicationId === app.id);
              return (
                <Card key={app.id} className="p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-300">{app.refNo}</p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">{app.serviceName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDateTime(app.createdAt)} · भुगतान: {app.paymentMode} · ₹{app.amount}
                        {app.utr ? ` · UTR ${app.utr}` : ""}
                      </p>
                    </div>
                    <Badge tone={app.status === "Completed" ? "emerald" : app.status === "Pending" ? "amber" : "sky"}>
                      {app.status}
                    </Badge>
                  </div>

                  {app.adminNote ? (
                    <p className="mt-2 rounded-xl bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600 dark:bg-white/5 dark:text-slate-300">
                      दुकान नोट: {app.adminNote}
                    </p>
                  ) : null}

                  {(app.relatedTasks ?? []).length > 0 ? (
                    <p className="mt-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      साथ के कार्य: {(app.relatedTasks ?? []).join(", ")}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {appDocs.length > 0 ? (
                      <a href={`/api/applications/${app.id}/zip`} className="btn-ghost px-2.5 py-1 text-[11px]">
                        📦 मेरे दस्तावेज़ (ZIP)
                      </a>
                    ) : null}
                    {app.completedFileId ? (
                      <a href={`/api/files/${app.completedFileId}`} className="btn-primary px-2.5 py-1 text-[11px]">
                        ⬇️ तैयार दस्तावेज़ डाउनलोड
                      </a>
                    ) : (
                      <span className="chip bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400">
                        तैयार दस्तावेज़ अभी अपलोड नहीं
                      </span>
                    )}
                    <PrintButton label="🖨️ रसीद प्रिंट" />
                  </div>

                  {tab === "receipts" ? (
                    <div className="mt-2 rounded-xl border border-dashed border-slate-300 p-2.5 text-[11px] dark:border-white/15">
                      <p className="font-bold text-slate-700 dark:text-slate-200">रसीद — {app.refNo}</p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {app.customerName} · {app.mobile} · {app.serviceName} · ₹{app.amount} · {app.paymentMode} ·
                        स्थिति {app.status}
                      </p>
                    </div>
                  ) : null}
                </Card>
              );
            })}
          {tab === "completed" && completed.length === 0 ? (
            <EmptyState
              icon="⏳"
              title="अभी कोई तैयार दस्तावेज़ नहीं"
              description="काम पूरा होने पर एडमिन तैयार दस्तावेज़ अपलोड करेगा और आप उसे यहाँ से डाउनलोड कर सकेंगे।"
            />
          ) : null}
        </div>
      ) : null}

      <div className="no-print">
        <BackButton label="पिछला मेन्यू" href="/" />
      </div>

      <Card className="p-3">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">दुकान सहायता</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          किसी भी सहायता के लिए 📞 7610420959 पर कॉल करें या WhatsApp करें। समय: सोम–शनि, 9:30 AM – 8:00 PM.
        </p>
      </Card>
    </div>
  );
}
