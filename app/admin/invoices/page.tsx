import Link from "next/link";
import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { getInvoices, getServices } from "@/lib/queries";
import { formatDate, formatINR, statusTone } from "@/lib/utils";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import ColumnFilterTable from "@/components/ColumnFilter";
import DataManager, { type Row } from "@/components/DataManager";
import { resourceConfigs } from "@/lib/resources";
import { db } from "@/db";
import { products } from "@/db/schema";
import InvoiceBuilder from "@/components/InvoiceBuilder";

export const dynamic = "force-dynamic";
export const metadata = { title: "इनवॉइस" };

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const params = await searchParams;
  const editId = typeof params.edit === "string" ? Number(params.edit) : 0;
  const [invoices, services, productRows] = await Promise.all([
    getInvoices(500),
    getServices({ limit: 500 }),
    db.select().from(products),
  ]);
  const editing = editId ? invoices.find((invoice) => invoice.id === editId) : null;
  const paid = invoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + i.total, 0);
  const outstanding = invoices.filter((i) => i.status !== "Paid").reduce((sum, i) => sum + i.total, 0);

  const rows = invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    customerName: invoice.customerName,
    mobile: invoice.mobile,
    items: `${invoice.items.length} आइटम`,
    total: invoice.total,
    amountPaid: invoice.amountPaid,
    balance: Math.max(0, invoice.total - invoice.amountPaid),
    gst: invoice.gstEnabled ? `GST ${invoice.gstRate}% · ₹${invoice.gstAmount}` : "GST नहीं",
    status: invoice.status,
    createdAt: invoice.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="🧾 Invoice module"
        title="💳 इनवॉइस (Multi-Item + GST)"
        subtitle="बिल बिल्डर की तरह पूरा इनवॉइस — मेन्यू से सेवा चुनें या नया Item Type लिखें, QTY/दर/छूट/टैक्स, With/Without GST, CGST+SGST या IGST, Save/Edit/Print/PDF।"
        actions={<Link href="/admin/billing" className="btn-ghost px-3 py-1.5 text-xs">🧾 बिल बिल्डर</Link>}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="🧾" label="कुल इनवॉइस" value={invoices.length} tone="indigo" />
        <Stat icon="💰" label="प्राप्त" value={formatINR(paid)} tone="emerald" />
        <Stat icon="⏳" label="बाकी" value={formatINR(outstanding)} tone="rose" />
        <Stat icon="📊" label="GST इनवॉइस" value={invoices.filter((i) => i.gstEnabled).length} tone="amber" />
      </div>

      {canManage(session.role) ? (
        <InvoiceBuilder
          products={productRows.map((p) => ({ code: p.code ?? "", name: p.name, sellPrice: p.sellPrice }))}
          services={services.map((service) => ({
            slug: service.slug, nameHi: service.nameHi, nameEn: service.nameEn, shopFee: service.shopFee,
            govtFee: service.govtFee, bookingFee: service.bookingFee, documents: service.documents ?? [],
            serviceMode: service.serviceMode ?? "shop", categoryNameHi: service.categoryNameHi,
            categorySlug: service.categorySlug, categoryIcon: service.categoryIcon, timeEstimate: service.timeEstimate,
          }))}
          initial={editing ? {
            id: editing.id, invoiceNo: editing.invoiceNo, customerName: editing.customerName, mobile: editing.mobile,
            items: editing.items.map((item) => ({ label: item.label, description: item.description ?? "", sku: item.sku ?? "", qty: item.qty, rate: item.rate, discount: item.discount ?? 0, tax: item.tax ?? 0 })),
            discount: editing.discount, tax: editing.tax, amountPaid: editing.amountPaid, paymentMode: editing.paymentMode,
            notes: editing.notes ?? "", dueDate: editing.dueDate ? editing.dueDate.toISOString().slice(0, 10) : "",
            gstEnabled: editing.gstEnabled, gstRate: editing.gstRate, gstType: editing.gstType,
            sellerGstin: editing.gstin ?? "", customerGstin: editing.customerGstin ?? "",
          } : null}
        />
      ) : (
        <Card className="p-3 text-xs font-semibold text-amber-700 dark:text-amber-300">⚠️ इनवॉइस बनाने की अनुमति केवल Owner/Manager के पास है।</Card>
      )}

      <Card className="p-3">
        <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">📋 सभी इनवॉइस — हर कॉलम पर फ़िल्टर</h2>
        <ColumnFilterTable
          rows={rows.map((row) => ({
            id: row.id,
            values: {
              invoiceNo: row.invoiceNo,
              customerName: row.customerName,
              mobile: row.mobile,
              items: row.items,
              gst: row.gst,
              total: formatINR(row.total),
              amountPaid: formatINR(row.amountPaid),
              status: row.status,
              createdAt: row.createdAt,
            },
            actions: [
              { label: "👁 View", href: `/admin/invoices/${row.id}` },
              { label: "✏️ Edit", href: `/admin/invoices?edit=${row.id}` },
              { label: "🖨 Print", href: `/admin/invoices/${row.id}` },
            ],
          }))}
          perPage={12}
          columns={[
            { key: "invoiceNo", label: "इनवॉइस" },
            { key: "customerName", label: "ग्राहक" },
            { key: "mobile", label: "मोबाइल" },
            { key: "items", label: "आइटम" },
            { key: "gst", label: "GST", type: "select" },
            { key: "total", label: "कुल", type: "number" },
            { key: "amountPaid", label: "प्राप्त", type: "number" },
            { key: "status", label: "स्थिति", type: "select" },
            { key: "createdAt", label: "दिनांक", type: "date" },
          ]}
        />
      </Card>

      <Card className="p-3">
        <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">⚙️ इनवॉइस डेटा तालिका (Edit/Delete अनुमति सहित)</h2>
        <DataManager
          resource="invoices"
          label="इनवॉइस"
          rows={JSON.parse(JSON.stringify(invoices)) as Row[]}
          columns={resourceConfigs.invoices.columns}
          fields={resourceConfigs.invoices.fields}
          canCreate={canManage(session.role)}
          canDelete={canDelete(session.role)}
          searchPlaceholder="इनवॉइस / ग्राहक खोजें…"
        />
      </Card>
    </div>
  );
}
