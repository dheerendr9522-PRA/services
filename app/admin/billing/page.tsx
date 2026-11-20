import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { bills, payments, products } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { filterLabel, matchesFilters, matchesQuery, parseFilters } from "@/lib/filters";
import { formatDateTime, formatINR, statusTone } from "@/lib/utils";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import AdminFilterBar from "@/components/AdminFilterBar";
import BillBuilder, { type BillRow } from "@/components/BillBuilder";

export const dynamic = "force-dynamic";
export const metadata = { title: "बिलिंग एवं अकाउंटिंग — बिल" };

const STATUS_TABS = ["", "Paid", "Partially Paid", "Unpaid", "Cancelled", "Draft"];

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const params = await searchParams;
  const filters = parseFilters(params);
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const editId = typeof params.edit === "string" ? Number(params.edit) : 0;

  const [billRows, productRows, paymentRows] = await Promise.all([
    db.select().from(bills).orderBy(desc(bills.createdAt)),
    db.select().from(products),
    db.select().from(payments).orderBy(desc(payments.paidAt)).limit(20),
  ]);

  const filtered = billRows.filter(
    (bill) =>
      matchesFilters(bill.createdAt, filters) &&
      matchesQuery([bill.billNo, bill.customerName, bill.mobile, bill.status], filters.q) &&
      (!statusFilter || bill.status === statusFilter),
  );
  const paid = billRows.filter((b) => b.status === "Paid").reduce((sum, b) => sum + b.amountPaid, 0);
  const due = billRows.reduce((sum, b) => sum + b.balanceDue, 0);
  const today = new Date().toDateString();
  const editBill = editId ? billRows.find((b) => b.id === editId) : null;
  const productList = productRows.filter((p) => p.active).map((p) => ({ code: p.code ?? "", name: p.name, sellPrice: p.sellPrice, stock: p.stock }));

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="🧮 Billing & Accounting"
        title="बिलिंग एवं अकाउंटिंग — बिल बिल्डर"
        subtitle="Multi-item बिल बनाएँ, प्रिंट/PDF, भुगतान दर्ज करें, बिल रद्द करें। बिक्री पर स्टॉक अपने-आप घटता है और Google Sheet/CSV में रिकॉर्ड जाता है।"
        actions={<Link href="/admin/accounting" className="btn-ghost px-3 py-1.5 text-xs">🧮 स्टॉक · खरीद · उधारी</Link>}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="🧾" label="कुल बिल" value={billRows.length} tone="indigo" />
        <Stat icon="💰" label="प्राप्त" value={formatINR(paid)} tone="emerald" />
        <Stat icon="⏳" label="बाकी" value={formatINR(due)} tone="rose" />
        <Stat icon="📅" label="आज के बिल" value={billRows.filter((b) => b.createdAt.toDateString() === today).length} tone="amber" />
      </div>

      {canManage(session.role) ? (
        <BillBuilder products={productList} staffName={session.name} editing={(editBill ? JSON.parse(JSON.stringify(editBill)) : null) as BillRow | null} />
      ) : (
        <Card className="p-3 text-xs font-semibold text-amber-700 dark:text-amber-300">⚠️ बिल बनाने की अनुमति केवल Owner/Manager के पास है।</Card>
      )}

      <AdminFilterBar label="बिल दिनांक / समय" searchPlaceholder="बिल / ग्राहक / मोबाइल खोजें…" exportHref="/exports/bills.csv" />
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <Link key={tab || "all"} href={`/admin/billing${tab ? `?status=${encodeURIComponent(tab)}` : ""}`} className={`chip ${statusFilter === tab ? "bg-indigo-600 text-white" : "bg-white text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
            {tab || "सभी बिल"}
          </Link>
        ))}
        <span className="chip bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">{filterLabel(filters)}</span>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="table-base">
          <thead><tr><th>बिल</th><th>ग्राहक</th><th>आइटम</th><th>कुल</th><th>जमा</th><th>बाकी</th><th>भुगतान</th><th>स्थिति</th><th>क्रिया</th></tr></thead>
          <tbody>
            {filtered.map((bill) => (
              <tr key={bill.id}>
                <td className="whitespace-nowrap"><span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-300">{bill.billNo}</span><br /><span className="text-[10px] text-slate-400">{formatDateTime(bill.createdAt)}</span></td>
                <td>{bill.customerName}<br /><span className="text-[10px] text-slate-400">{bill.mobile}</span></td>
                <td className="text-[11px]">{bill.items.length} आइटम<br /><span className="text-[10px] text-slate-400">{bill.items.map((i) => i.name).join(", ").slice(0, 40)}</span></td>
                <td className="font-bold">{formatINR(bill.grandTotal)}</td>
                <td className="text-emerald-600 dark:text-emerald-300">{formatINR(bill.amountPaid)}</td>
                <td className="text-rose-600 dark:text-rose-300">{formatINR(bill.balanceDue)}</td>
                <td className="text-[11px]">{bill.paymentMode}</td>
                <td><span className={`chip ${statusTone(bill.status)}`}>{bill.status}</span></td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    <Link href={`/admin/billing/${bill.id}`} className="btn-ghost px-1.5 py-1 text-[10px]">👁 View</Link>
                    <Link href={`/admin/billing?edit=${bill.id}`} className="btn-soft px-1.5 py-1 text-[10px]">✏️ Edit</Link>
                    <Link href={`/admin/billing/${bill.id}?download=1`} className="btn-ghost px-1.5 py-1 text-[10px]">⬇ PDF</Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? <tr><td colSpan={9} className="py-8 text-center text-xs text-slate-400">कोई बिल नहीं मिला — ऊपर नया बिल बनाएँ।</td></tr> : null}
          </tbody>
        </table>
      </Card>

      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">💳 हाल के भुगतान</h2>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {paymentRows.map((payment) => (
            <div key={payment.id} className="rounded-xl border border-slate-200 px-2 py-1.5 text-[11px] dark:border-white/10">
              <p className="font-bold text-slate-800 dark:text-slate-100">{payment.billNo} · {formatINR(payment.amount)}</p>
              <p className="text-slate-500 dark:text-slate-400">{payment.customerName} · {payment.paymentMode} · {formatDateTime(payment.paidAt)}</p>
            </div>
          ))}
          {paymentRows.length === 0 ? <p className="text-xs text-slate-400">कोई भुगतान दर्ज नहीं।</p> : null}
        </div>
      </Card>
    </div>
  );
}
