"use client";

import { useMemo, useRef, useState } from "react";
import UpiPayBox from "@/components/UpiPayBox";
import ServicePicker, { type PickerOption } from "@/components/ServicePicker";

type Option = { slug: string; nameHi: string; nameEn: string; shopFee: number; govtFee: number; bookingFee: number; documents: string[] };

type PickerSource = { slug: string; nameHi: string; nameEn: string; shopFee: number; govtFee: number; bookingFee: number; documents: string[] | null; serviceMode: string; categoryNameHi: string; categorySlug: string; categoryIcon: string; timeEstimate: string };
type Row = { key: string; serviceSlug: string; file: File | null; fileName: string; docType: string };

const MASTER_DOCS = ["आधार कार्ड", "पैन कार्ड", "राशन कार्ड", "समग्र परिवार आईडी", "मतदाता आईडी", "जन्म प्रमाण पत्र", "जाति प्रमाण पत्र", "आय प्रमाण पत्र", "निवास प्रमाण पत्र", "शैक्षणिक मार्कशीट", "बैंक पासबुक", "पासपोर्ट साइज़ फोटो", "हस्ताक्षर", "Other Document (अन्य दस्तावेज़)"];

export default function MultiServiceForm({
  options,
  upi,
  pickerOptions = [],
}: {
  options: Option[];
  upi: { name: string; id: string; mobile: string; qrDataUrl: string };
  pickerOptions?: PickerSource[];
}) {
  const [selected, setSelected] = useState<string[]>(options[0] ? [options[0].slug] : []);
  const [form, setForm] = useState({ customerName: "", mobile: "", whatsapp: "", guardianName: "", address: "", email: "", notes: "", utr: "", paymentMode: "UPI" });
  const [docs, setDocs] = useState<Row[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ refNo: string; amount: number } | null>(null);
  const nextKey = useRef(1);

  const allOptions: PickerOption[] = pickerOptions.length
    ? pickerOptions.map((option) => ({
        slug: option.slug, nameHi: option.nameHi, nameEn: option.nameEn, shopFee: option.shopFee,
        govtFee: option.govtFee, bookingFee: option.bookingFee, documents: option.documents ?? [],
        serviceMode: option.serviceMode, categoryNameHi: option.categoryNameHi, categorySlug: option.categorySlug,
        categoryIcon: option.categoryIcon, timeEstimate: option.timeEstimate,
      }))
    : options.map((option) => ({
        ...option, serviceMode: "shop", categoryNameHi: "सेवाएँ", categorySlug: "all", categoryIcon: "🧾", timeEstimate: "1 दिन",
      }));
  const chosen = useMemo(() => allOptions.filter((option) => selected.includes(option.slug)), [allOptions, selected]);
  const [pickedMode, setPickedMode] = useState("shop");
  const total = chosen.reduce((sum, option) => sum + option.shopFee + option.govtFee + option.bookingFee, 0);

  const toggleService = (slug: string) => {
    setSelected((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      const service = allOptions.find((option) => option.slug === slug);
      if (service && !prev.includes(slug)) {
        const rows = (service.documents ?? []).slice(0, 3).map((doc) => ({ key: `d${nextKey.current++}`, serviceSlug: slug, file: null, fileName: "", docType: doc }));
        setDocs((existing) => [...existing, ...rows]);
      }
      if (prev.includes(slug)) setDocs((existing) => existing.filter((row) => row.serviceSlug !== slug));
      return next;
    });
  };

  const addDoc = (serviceSlug: string) => setDocs((prev) => [...prev, { key: `d${nextKey.current++}`, serviceSlug, file: null, fileName: "", docType: "Other Document (अन्य दस्तावेज़)" }]);

  const setFiles = (key: string, files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    const bad = list.find((file) => file.size < 5 * 1024 || file.size > 100 * 1024 * 1024);
    if (bad) { setError(`फाइल "${bad.name}" 5 KB से 100 MB के बीच होनी चाहिए`); return; }
    setError("");
    setDocs((prev) => {
      const target = prev.find((row) => row.key === key);
      const updated = prev.map((row) => (row.key === key ? { ...row, file: list[0], fileName: list[0].name } : row));
      const extras = list.slice(1).map((file) => ({ key: `d${nextKey.current++}`, serviceSlug: target?.serviceSlug ?? "", docType: target?.docType ?? "Other Document (अन्य दस्तावेज़)", file, fileName: file.name }));
      return [...updated, ...extras];
    });
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!chosen.length) { setError("कम से कम एक सेवा चुनें"); return; }
    if (!consent) { setError("सहमति देना आवश्यक है"); return; }
    setBusy(true);
    const primary = chosen[0];
    const data = new FormData();
    data.set("serviceSlug", primary.slug);
    data.set("customerName", form.customerName);
    data.set("mobile", form.mobile);
    data.set("whatsapp", form.whatsapp);
    data.set("guardianName", form.guardianName);
    data.set("address", form.address);
    data.set("email", form.email);
    data.set("notes", form.notes);
    data.set("utr", form.utr);
    data.set("paymentMode", form.paymentMode);
    data.set("amount", String(total));
    data.set("servicesList", JSON.stringify(chosen.map((option) => ({ slug: option.slug, nameHi: option.nameHi, fee: option.shopFee + option.govtFee + option.bookingFee, status: "Pending", documents: option.documents ?? [] }))));
    data.set("notes", `${form.notes}${form.notes ? " · " : ""}सेवा मोड: ${pickedMode === "online" ? "बिना दुकान आए (ऑनलाइन)" : "दुकान पर"}`);
    docs.forEach((row) => {
      if (!row.file) return;
      data.append("docType", `${row.docType}${chosen.length > 1 ? ` · ${row.serviceSlug}` : ""}`);
      data.append("docService", row.serviceSlug);
      data.append("docFile", row.file);
    });
    const response = await fetch("/api/applications", { method: "POST", body: data }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      const json = (await response?.json().catch(() => null)) as { error?: string } | null;
      setError(json?.error ?? "आवेदन जमा नहीं हो सका");
      return;
    }
    const json = (await response.json()) as { refNo: string; amount: number };
    setResult(json);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-400/30 dark:bg-emerald-500/10">
        <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">✅ आवेदन सफलतापूर्वक जमा हुआ!</p>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">मास्टर आवेदन ID: <b className="font-mono">{result.refNo}</b> · कुल राशि: <b>₹{result.amount}</b></p>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">इस एक ID से आपकी सभी चुनी गई सेवाएँ जुड़ी हैं। स्थिति /track या कस्टमर पोर्टल पर देखें।</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <a href={`/track?ref=${encodeURIComponent(result.refNo)}&mobile=${encodeURIComponent(form.mobile)}`} className="btn-primary px-3 py-1.5 text-xs">📍 स्थिति देखें</a>
          <a href="/customer/login" className="btn-ghost px-3 py-1.5 text-xs">👤 कस्टमर पोर्टल</a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <ServicePicker options={allOptions} selected={selected} onChange={setSelected} />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-400/20 dark:bg-emerald-500/5">
        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">सेवा कैसे लेंगे?</p>
        <div className="mt-1 flex flex-wrap gap-3 text-[11px] font-semibold">
          {[
            ["shop", "🏪 दुकान पर आकर"],
            ["online", "🌐 बिना दुकान आए (ऑनलाइन)"],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-1">
              <input type="radio" checked={pickedMode === value} onChange={() => setPickedMode(value)} />
              {label}
            </label>
          ))}
        </div>
        <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
          चुनी सेवाओं में {chosen.filter((option) => option.serviceMode === "shop").length} को दुकान आना ज़रूरी है
          {chosen.filter((option) => option.serviceMode === "shop").length > 0 ? " — कृपया मूल दस्तावेज़ साथ लाएँ।" : "।"}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div><label className="label">ग्राहक का पूरा नाम *</label><input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="input py-1.5 text-xs" /></div>
        <div><label className="label">मोबाइल नंबर *</label><input required inputMode="numeric" pattern="[6-9][0-9]{9}" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="input py-1.5 text-xs" /></div>
        <div><label className="label">WhatsApp नंबर</label><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="input py-1.5 text-xs" /></div>
        <div><label className="label">पिता / पति का नाम</label><input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} className="input py-1.5 text-xs" /></div>
        <div><label className="label">गाँव / पता</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input py-1.5 text-xs" /></div>
        <div><label className="label">ईमेल (वैकल्पिक)</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input py-1.5 text-xs" /></div>
        <div className="sm:col-span-2"><label className="label">अतिरिक्त जानकारी</label><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input py-1.5 text-xs" /></div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-3 dark:border-white/10">
        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">2️⃣ दस्तावेज़ (कई फाइलें · 5 KB–100 MB)</p>
        <div className="mt-1.5 space-y-2">
          {docs.map((row) => (
            <div key={row.key} className="grid gap-1.5 rounded-xl bg-slate-50 p-2 sm:grid-cols-[1fr_auto_auto_auto] dark:bg-white/5">
              <select value={row.docType} onChange={(e) => setDocs((prev) => prev.map((r) => (r.key === row.key ? { ...r, docType: e.target.value } : r)))} className="input py-1 text-xs">
                {MASTER_DOCS.map((doc) => <option key={doc} value={doc}>{doc}</option>)}
                {chosen.map((option) => (option.documents ?? []).map((doc) => <option key={`${option.slug}-${doc}`} value={doc}>{doc}</option>))}
              </select>
              <label className="btn-ghost cursor-pointer justify-center py-1 text-[11px]">📎 फाइल<input type="file" multiple className="hidden" onChange={(e) => setFiles(row.key, e.target.files)} /></label>
              <label className="btn-ghost cursor-pointer justify-center py-1 text-[11px]">📷 कैमरा<input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFiles(row.key, e.target.files)} /></label>
              <button type="button" onClick={() => setDocs((prev) => prev.filter((r) => r.key !== row.key))} className="btn-danger justify-center py-1 text-[11px]">✕</button>
              {row.fileName ? <p className="truncate text-[10px] font-semibold text-emerald-600 sm:col-span-4 dark:text-emerald-300">✅ {row.fileName} ({Math.round((row.file?.size ?? 0) / 1024)} KB)</p> : null}
              {row.file ? <p className="text-[10px] text-slate-400 sm:col-span-4">सेवा: {row.serviceSlug}</p> : null}
            </div>
          ))}
          {docs.length === 0 ? <p className="text-[11px] text-slate-400">सेवा चुनने पर उसके दस्तावेज़ अपने-आप जुड़ जाते हैं।</p> : null}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {chosen.map((option) => (
            <button key={option.slug} type="button" onClick={() => addDoc(option.slug)} className="btn-soft px-2 py-1 text-[10px]">+ {option.nameHi} दस्तावेज़</button>
          ))}
        </div>
      </div>

      <UpiPayBox upiName={upi.name} upiId={upi.id} upiMobile={upi.mobile} qrDataUrl={upi.qrDataUrl} amount={total} />

      <div className="grid gap-2 sm:grid-cols-2">
        <div><label className="label">पेमेंट UTR / Txn ID</label><input value={form.utr} onChange={(e) => setForm({ ...form, utr: e.target.value })} className="input py-1.5 text-xs" /></div>
        <div><label className="label">पेमेंट माध्यम</label>
          <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} className="input py-1.5 text-xs">
            {["UPI", "Mobile UPI", "Cash", "Pending"].map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
        <p className="font-bold">⚠️ सुरक्षा: कभी भी पूरा आधार/पैन नंबर, OTP या PIN न लिखें। भुगतान UPI पर सीधे दुकान को जाता है।</p>
        <label className="mt-1 flex items-start gap-1.5 font-semibold">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
          मैं सहमत हूँ कि मेरी जानकारी व दस्तावेज़ केवल इस सेवा के लिए दुकान द्वारा उपयोग किए जाएँ; सरकारी स्वीकृति की गारंटी नहीं है।
        </label>
      </div>

      {error ? <p className="rounded-xl bg-rose-50 px-2.5 py-2 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{error}</p> : null}
      <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 text-sm">{busy ? "⏳ भेजा जा रहा है…" : `आवेदन जमा करें — कुल ₹${total}`}</button>
    </form>
  );
}
