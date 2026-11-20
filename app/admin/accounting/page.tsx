import Link from "next/link";
import { db } from "@/db";
import { bookings, creditLedger, products, purchases, sales } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { canDelete, canManage } from "@/lib/auth";
import { requireStaff } from "@/lib/guard";
import { formatINR, statusTone } from "@/lib/utils";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import DataManager, { type Row } from "@/components/DataManager";
import { resourceConfigs } from "@/lib/resources";

export const dynamic = "force-dynamic";
export const metadata = { title: "बिलिंग एवं अकाउंटिंग" };

export default async function AdminAccountingPage() {
  await ensureSeeded().catch(() => undefined);
  const session = await requireStaff();
  const [productRows, salesRows, purchaseRows, creditRows, bookingRows] = await Promise.all([
    db.select().from(products),
    db.select().from(sales),
    db.select().from(purchases),
    db.select().from(creditLedger),
    db.select().from(bookings),
  ]);

  const today = new Date().toDateString();
  const monthKey = new Date().toISOString().slice(0, 7);
  const todaySales = salesRows.filter((s) => s.soldAt.toDateString() === today);
  const monthSales = salesRows.filter((s) => s.soldAt.toISOString().slice(0, 7) === monthKey);
  const outstanding = creditRows.reduce((sum, c) => sum + Math.max(0, c.totalAmount - c.paidAmount), 0);
  const lowStock = productRows.filter((p) => p.stock <= p.minStock);
  const gross = monthSales.reduce((sum, s) => sum + s.amount, 0);
  const cogs = purchaseRows.filter((p) => p.purchasedAt.toISOString().slice(0, 7) === monthKey).reduce((sum, p) => sum + p.amount, 0);
  const bookingRevenue = bookingRows.reduce((sum, b) => sum + b.fee, 0);

  const asRows = (list: unknown[]) => JSON.parse(JSON.stringify(list)) as Row[];

  return (
    <div className="space-y-4">
      <BackButton />
      <PageHeader
        eyebrow="🧮 Billing & Accounting module"
        title="बिलिंग एवं अकाउंटिंग सहायता"
        subtitle="अलग मॉड्यूल — कंप्यूटराइज्ड बिलिंग, स्टॉक, बिक्री-खरीद, ग्राहक उधारी, सेवा बुकिंग व रिपोर्ट। सब कुछ इसी ऐप में सुरक्षित।"
        actions={
          <>
            <Link href="/api/backup" className="btn-ghost px-3 py-1.5 text-xs">💾 बैकअप</Link>
            <Link href="/accounting" className="btn-primary px-3 py-1.5 text-xs">🌐 पब्लिक बुकिंग पेज</Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Stat icon="💰" label="आज की बिक्री" value={formatINR(todaySales.reduce((s, r) => s + r.amount, 0))} hint={`${todaySales.length} बिल`} tone="emerald" />
        <Stat icon="📈" label="इस माह बिक्री" value={formatINR(gross)} hint={`${monthSales.length} बिल`} tone="indigo" />
        <Stat icon="🛒" label="इस माह खरीद" value={formatINR(cogs)} tone="amber" />
        <Stat icon="📉" label="अनुमानित सकल लाभ" value={formatINR(gross - cogs)} hint="बिक्री − खरीद (अनुमान)" tone="sky" />
        <Stat icon="⏳" label="कुल बकाया" value={formatINR(outstanding)} hint={`${creditRows.filter((c) => c.totalAmount > c.paidAmount).length} ग्राहक`} tone="rose" />
        <Stat icon="📦" label="कम स्टॉक" value={lowStock.length} hint={`${productRows.length} उत्पाद`} tone="amber" />
      </div>

      {lowStock.length > 0 ? (
        <Card className="border-amber-300 p-2.5 text-[11px] font-semibold text-amber-800 dark:border-amber-400/30 dark:text-amber-200">
          ⚠️ कम स्टॉक चेतावनी: {lowStock.map((p) => `${p.name} (${p.stock})`).join(" · ")}
        </Card>
      ) : null}

      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">📅 सेवा बुकिंग ({bookingRows.length})</h2>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {bookingRows.slice(0, 6).map((booking) => (
            <div key={booking.id} className="rounded-xl border border-slate-200 p-2 dark:border-white/10">
              <div className="flex items-center justify-between gap-1">
                <p className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-300">{booking.refNo || `BK-${booking.id}`}</p>
                <span className={`chip ${statusTone(booking.status)}`}>{booking.status}</span>
              </div>
              <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{booking.serviceName}</p>
              <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{booking.customerName} · {booking.mobile} · {formatINR(booking.fee)}</p>
            </div>
          ))}
          {bookingRows.length === 0 ? <p className="text-xs text-slate-400">कोई बुकिंग नहीं।</p> : null}
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">कुल बुकिंग शुल्क: {formatINR(bookingRevenue)} · स्थिति नीचे बुकिंग तालिका से बदलें।</p>
      </Card>

      <div className="space-y-4">
        <section>
          <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">1️⃣ कंप्यूटराइज्ड बिलिंग व बिक्री (Sales & Purchase)</h2>
          <DataManager resource="sales" label="बिक्री बिल" rows={asRows(salesRows)} columns={resourceConfigs.sales.columns} fields={resourceConfigs.sales.fields} canCreate={canManage(session.role)} canDelete={canDelete(session.role)} searchPlaceholder="बिल / ग्राहक / सामान खोजें…" />
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">2️⃣ स्टॉक मैनेजमेंट (Inventory)</h2>
          <DataManager resource="products" label="उत्पाद" rows={asRows(productRows)} columns={resourceConfigs.products.columns} fields={resourceConfigs.products.fields} canCreate={canManage(session.role)} canDelete={canDelete(session.role)} searchPlaceholder="उत्पाद / कोड खोजें…" />
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">3️⃣ खरीद रिकॉर्ड (Purchases)</h2>
          <DataManager resource="purchases" label="खरीद" rows={asRows(purchaseRows)} columns={resourceConfigs.purchases.columns} fields={resourceConfigs.purchases.fields} canCreate={canManage(session.role)} canDelete={canDelete(session.role)} searchPlaceholder="सप्लायर / सामान खोजें…" />
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">4️⃣ ग्राहक उधारी व भुगतान (Credit Ledger)</h2>
          <DataManager resource="credit" label="उधारी" rows={asRows(creditRows)} columns={resourceConfigs.credit.columns} fields={resourceConfigs.credit.fields} canCreate={canManage(session.role)} canDelete={canDelete(session.role)} searchPlaceholder="ग्राहक / मोबाइल खोजें…" />
        </section>

        <section>
          <h2 className="mb-1.5 text-sm font-extrabold text-slate-900 dark:text-white">5️⃣ सेवा बुकिंग प्रबंधन</h2>
          <DataManager resource="bookings" label="बुकिंग" rows={asRows(bookingRows)} columns={resourceConfigs.bookings.columns} fields={resourceConfigs.bookings.fields} canCreate={canManage(session.role)} canDelete={canDelete(session.role)} searchPlaceholder="ID / ग्राहक / सेवा खोजें…" />
        </section>
      </div>

      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">📊 अलग रिपोर्ट डाउनलोड</h2>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["sales", "बिक्री CSV"],
            ["purchases", "खरीद CSV"],
            ["products", "स्टॉक CSV"],
            ["credit", "उधारी CSV"],
            ["bookings", "बुकिंग CSV"],
            ["expenses", "खर्च CSV"],
            ["invoices", "इनवॉइस CSV"],
            ["audit", "ऑडिट लॉग CSV"],
          ].map(([type, label]) => (
            <a key={type} href={`/exports/${type}.csv`} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold hover:border-indigo-300 dark:border-white/10">
              <span>{label}</span>
              <span className="text-emerald-600 dark:text-emerald-300">⬇</span>
            </a>
          ))}
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">लाभ की गणना में खरीद लागत, स्टॉक व अन्य समायोजन ध्यान रखें — बिक्री को सीधे शुद्ध लाभ न मानें।</p>
      </Card>
    </div>
  );
}
