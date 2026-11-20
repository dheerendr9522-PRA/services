"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Item = { name: string; sku: string; description: string; qty: number; price: number; discount: number; tax: number };

const emptyItem: Item = { name: "", sku: "", description: "", qty: 1, price: 0, discount: 0, tax: 0 };

export type BillRow = {
  id: number;
  billNo: string;
  customerName: string;
  mobile: string | null;
  address: string | null;
  email: string | null;
  staffName: string | null;
  items: Item[];
  discount: number;
  tax: number;
  amountPaid: number;
  grandTotal: number;
  balanceDue: number;
  paymentMode: string;
  status: string;
  notes: string | null;
  isDraft: boolean;
};

export default function BillBuilder({
  products,
  staffName,
  editing,
}: {
  products: { code: string; name: string; sellPrice: number; stock: number }[];
  staffName: string;
  editing?: BillRow | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(editing?.items?.length ? editing.items : [{ ...emptyItem }]);
  const [gst, setGst] = useState({ enabled: false, rate: 18, type: "CGST_SGST", gstin: "", sellerGstin: "", customerGstin: "" });
  const [form, setForm] = useState({
    customerName: editing?.customerName ?? "",
    mobile: editing?.mobile ?? "",
    address: editing?.address ?? "",
    email: editing?.email ?? "",
    paymentMode: editing?.paymentMode ?? "Cash",
    amountPaid: String(editing?.amountPaid ?? 0),
    discount: String(editing?.discount ?? 0),
    tax: String(editing?.tax ?? 0),
    notes: editing?.notes ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastBill, setLastBill] = useState<{ id: number; billNo: string } | null>(null);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0) - Number(item.discount || 0), 0);
    const itemTax = items.reduce((sum, item) => sum + Number(item.tax || 0), 0);
    const taxable = Math.max(0, subtotal - Number(form.discount || 0));
    const gstAmount = gst.enabled ? Math.round((taxable * Number(gst.rate || 0)) / 100) : 0;
    const cgst = gst.enabled && gst.type !== "IGST" ? Math.round(gstAmount / 2) : 0;
    const sgst = gst.enabled && gst.type !== "IGST" ? gstAmount - cgst : 0;
    const igst = gst.enabled && gst.type === "IGST" ? gstAmount : 0;
    const grandTotal = Math.max(0, taxable + itemTax + Number(form.tax || 0) + gstAmount);
    const paid = Number(form.amountPaid || 0);
    return { subtotal, grandTotal, balance: Math.max(0, grandTotal - paid), gstAmount, cgst, sgst, igst };
  }, [items, form.discount, form.tax, form.amountPaid, gst]);

  useEffect(() => {
    if (!editing) return;
    setItems(editing.items?.length ? editing.items : [{ ...emptyItem }]);
    setForm({
      customerName: editing.customerName,
      mobile: editing.mobile ?? "",
      address: editing.address ?? "",
      email: editing.email ?? "",
      paymentMode: editing.paymentMode,
      amountPaid: String(editing.amountPaid),
      discount: String(editing.discount),
      tax: String(editing.tax),
      notes: editing.notes ?? "",
    });
  }, [editing]);

  const setItem = (index: number, key: keyof Item, value: string) =>
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: key === "name" || key === "sku" || key === "description" ? value : Number(value) || 0 } : item)),
    );

  const pickProduct = (index: number, code: string) => {
    const product = products.find((p) => p.code === code);
    if (!product) return;
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, name: product.name, sku: product.code, price: product.sellPrice } : item)));
  };

  async function save(isDraft: boolean) {
    setBusy(true);
    setError("");
    setMessage("");
    const validItems = items.filter((item) => item.name.trim());
    if (validItems.length === 0) {
      setError("कम से कम एक आइटम का नाम भरें");
      setBusy(false);
      return;
    }
    if (!form.customerName.trim()) {
      setError("ग्राहक का नाम आवश्यक है");
      setBusy(false);
      return;
    }
    const payload = {
      id: editing?.id,
      billNo: editing?.billNo,
      customerName: form.customerName,
      mobile: form.mobile,
      address: form.address,
      email: form.email,
      staffName,
      items: validItems,
      discount: Number(form.discount || 0),
      tax: Number(form.tax || 0),
      amountPaid: Number(form.amountPaid || 0),
      paymentMode: form.paymentMode,
      notes: form.notes,
      gstEnabled: gst.enabled,
      gstRate: Number(gst.rate),
      gstType: gst.type,
      gstin: gst.gstin,
      sellerGstin: gst.sellerGstin,
      customerGstin: gst.customerGstin,
      isDraft,
    };
    const response = await fetch("/api/bills", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      const json = (await response?.json().catch(() => null)) as { error?: string } | null;
      setError(json?.error ?? "बिल सहेजा नहीं जा सका");
      return;
    }
    const json = (await response.json()) as { bill?: { id: number; billNo: string } };
    setLastBill(json.bill ?? null);
    setMessage(isDraft ? "✅ ड्राफ्ट सुरक्षित हो गया" : `✅ बिल ${json.bill?.billNo ?? ""} सहेजा गया`);
    if (!editing) {
      setItems([{ ...emptyItem }]);
      setForm({ customerName: "", mobile: "", address: "", email: "", paymentMode: "Cash", amountPaid: "0", discount: "0", tax: "0", notes: "" });
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {editing ? `✏️ बिल ${editing.billNo} संपादित करें` : "🧾 नया बिल बनाएँ"}
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">बिल नंबर स्वतः जनरेट होगा · कर्मचारी: {staffName}</span>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <div><label className="label">ग्राहक का नाम *</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="input py-1.5 text-xs" placeholder="ग्राहक का नाम" /></div>
          <div><label className="label">मोबाइल</label><input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="input py-1.5 text-xs" inputMode="numeric" /></div>
          <div><label className="label">भुगतान प्रकार</label>
            <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} className="input py-1.5 text-xs">
              {["Cash", "UPI", "Bank Transfer", "Credit", "Other"].map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className="label">पता</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input py-1.5 text-xs" /></div>
          <div><label className="label">ईमेल (वैकल्पिक)</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input py-1.5 text-xs" /></div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">आइटम ({items.length})</h3>
          <button type="button" onClick={() => setItems((prev) => [...prev, { ...emptyItem }])} className="btn-primary px-2.5 py-1.5 text-[11px]">➕ Add Item</button>
        </div>
        <div className="mt-2 space-y-2">
          {items.map((item, index) => (
            <div key={index} className="rounded-xl bg-slate-50 p-2 dark:bg-white/5">
              <div className="grid gap-1.5 sm:grid-cols-12">
                <div className="sm:col-span-4">
                  <label className="label">Item Name</label>
                  <input value={item.name} onChange={(e) => setItem(index, "name", e.target.value)} className="input py-1 text-xs" placeholder="सामान / सेवा" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Product</label>
                  <select value={item.sku} onChange={(e) => pickProduct(index, e.target.value)} className="input py-1 text-xs">
                    <option value="">— चुनें —</option>
                    {products.map((product) => (
                      <option key={product.code} value={product.code}>{product.name} ({product.stock})</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1"><label className="label">QTY</label><input type="number" min={1} value={item.qty} onChange={(e) => setItem(index, "qty", e.target.value)} className="input py-1 text-xs" /></div>
                <div className="sm:col-span-2"><label className="label">Unit Price</label><input type="number" value={item.price} onChange={(e) => setItem(index, "price", e.target.value)} className="input py-1 text-xs" /></div>
                <div className="sm:col-span-1"><label className="label">Disc.</label><input type="number" value={item.discount} onChange={(e) => setItem(index, "discount", e.target.value)} className="input py-1 text-xs" /></div>
                <div className="sm:col-span-2">
                  <label className="label">Line Total</label>
                  <div className="flex items-center gap-1">
                    <input readOnly value={item.qty * item.price - item.discount} className="input bg-slate-100 py-1 text-xs font-bold dark:bg-white/10" />
                    <button type="button" onClick={() => setItems((prev) => [...prev, { ...item }])} className="btn-ghost px-1.5 py-1 text-[11px]" title="Duplicate Item">⧉</button>
                    <button type="button" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))} className="btn-danger px-1.5 py-1 text-[11px]" title="Remove Item">✕</button>
                  </div>
                </div>
                <div className="sm:col-span-12">
                  <input value={item.description} onChange={(e) => setItem(index, "description", e.target.value)} className="input py-1 text-xs" placeholder="Description (वैकल्पिक)" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-xl border border-slate-200 p-2 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">GST विकल्प:</span>
            <label className="flex items-center gap-1 text-[11px] font-semibold"><input type="radio" checked={gst.enabled} onChange={() => setGst({ ...gst, enabled: true })} /> With GST</label>
            <label className="flex items-center gap-1 text-[11px] font-semibold"><input type="radio" checked={!gst.enabled} onChange={() => setGst({ ...gst, enabled: false })} /> Without GST</label>
            {gst.enabled ? (
              <>
                <select value={gst.rate} onChange={(e) => setGst({ ...gst, rate: Number(e.target.value) })} className="input max-w-[110px] py-1 text-[11px]">
                  {[0, 5, 12, 18, 28].map((rate) => <option key={rate} value={rate}>GST {rate}%</option>)}
                </select>
                <select value={gst.type} onChange={(e) => setGst({ ...gst, type: e.target.value })} className="input max-w-[140px] py-1 text-[11px]">
                  <option value="CGST_SGST">CGST + SGST</option>
                  <option value="IGST">IGST</option>
                </select>
                <input value={gst.sellerGstin} onChange={(e) => setGst({ ...gst, sellerGstin: e.target.value })} placeholder="Seller GSTIN" className="input max-w-[170px] py-1 text-[11px]" />
                <input value={gst.customerGstin} onChange={(e) => setGst({ ...gst, customerGstin: e.target.value })} placeholder="Customer GSTIN" className="input max-w-[170px] py-1 text-[11px]" />
              </>
            ) : <span className="text-[10px] text-slate-400">GST ₹0 रहेगा — GSTIN फील्ड छिपे रहेंगे</span>}
          </div>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <div><label className="label">छूट (कुल)</label><input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="input py-1.5 text-xs" /></div>
          <div><label className="label">टैक्स</label><input type="number" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} className="input py-1.5 text-xs" /></div>
          <div><label className="label">Amount Paid</label><input type="number" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} className="input py-1.5 text-xs" /></div>
          <div><label className="label">नोट</label><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input py-1.5 text-xs" /></div>
        </div>
        <div className="mt-2 grid gap-1 rounded-xl bg-indigo-50 p-2 text-xs font-bold text-indigo-900 sm:grid-cols-4 dark:bg-indigo-500/10 dark:text-indigo-200">
          <p>Subtotal: ₹{totals.subtotal}</p>
          <p>Grand Total: ₹{totals.grandTotal}</p>
          <p>Balance Due: ₹{totals.balance}</p>
          <p>Status: {Number(form.amountPaid) <= 0 ? "Unpaid" : Number(form.amountPaid) >= totals.grandTotal ? "Paid" : "Partially Paid"}</p>
          {gst.enabled ? (
            <>
              <p>GST ({gst.rate}%): ₹{totals.gstAmount}</p>
              {gst.type === "IGST" ? <p>IGST: ₹{totals.igst}</p> : <><p>CGST: ₹{totals.cgst}</p><p>SGST: ₹{totals.sgst}</p></>}
            </>
          ) : <p className="sm:col-span-2">GST लागू नहीं (₹0)</p>}
        </div>
        {error ? <p className="mt-2 rounded-xl bg-rose-50 px-2 py-1.5 text-[11px] font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
        {message ? <p className="mt-2 rounded-xl bg-emerald-50 px-2 py-1.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{message}</p> : null}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" disabled={busy} onClick={() => save(false)} className="btn-primary px-3 py-1.5 text-xs">{busy ? "⏳…" : "💾 Save Bill"}</button>
          <button type="button" disabled={busy} onClick={() => save(true)} className="btn-ghost px-3 py-1.5 text-xs">📝 Save Draft</button>
          {lastBill ? (
            <>
              <a href={`/admin/billing/${lastBill.id}`} className="btn-soft px-3 py-1.5 text-xs">👁 Preview / Print</a>
              <a href={`/admin/billing/${lastBill.id}?download=1`} className="btn-ghost px-3 py-1.5 text-xs">⬇ PDF / Download</a>
            </>
          ) : null}
          {lastBill && form.mobile ? (
            <a href={`https://wa.me/91${form.mobile}?text=${encodeURIComponent(`आपका बिल ${lastBill.billNo} — कुल ₹${totals.grandTotal}`)}`} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 text-xs">📤 Share Bill</a>
          ) : null}
          {editing ? <a href="/admin/billing" className="btn-ghost px-3 py-1.5 text-xs">➕ नया बिल</a> : null}
        </div>
      </div>
    </div>
  );
}
