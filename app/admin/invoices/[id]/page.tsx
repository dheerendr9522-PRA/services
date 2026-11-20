import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { requireStaff } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import { formatDate, formatINR } from "@/lib/utils";
import PrintButton from "@/components/PrintButton";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";

export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const rows = await db.select().from(invoices).where(eq(invoices.id, Number(id))).limit(1);
  const invoice = rows[0];
  if (!invoice) notFound();
  const settings = await getSettings();
  const subtotal = invoice.items.reduce((sum, item) => sum + item.qty * item.rate - (item.discount ?? 0), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <BackButton />
          <Link href={`/admin/invoices?edit=${invoice.id}`} className="btn-ghost px-2.5 py-1.5 text-xs">✏️ Edit</Link>
        </div>
        <div className="flex gap-1.5">
          <PrintButton label="🖨 Print / PDF" />
          {invoice.mobile ? (
            <a href={`https://wa.me/91${invoice.mobile}?text=${encodeURIComponent(`इनवॉइस ${invoice.invoiceNo} — कुल ₹${invoice.total} (बाकी ₹${Math.max(0, invoice.total - invoice.amountPaid)})`)}`} target="_blank" rel="noreferrer" className="btn-ghost px-2.5 py-1.5 text-xs">📤 Share</a>
          ) : null}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3 dark:border-white/10">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">{settings.businessName}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{settings.address}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">📞 {settings.phonePrimary}, {settings.phoneSecondary} · ✉️ {settings.email}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">💳 UPI: {settings.upiId}</p>
            {invoice.gstEnabled && invoice.gstin ? <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">GSTIN: {invoice.gstin}</p> : null}
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Tax Invoice / इनवॉइस</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{invoice.invoiceNo}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(invoice.createdAt)}</p>
            {invoice.dueDate ? <p className="text-xs text-slate-500 dark:text-slate-400">देय: {formatDate(invoice.dueDate)}</p> : null}
            <span className="chip mt-1 bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200">{invoice.status}</span>
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200">ग्राहक</p>
            <p className="text-slate-500 dark:text-slate-400">{invoice.customerName}</p>
            <p className="text-slate-500 dark:text-slate-400">📞 {invoice.mobile}</p>
            {invoice.customerGstin ? <p className="text-slate-500 dark:text-slate-400">GSTIN: {invoice.customerGstin}</p> : null}
          </div>
          <div className="sm:text-right">
            <p className="font-bold text-slate-700 dark:text-slate-200">भुगतान</p>
            <p className="text-slate-500 dark:text-slate-400">{invoice.paymentMode} · प्राप्त {formatINR(invoice.amountPaid)}</p>
            <p className="text-slate-500 dark:text-slate-400">बाकी {formatINR(Math.max(0, invoice.total - invoice.amountPaid))}</p>
          </div>
        </div>

        <table className="mt-3 w-full border-collapse text-xs">
          <thead><tr className="bg-slate-100 text-left dark:bg-white/10"><th className="px-2 py-1.5">आइटम / सेवा</th><th className="px-2 py-1.5 text-right">QTY</th><th className="px-2 py-1.5 text-right">दर</th><th className="px-2 py-1.5 text-right">छूट</th><th className="px-2 py-1.5 text-right">राशि</th></tr></thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-100 dark:border-white/5">
                <td className="px-2 py-1.5">{item.label}{item.description ? <span className="block text-[10px] text-slate-400">{item.description}</span> : null}</td>
                <td className="px-2 py-1.5 text-right">{item.qty}</td>
                <td className="px-2 py-1.5 text-right">{formatINR(item.rate)}</td>
                <td className="px-2 py-1.5 text-right">{formatINR(item.discount ?? 0)}</td>
                <td className="px-2 py-1.5 text-right font-bold">{formatINR(item.qty * item.rate - (item.discount ?? 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 ml-auto max-w-xs space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-bold">{formatINR(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">छूट</span><span className="font-bold">-{formatINR(invoice.discount)}</span></div>
          {invoice.gstEnabled ? (
            <>
              <div className="flex justify-between"><span className="text-slate-500">GST {invoice.gstRate}%</span><span className="font-bold">{formatINR(invoice.gstAmount)}</span></div>
              {invoice.gstType === "IGST" ? (
                <div className="flex justify-between text-[11px]"><span className="text-slate-400">IGST</span><span>{formatINR(invoice.igst)}</span></div>
              ) : (
                <>
                  <div className="flex justify-between text-[11px]"><span className="text-slate-400">CGST</span><span>{formatINR(invoice.cgst)}</span></div>
                  <div className="flex justify-between text-[11px]"><span className="text-slate-400">SGST</span><span>{formatINR(invoice.sgst)}</span></div>
                </>
              )}
            </>
          ) : <div className="flex justify-between text-[11px] text-slate-400"><span>GST</span><span>लागू नहीं (₹0)</span></div>}
          <div className="flex justify-between"><span className="text-slate-500">अन्य टैक्स</span><span className="font-bold">{formatINR(invoice.tax)}</span></div>
          <div className="flex justify-between border-t border-slate-300 pt-1 text-sm dark:border-white/20"><span className="font-extrabold">Grand Total</span><span className="font-extrabold">{formatINR(invoice.total)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="font-bold text-emerald-600 dark:text-emerald-300">{formatINR(invoice.amountPaid)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Balance</span><span className="font-bold text-rose-600 dark:text-rose-300">{formatINR(Math.max(0, invoice.total - invoice.amountPaid))}</span></div>
        </div>

        {invoice.notes ? <p className="mt-2 rounded-xl bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600 dark:bg-white/5 dark:text-slate-300">नोट / शर्तें: {invoice.notes}</p> : null}
        <p className="mt-3 border-t border-dashed border-slate-300 pt-2 text-center text-[10px] text-slate-400">
          धन्यवाद! यह इनवॉइस {settings.businessName} द्वारा जारी किया गया। सरकारी शुल्क प्रतिपूर्ति नहीं होती; GST नियमानुसार लागू।
        </p>
      </div>
    </div>
  );
}
