import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bills, payments } from "@/db/schema";
import { canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import { formatDate, formatINR, statusTone } from "@/lib/utils";
import { Card } from "@/components/ui";
import BackButton from "@/components/BackButton";
import PrintButton from "@/components/PrintButton";
import RecordPaymentForm from "@/components/RecordPaymentForm";

export const dynamic = "force-dynamic";

export default async function BillViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  const { id } = await params;
  const [rows, settings] = await Promise.all([
    db.select().from(bills).where(eq(bills.id, Number(id))).limit(1),
    getSettings(),
  ]);
  const bill = rows[0];
  if (!bill) notFound();
  const paymentRows = await db.select().from(payments).where(eq(payments.billNo, bill.billNo));

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <BackButton />
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/billing" className="text-xs font-bold text-indigo-600 dark:text-indigo-300">← बिलिंग सूची</Link>
        <div className="flex flex-wrap gap-1.5">
          <PrintButton label="🖨 Print Bill" />
          <a href={`/admin/billing?edit=${bill.id}`} className="btn-ghost px-2.5 py-1.5 text-xs">✏️ Edit Bill</a>
          <a href={`/api/bills?download=${bill.id}`} className="btn-ghost px-2.5 py-1.5 text-xs">⬇ Download</a>
          {bill.mobile ? (
            <a href={`https://wa.me/91${bill.mobile}?text=${encodeURIComponent(`आपका बिल ${bill.billNo} — कुल ₹${bill.grandTotal}, बाकी ₹${bill.balanceDue}`)}`} target="_blank" rel="noreferrer" className="btn-ghost px-2.5 py-1.5 text-xs">📤 Share</a>
          ) : null}
          {canManage(session.role) && bill.status !== "Cancelled" ? (
            <form action={`/api/bills/${bill.id}/payment`} method="post" className="inline">
              <Link href={`/admin/billing/${bill.id}?cancel=1`} className="btn-danger px-2.5 py-1.5 text-xs">✕ Cancel Bill</Link>
            </form>
          ) : null}
        </div>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3 dark:border-white/10">
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white">{settings.businessName}</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{settings.address}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">📞 {settings.phonePrimary}, {settings.phoneSecondary} · ✉️ {settings.email}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">💳 UPI: {settings.upiId}</p>
            {bill.gstEnabled && (bill.sellerGstin || bill.gstin) ? (
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">GSTIN: {bill.sellerGstin || bill.gstin}</p>
            ) : null}
            {bill.gstEnabled && bill.customerGstin ? (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">ग्राहक GSTIN: {bill.customerGstin}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Bill / बिल</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{bill.billNo}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDate(bill.createdAt)}</p>
            <span className={`chip mt-1 ${statusTone(bill.status)}`}>{bill.status}</span>
          </div>
        </div>

        <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200">ग्राहक</p>
            <p className="text-slate-500 dark:text-slate-400">{bill.customerName}</p>
            <p className="text-slate-500 dark:text-slate-400">{bill.mobile} {bill.email ? `· ${bill.email}` : ""}</p>
            <p className="text-slate-500 dark:text-slate-400">{bill.address}</p>
          </div>
          <div className="sm:text-right">
            <p className="font-bold text-slate-700 dark:text-slate-200">भुगतान</p>
            <p className="text-slate-500 dark:text-slate-400">{bill.paymentMode}</p>
            <p className="text-slate-500 dark:text-slate-400">कर्मचारी: {bill.staffName || "—"}</p>
          </div>
        </div>

        <table className="mt-3 w-full border-collapse text-xs">
          <thead><tr className="bg-slate-100 text-left dark:bg-white/10"><th className="px-2 py-1.5">आइटम</th><th className="px-2 py-1.5">SKU</th><th className="px-2 py-1.5 text-right">QTY</th><th className="px-2 py-1.5 text-right">दर</th><th className="px-2 py-1.5 text-right">छूट</th><th className="px-2 py-1.5 text-right">कुल</th></tr></thead>
          <tbody>
            {bill.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-100 dark:border-white/5">
                <td className="px-2 py-1.5">{item.name}{item.description ? <span className="block text-[10px] text-slate-400">{item.description}</span> : null}</td>
                <td className="px-2 py-1.5 text-[10px] text-slate-400">{item.sku || "—"}</td>
                <td className="px-2 py-1.5 text-right">{item.qty}</td>
                <td className="px-2 py-1.5 text-right">{formatINR(item.price)}</td>
                <td className="px-2 py-1.5 text-right">{formatINR(item.discount)}</td>
                <td className="px-2 py-1.5 text-right font-bold">{formatINR(item.qty * item.price - item.discount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 ml-auto max-w-xs space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-bold">{formatINR(bill.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">छूट</span><span className="font-bold">-{formatINR(bill.discount)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">टैक्स</span><span className="font-bold">{formatINR(bill.tax)}</span></div>
          {bill.gstEnabled ? (
            <>
              <div className="flex justify-between"><span className="text-slate-500">GST ({bill.gstRate}%) · {bill.gstType === "IGST" ? "IGST" : "CGST+SGST"}</span><span className="font-bold">{formatINR(bill.gstAmount)}</span></div>
              {bill.gstType === "IGST" ? (
                <div className="flex justify-between text-[11px]"><span className="text-slate-400">IGST</span><span>{formatINR(bill.igst)}</span></div>
              ) : (
                <>
                  <div className="flex justify-between text-[11px]"><span className="text-slate-400">CGST</span><span>{formatINR(bill.cgst)}</span></div>
                  <div className="flex justify-between text-[11px]"><span className="text-slate-400">SGST</span><span>{formatINR(bill.sgst)}</span></div>
                </>
              )}
            </>
          ) : (
            <div className="flex justify-between text-[11px] text-slate-400"><span>GST</span><span>लागू नहीं (₹0)</span></div>
          )}
          <div className="flex justify-between border-t border-slate-300 pt-1 dark:border-white/20"><span className="font-extrabold">Grand Total</span><span className="font-extrabold">{formatINR(bill.grandTotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Amount Paid</span><span className="font-bold text-emerald-600 dark:text-emerald-300">{formatINR(bill.amountPaid)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Balance Due</span><span className="font-bold text-rose-600 dark:text-rose-300">{formatINR(bill.balanceDue)}</span></div>
        </div>

        {bill.notes ? <p className="mt-2 rounded-xl bg-slate-50 px-2 py-1.5 text-[11px] text-slate-600 dark:bg-white/5 dark:text-slate-300">नोट: {bill.notes}</p> : null}
        <p className="mt-3 border-t border-dashed border-slate-300 pt-2 text-center text-[10px] text-slate-400">धन्यवाद! यह बिल {settings.businessName} द्वारा जारी किया गया। बिल Footer: {settings.businessHours}</p>
      </Card>

      {canManage(session.role) && bill.balanceDue > 0 ? (
        <Card className="no-print p-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">💳 Record Payment</h2>
          <RecordPaymentForm billId={bill.id} balanceDue={bill.balanceDue} />
        </Card>
      ) : null}

      <Card className="no-print p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">भुगतान इतिहास ({paymentRows.length})</h2>
        <div className="mt-1.5 space-y-1">
          {paymentRows.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-2 py-1 text-[11px] dark:border-white/10">
              <span className="font-bold">{formatINR(payment.amount)} · {payment.paymentMode}</span>
              <span className="text-slate-400">{payment.reference || "—"} · {formatDate(payment.paidAt)}</span>
            </div>
          ))}
          {paymentRows.length === 0 ? <p className="text-xs text-slate-400">कोई भुगतान दर्ज नहीं।</p> : null}
        </div>
      </Card>
    </div>
  );
}
