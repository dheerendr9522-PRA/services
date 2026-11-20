"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ApplicationEdit = {
  id: number;
  refNo: string;
  customerName: string;
  mobile: string;
  whatsapp: string;
  guardianName: string;
  address: string;
  email: string;
  familyId: string;
  serviceName: string;
  status: string;
  amount: number;
  govtFee: number;
  paidAmount: number;
  paymentMode: string;
  paymentVerify: string;
  utr: string;
  notes: string;
  adminNote: string;
  customerQuery: string;
  serviceDate: string;
  followUpDate: string;
  estCompletion: string;
};

const STATUSES = ["Pending", "Processing", "Documents Pending", "Payment Pending", "In Progress", "Completed", "Rejected", "Cancelled"];
const VERIFY = ["unpaid", "under verification", "verified", "failed", "refunded"];
const MODES = ["UPI", "Mobile UPI", "Cash", "Pending"];

export default function ApplicationEditForm({ application }: { application: ApplicationEdit }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(application);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const set = (key: keyof ApplicationEdit, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }));

  async function save() {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.customerName,
        mobile: form.mobile,
        whatsapp: form.whatsapp,
        guardianName: form.guardianName,
        address: form.address,
        email: form.email,
        familyId: form.familyId,
        status: form.status,
        amount: Number(form.amount),
        govtFee: Number(form.govtFee),
        paidAmount: Number(form.paidAmount),
        paymentMode: form.paymentMode,
        paymentVerify: form.paymentVerify,
        utr: form.utr,
        notes: form.notes,
        adminNote: form.adminNote,
        customerQuery: form.customerQuery,
        serviceDate: form.serviceDate,
        followUpDate: form.followUpDate,
        estCompletion: form.estCompletion,
      }),
    }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      const json = (await response?.json().catch(() => null)) as { error?: string } | null;
      setMessage(`❌ ${json?.error ?? "सहेजा नहीं जा सका"}`);
      return;
    }
    setMessage("✅ आवेदन अपडेट हो गया");
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary no-print px-3 py-1.5 text-xs">
        ✏️ संपादित करें / Edit Application
      </button>
    );
  }

  return (
    <div className="no-print rounded-2xl border border-indigo-300 bg-white p-3 shadow-sm dark:border-indigo-400/30 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-slate-900 dark:text-white">संपादित करें — {form.refNo}</p>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost px-2 py-1 text-xs">✕</button>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <div><label className="label">ग्राहक नाम *</label><input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} className="input py-1.5 text-xs" /></div>
        <div><label className="label">मोबाइल *</label><input value={form.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} className="input py-1.5 text-xs" /></div>
        <div><label className="label">सेवा</label><input value={form.serviceName} readOnly className="input bg-slate-100 py-1.5 text-xs dark:bg-white/10" /></div>
        <div>
          <label className="label">स्थिति</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className="input py-1.5 text-xs">
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        <div><label className="label">अनुमानित राशि</label><input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} className="input py-1.5 text-xs" /></div>
        <div><label className="label">प्राप्त राशि</label><input type="number" value={form.paidAmount} onChange={(e) => set("paidAmount", e.target.value)} className="input py-1.5 text-xs" /></div>
        <div>
          <label className="label">भुगतान माध्यम</label>
          <select value={form.paymentMode} onChange={(e) => set("paymentMode", e.target.value)} className="input py-1.5 text-xs">
            {MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </div>
        <div>
          <label className="label">भुगतान सत्यापन</label>
          <select value={form.paymentVerify} onChange={(e) => set("paymentVerify", e.target.value)} className="input py-1.5 text-xs">
            {VERIFY.map((verify) => <option key={verify} value={verify}>{verify}</option>)}
          </select>
        </div>
        <div><label className="label">UPI UTR / Txn ID</label><input value={form.utr} onChange={(e) => set("utr", e.target.value)} className="input py-1.5 text-xs" /></div>
        <div><label className="label">WhatsApp नंबर</label><input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, "").slice(0, 10))} className="input py-1.5 text-xs" /></div>
        <div><label className="label">पिता / पति का नाम</label><input value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} className="input py-1.5 text-xs" /></div>
        <div><label className="label">गाँव / पता</label><input value={form.address} onChange={(e) => set("address", e.target.value)} className="input py-1.5 text-xs" /></div>
        <div><label className="label">ईमेल</label><input value={form.email} onChange={(e) => set("email", e.target.value)} className="input py-1.5 text-xs" /></div>
        <div><label className="label">समग्र आईडी</label><input value={form.familyId} onChange={(e) => set("familyId", e.target.value)} className="input py-1.5 text-xs" /></div>
        <div><label className="label">सरकारी शुल्क</label><input type="number" value={form.govtFee} onChange={(e) => set("govtFee", e.target.value)} className="input py-1.5 text-xs" /></div>
        <div><label className="label">सेवा तिथि</label><input type="date" value={form.serviceDate} onChange={(e) => set("serviceDate", e.target.value)} className="input py-1.5 text-xs" /></div>
        <div><label className="label">फॉलो-अप तिथि</label><input type="date" value={form.followUpDate} onChange={(e) => set("followUpDate", e.target.value)} className="input py-1.5 text-xs" /></div>
        <div><label className="label">अनुमानित पूर्णता</label><input type="date" value={form.estCompletion} onChange={(e) => set("estCompletion", e.target.value)} className="input py-1.5 text-xs" /></div>
        <div className="sm:col-span-3"><label className="label">ग्राहक पूछताछ / Customer Query</label><textarea rows={2} value={form.customerQuery} onChange={(e) => set("customerQuery", e.target.value)} className="input py-1.5 text-xs" /></div>
        <div className="sm:col-span-3"><label className="label">आंतरिक नोट / Admin Note</label><textarea rows={2} value={form.adminNote} onChange={(e) => set("adminNote", e.target.value)} className="input py-1.5 text-xs" /></div>
      </div>
      <p className="mt-1 text-[10px] text-slate-400">आवेदन संदर्भ संख्या: {form.refNo} · ग्राहक पहचान बदलने पर दस्तावेज़ लिंक वही रहते हैं।</p>
      {message ? <p className="mt-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{message}</p> : null}
      <div className="mt-2 flex gap-1.5">
        <button type="button" onClick={save} disabled={busy} className="btn-primary px-3 py-1.5 text-xs">{busy ? "⏳…" : "💾 सहेजें"}</button>
        <button type="button" onClick={() => { setForm(application); setOpen(false); }} className="btn-ghost px-3 py-1.5 text-xs">रद्द करें</button>
      </div>
    </div>
  );
}
