import Link from "next/link";
import { ensureSeeded } from "@/db/seed";
import { canDelete } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { getApplicationDocuments, getApplications, getCategories } from "@/lib/queries";
import { matchesFilters, matchesQuery, parseFilters, filterLabel } from "@/lib/filters";
import { getServices } from "@/lib/queries";
import { formatDateTime, formatINR, statusTone } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import ApplicationActions from "@/components/ApplicationActions";
import AdminFilterBar from "@/components/AdminFilterBar";
import ColumnFilterTable from "@/components/ColumnFilter";
import ResendDocsForm from "@/components/ResendDocsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "सेवा अनुरोध" };

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const params = await searchParams;
  const filters = parseFilters(params);
  const status = typeof params.status === "string" ? params.status : "";

  const [all, categories] = await Promise.all([getApplications({ limit: 500 }), getCategories(false)]);
  const selectedCategory = typeof params.category === "string" ? params.category : "";
  const categorySlugs = selectedCategory
    ? (await getServices({ categoryId: Number(selectedCategory), limit: 400, activeOnly: false })).map((s) => s.slug)
    : [];
  const documents = await getApplicationDocuments(all.map((a) => a.id));
  const applications = all.filter(
    (app) =>
      matchesFilters(app.createdAt, filters) &&
      matchesQuery([app.refNo, app.customerName, app.mobile, app.serviceName, app.status], filters.q) &&
      (!status || app.status === status) &&
      (!selectedCategory || categorySlugs.includes(app.serviceSlug ?? "")),
  );
  const statuses = ["", "Pending", "In Progress", "Completed", "Rejected"];

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="एडमिन · सेवा अनुरोध"
        title={`📥 सेवा अनुरोध (${applications.length})`}
        subtitle="सभी ग्राहक आवेदन — स्थिति, भुगतान, दस्तावेज़ व तैयार फाइल। View, Download, Print, Edit, Delete सभी जगह उपलब्ध।"
        actions={
          <Link href="/admin/settings" className="btn-ghost px-3 py-1.5 text-xs">
            ⚙️ सेटिंग्स
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="📥" label="कुल" value={all.length} tone="indigo" />
        <Stat icon="⏳" label="Pending" value={all.filter((a) => a.status === "Pending").length} tone="amber" />
        <Stat icon="🔄" label="In Progress" value={all.filter((a) => a.status === "In Progress").length} tone="sky" />
        <Stat icon="✅" label="Completed" value={all.filter((a) => a.status === "Completed").length} tone="emerald" />
      </div>

      <AdminFilterBar
        label="दिनांक / समय"
        searchPlaceholder="Ref / नाम / मोबाइल / सेवा खोजें…"
        exportHref="/exports/applications.csv"
        categories={categories.map((c) => ({ value: String(c.id), label: `${c.icon} ${c.nameHi}` }))}
      />

      <div className="flex flex-wrap gap-1.5">
        {statuses.map((item) => (
          <Link
            key={item || "all"}
            href={`/admin/applications${item ? `?status=${encodeURIComponent(item)}` : ""}`}
            className={`chip ${status === item ? "bg-indigo-600 text-white" : "bg-white text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}
          >
            {item || "सभी स्थिति"}
          </Link>
        ))}
        <Badge tone="slate">{filterLabel(filters)}</Badge>
      </div>

      <Card className="p-3">
        <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">📋 सभी अनुरोध — हर कॉलम पर फ़िल्टर</h2>
        <ColumnFilterTable
          rows={applications.map((app) => ({
            id: app.id,
            values: {
              refNo: app.refNo,
              customerName: app.customerName,
              mobile: app.mobile,
              serviceName: app.serviceName,
              status: app.status,
              amount: formatINR(app.amount),
              paymentMode: app.paymentMode,
              docs: documents.filter((d) => d.applicationId === app.id).length,
              createdAt: formatDateTime(app.createdAt),
            },
            actions: [
              { label: "👁 View", href: `/admin/applications/${app.id}` },
              { label: "⬇ ZIP", href: `/api/applications/${app.id}/zip` },
              { label: "🖨 Print", href: `/admin/applications/${app.id}` },
            ],
          }))}
          perPage={12}
          columns={[
            { key: "refNo", label: "संदर्भ" },
            { key: "customerName", label: "ग्राहक" },
            { key: "mobile", label: "मोबाइल" },
            { key: "serviceName", label: "सेवा", type: "select" },
            { key: "status", label: "स्थिति", type: "select" },
            { key: "amount", label: "राशि" },
            { key: "paymentMode", label: "भुगतान", type: "select" },
            { key: "docs", label: "दस्तावेज़", type: "number" },
            { key: "createdAt", label: "दिनांक", type: "date" },
          ]}
        />
      </Card>

      {applications.length === 0 ? (
        <EmptyState icon="📭" title="कोई अनुरोध नहीं मिला" description="फ़िल्टर बदलें या ग्राहक से नया आवेदन जमा करवाएँ।" />
      ) : (
        <div className="space-y-2">
          {applications.map((app) => {
            const docCount = documents.filter((d) => d.applicationId === app.id).length;
            return (
              <Card key={app.id} className="p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] font-extrabold text-indigo-600 dark:text-indigo-300">{app.refNo}</span>
                      <span className={`chip ${statusTone(app.status)}`}>{app.status}</span>
                      <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">📎 {docCount}</span>
                      <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        {formatINR(app.amount)} · {app.paymentMode}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">{app.serviceName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {app.customerName} · {app.mobile} · {app.whatsapp || "—"} · {app.utr ? `UTR ${app.utr}` : "UTR —"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatDateTime(app.createdAt)} · {app.address || "पता नहीं"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Link href={`/admin/applications/${app.id}`} className="btn-ghost px-2 py-1 text-[11px]">
                      👁 View
                    </Link>
                    <a href={`/api/applications/${app.id}/zip`} className="btn-ghost px-2 py-1 text-[11px]">
                      ⬇ Download
                    </a>
                    <Link href={`/admin/applications/${app.id}?print=1`} className="btn-ghost px-2 py-1 text-[11px]">
                      🖨 Print
                    </Link>
                  </div>
                </div>
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
                    documentCount: docCount,
                  }}
                  canDelete={canDelete(session.role)}
                />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
