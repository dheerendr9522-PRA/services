"use client";

import { useMemo, useState } from "react";
import ServicePicker, { type PickerOption } from "@/components/ServicePicker";

type Item = { label: string; description: string; sku: string; qty: number; rate: number; discount: number; tax: number };
const empty: Item = { label: "", description: "", sku: "", qty: 1, rate: 0, discount: 0, tax: 0 };

export type InvoiceDraft = {
  id?: number; invoiceNo?: string; customerName: string; mobile: string; items: Item[]; discount: number; tax: number;
  amountPaid: number; paymentMode: string; notes: string; dueDate: string; gstEnabled: boolean; gstRate: number;
  gstType: string; sellerGstin: string; customerGstin: string;
};

export default function InvoiceBuilder({
  products,
  services,
  initial,
}: {
  products: { code: string; name: string; sellPrice: number }[];
  services: PickerOption[];
  initial?: InvoiceDraft | null;
}) {
  const [items, setItems] = useState<Item[]>(initial?.items?.length ? initial.items : [{ ...empty }]);
  const [form, setForm] = useState<InvoiceDraft>(
    initial ?? {
      customerName: "", mobile: "", items: [], discount: 0, tax: 0, amountPaid: 0, paymentMode: "Cash",
      notes: "", dueDate: "", gstEnabled: false, gstRate: 18, gstType: "CGST_SGST", sellerGstin: "", customerGstin: "",
    },
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<{ id: number; invoiceNo: string } | null>(null);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate - item.discount, 0);
    const itemTax = items.reduce((sum, item) => sum + item.tax, 0);
    const taxable = Math.max(0, subtotal - Number(form.discount || 0));
    const gstAmount = form.gstEnabled ? Math.round((taxable * Number(form.gstRate || 0)) / 100) : 0;
    const cgst = form.gstEnabled && form.gstType !== "IGST" ? Math.round(gstAmount / 2) : 0;
    const sgst = form.gstEnabled && form.gstType !== "IGST" ? gstAmount - cgst : 0;
    const igst = form.gstEnabled && form.gstType === "IGST" ? gstAmount : 0;
    const total = Math.max(0, taxable + itemTax + Number(form.tax || 0) + gstAmount);
    return { subtotal, total, gstAmount, cgst, sgst, igst, balance: Math.max(0, total - Number(form.amountPaid || 0)) };
  }, [items, form]);

  const setItem = (index: number, key: keyof Item, value: string) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: ["label", "description", "sku"].includes(key) ? value : Number(value) || 0 } : item)));

  const addServiceItems = () => {
    const picked = services.filter((service) => selectedServices.includes(service.slug));
    if (!picked.length) return;
    setItems((prev) => {
      const base = prev.filter((item) => item.label.trim());
      return [
        ...base,
        ...picked.map((service) => ({
          label: service.nameHi,
          description: `${service.categoryNameHi} · ${service.serviceMode === "shop" ? "दुकान पर" : service.serviceMode === "online" ? "ऑनलाइन" : "दुकान/ऑनलाइन"}`,
          sku: service.slug,
          qty: 1,
          rate: service.shopFee + service.govtFee + service.bookingFee,
          discount: 0,
          tax: 0,
        })),
      ];
    });
    setSelectedServices([]);
    setPickerOpen(false);
  };

  async function save() {
    setBusy(true);
    setError("");
    const valid = items.filter((item) => item.label.trim());
    if (!valid.length) { setError("कम से कम एक आइटम/सेवा जोड़ें"); setBusy(false); return; }
    if (!form.customerName.trim()) { setError("ग्राहक का नाम आवश्यक है"); setBusy(false); return; }
    const response = await fetch("/api/invoices", {
      method: initial?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: initial?.id, items: valid }),
    }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      const json = (await response?.json().catch(() => null)) as { error?: string } | null;
      setError(json?.error ?? "इनवॉइस सहेजा नहीं जा सका");
      return;
    }
    const json = (await response.json()) as { invoice: { id: number; invoiceNo: string } };
    setSaved({ id: json.invoice.id, invoiceNo: json.invoice.invoiceNo });
    setMessage(`✅ इनवॉइस ${json.invoice.invoiceNo} सहेजा गया`);
    if (!initial?.id) {
      setItems([{ ...empty }]);
      setForm((prev) => ({ ...prev, customerName: "", mobile: "", amountPaid: 0, discount: 0, tax: 0, notes: "" }));
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">{initial?.id ? `✏️ इनवॉइस ${initial.invoiceNo} संपादित करें` : "🧾 नया इनवॉइस बनाएँ"}</h2>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">इनवॉइस नंबर स्वतः · GST विकल्प सहित</span>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <div><label className="label">ग्राहक नाम *</label><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="input py-1.5 text-xs" /></div>
          <div><label className="label">मोबाइल</label><input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="input py-1.5 text-xs" /></div>
          <div><label className="label">देय तिथि</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input py-1.5 text-xs" /></div>
          <div><label className="label">भुगतान माध्यम</label>
            <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} className="input py-1.5 text-xs">
              {["Cash", "UPI", "Bank Transfer", "Credit", "Other"].map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-2 dark:border-white/10">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">GST:</span>
          <label className="flex items-center gap-1 text-[11px] font-semibold"><input type="radio" checked={form.gstEnabled} onChange={() => setForm({ ...form, gstEnabled: true })} /> With GST</label>
          <label className="flex items-center gap-1 text-[11px] font-semibold"><input type="radio" checked={!form.gstEnabled} onChange={() => setForm({ ...form, gstEnabled: false })} /> Without GST</label>
          {form.gstEnabled ? (
            <>
              <select value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: Number(e.target.value) })} className="input max-w-[100px] py-1 text-[11px]">
                {[0, 5, 12, 18, 28].map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
              </select>
              <select value={form.gstType} onChange={(e) => setForm({ ...form, gstType: e.target.value })} className="input max-w-[130px] py-1 text-[11px]">
                <option value="CGST_SGST">CGST + SGST</option>
                <option value="IGST">IGST</option>
              </select>
              <input value={form.sellerGstin} onChange={(e) => setForm({ ...form, sellerGstin: e.target.value })} placeholder="Seller GSTIN" className="input max-w-[160px] py-1 text-[11px]" />
              <input value={form.customerGstin} onChange={(e) => setForm({ ...form, customerGstin: e.target.value })} placeholder="Customer GSTIN" className="input max-w-[160px] py-1 text-[11px]" />
            </>
          ) : <span className="text-[10px] text-slate-400">GST ₹0 · GSTIN छिपे</span>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">आइटम ({items.length})</h3>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setItems((prev) => [...prev, { ...empty }])} className="btn-ghost px-2 py-1 text-[11px]">➕ नया Item Type</button>
            <button type="button" onClick={() => setPickerOpen((v) => !v)} className="btn-primary px-2 py-1 text-[11px]">🧩 मेन्यू से सेवा चुनें</button>
          </div>
        </div>

        {pickerOpen ? (
          <div className="mt-2 space-y-1.5">
            <ServicePicker options={services} selected={selectedServices} onChange={setSelectedServices} />
            <button type="button" onClick={addServiceItems} className="btn-primary px-2.5 py-1.5 text-[11px]">⬇ चुनी सेवाएँ इनवॉइस में जोड़ें ({selectedServices.length})</button>
          </div>
        ) : null}

        <div className="mt-2 space-y-2">
          {items.map((item, index) => (
            <div key={index} className="rounded-xl bg-slate-50 p-2 dark:bg-white/5">
              <div className="grid gap-1.5 sm:grid-cols-12">
                <div className="sm:col-span-4"><label className="label">Item / Service</label><input value={item.label} onChange={(e) => setItem(index, "label", e.target.value)} className="input py-1 text-xs" /></div>
                <div className="sm:col-span-2"><label className="label">उत्पाद सूची</label>
                  <select value={item.sku} onChange={(e) => {
                    const product = products.find((p) => p.code === e.target.value);
                    const service = services.find((s) => s.slug === e.target.value);
                    setItems((prev) => prev.map((row, i) => i === index ? { ...row, sku: e.target.value, label: product?.name ?? service?.nameHi ?? row.label, rate: product?.sellPrice ?? (service ? service.shopFee + service.govtFee + service.bookingFee : row.rate) } : row));
                  }} className="input py-1 text-xs">
                    <option value="">— चुनें —</option>
                    <optgroup label="उत्पाद / Stock">{products.map((product) => <option key={product.code} value={product.code}>{product.name}</option>)}</optgroup>
                    <optgroup label="सेवाएँ">{services.slice(0, 80).map((service) => <option key={service.slug} value={service.slug}>{service.nameHi}</option>)}</optgroup>
                  </select>
                </div>
                <div className="sm:col-span-1"><label className="label">QTY</label><input type="number" min={1} value={item.qty} onChange={(e) => setItem(index, "qty", e.target.value)} className="input py-1 text-xs" /></div>
                <div className="sm:col-span-1"><label className="label">दर</label><input type="number" value={item.rate} onChange={(e) => setItem(index, "rate", e.target.value)} className="input py-1 text-xs" /></div>
                <div className="sm:col-span-1"><label className="label">छूट</label><input type="number" value={item.discount} onChange={(e) => setItem(index, "discount", e.target.value)} className="input py-1 text-xs" /></div>
                <div className="sm:col-span-1"><label className="label">टैक्स</label><input type="number" value={item.tax} onChange={(e) => setItem(index, "tax", e.target.value)} className="input py-1 text-xs" /></div>
                <div className="sm:col-span-2">
                  <label className="label">कुल</label>
                  <div className="flex items-center gap-1">
                    <input readOnly value={item.qty * item.rate - item.discount} className="input bg-slate-100 py-1 text-xs font-bold dark:bg-white/10" />
                    <button type="button" onClick={() => setItems((prev) => [...prev, { ...item }])} className="btn-ghost px-1.5 py-1 text-[11px]" title="Duplicate">⧉</button>
                    <button type="button" onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))} className="btn-danger px-1.5 py-1 text-[11px]" title="Remove">✕</button>
                  </div>
                </div>
                <div className="sm:col-span-12"><input value={item.description} onChange={(e) => setItem(index, "description", e.target.value)} className="input py-1 text-xs" placeholder="Description (वैकल्पिक)" /></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <div><label className="label">कुल छूट</label><input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) || 0 })} className="input py-1.5 text-xs" /></div>
          <div><label className="label">अतिरिक्त टैक्स</label><input type="number" value={form.tax} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) || 0 })} className="input py-1.5 text-xs" /></div>
          <div><label className="label">प्राप्त राशि</label><input type="number" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: Number(e.target.value) || 0 })} className="input py-1.5 text-xs" /></div>
          <div><label className="label">नोट / शर्तें</label><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input py-1.5 text-xs" /></div>
        </div>
        <div className="mt-2 grid gap-1 rounded-xl bg-indigo-50 p-2 text-xs font-bold text-indigo-900 sm:grid-cols-4 dark:bg-indigo-500/10 dark:text-indigo-200">
          <p>Subtotal: ₹{totals.subtotal}</p>
          <p>GST: ₹{totals.gstAmount}{form.gstEnabled ? ` (CGST ₹${totals.cgst} + SGST ₹${totals.sgst})` : ""}</p>
          <p>कुल: ₹{totals.total}</p>
          <p>बाकी: ₹{totals.balance}</p>
        </div>
        {error ? <p className="mt-2 rounded-xl bg-rose-50 px-2 py-1.5 text-[11px] font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
        {message ? <p className="mt-2 rounded-xl bg-emerald-50 px-2 py-1.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{message}</p> : null}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button type="button" onClick={save} disabled={busy} className="btn-primary px-3 py-1.5 text-xs">{busy ? "⏳…" : "💾 Save Invoice"}</button>
          {saved ? <a href={`/admin/invoices/${saved.id}`} className="btn-soft px-3 py-1.5 text-xs">👁 Preview / Print ({saved.invoiceNo})</a> : null}
          {saved ? <a href={`/exports/invoices.csv`} className="btn-ghost px-3 py-1.5 text-xs">⬇ CSV</a> : null}
        </div>
      </div>
    </div>
  );
}
