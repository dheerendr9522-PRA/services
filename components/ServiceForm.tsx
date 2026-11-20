"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import UpiPayBox from "@/components/UpiPayBox";

const MASTER_DOCS = [
  "आधार कार्ड",
  "पैन कार्ड",
  "राशन कार्ड",
  "समग्र परिवार आईडी",
  "मतदाता आईडी",
  "जन्म प्रमाण पत्र",
  "जाति प्रमाण पत्र",
  "आय प्रमाण पत्र",
  "निवास प्रमाण पत्र",
  "शैक्षणिक मार्कशीट",
  "बैंक पासबुक",
  "पासपोर्ट साइज़ फोटो",
  "हस्ताक्षर",
  "मोबाइल नंबर प्रमाण",
  "पुराना दस्तावेज़ / सर्टिफिकेट",
  "मेडिकल दस्तावेज़",
  "वाहन RC / बीमा",
  "Other Document (अन्य दस्तावेज़)",
];

type DocRow = { id: number; type: string; file: File | null; fileName: string };
type DynamicField = { key: string; label: string; type: string; required?: boolean; options?: string[] };

export default function ServiceForm({
  service,
  upi,
  relatedOptions = [],
}: {
  service: {
    slug: string;
    nameHi: string;
    documents: string[];
    shopFee: number;
    govtFee: number;
    bookingFee: number;
    formFields?: DynamicField[];
  };
  relatedOptions?: { slug: string; nameHi: string; shopFee: number }[];
  upi: { name: string; id: string; mobile: string; qrDataUrl: string };
}) {
  const initialDocs = (service.documents.length ? service.documents : ["आधार कार्ड"]).slice(0, 4);
  const [docRows, setDocRows] = useState<DocRow[]>(
    initialDocs.map((type, index) => ({ id: index + 1, type, file: null, fileName: "" })),
  );
  const [nextId, setNextId] = useState(initialDocs.length + 1);
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [tasks, setTasks] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ refNo: string; amount: number } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const addRow = () => {
    setDocRows((rows) => [...rows, { id: nextId, type: "Other Document (अन्य दस्तावेज़)", file: null, fileName: "" }]);
    setNextId((n) => n + 1);
  };

  const removeRow = (id: number) => setDocRows((rows) => rows.filter((r) => r.id !== id));

  const setFile = (id: number, files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;
    const invalid = list.find((file) => file.size < 5 * 1024 || file.size > 100 * 1024 * 1024);
    if (invalid) {
      setError(`फाइल "${invalid.name}" 5 KB से 100 MB के बीच होनी चाहिए।`);
      return;
    }
    setError("");
    setDocRows((rows) => {
      const first = rows.find((r) => r.id === id);
      const updated = rows.map((r) => (r.id === id ? { ...r, file: list[0], fileName: list[0].name } : r));
      const extras = list.slice(1).map((file, index) => ({
        id: id * 1000 + index + 1,
        type: first?.type ?? "Other Document (अन्य दस्तावेज़)",
        file,
        fileName: file.name,
      }));
      return [...updated, ...extras];
    });
  };

  const total = service.shopFee + service.govtFee + service.bookingFee;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("serviceSlug", service.slug);
    data.set("formData", JSON.stringify(extraFields));
    data.set("relatedTasks", JSON.stringify(tasks));
    data.set("amount", String(total));
    data.delete("docType");
    data.delete("docFile");
    for (const row of docRows) {
      if (!row.file) continue;
      data.append("docType", row.type);
      data.append("docFile", row.file);
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/applications", { method: "POST", body: data });
      const json = (await response.json()) as { ok: boolean; refNo?: string; amount?: number; error?: string };
      if (!response.ok || !json.ok) {
        setError(json.error || "आवेदन जमा नहीं हो सका");
        setSubmitting(false);
        return;
      }
      setResult({ refNo: json.refNo ?? "", amount: json.amount ?? total });
      setSubmitting(false);
      formRef.current?.reset();
      setDocRows(initialDocs.map((type, index) => ({ id: index + 1, type, file: null, fileName: "" })));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("नेटवर्क त्रुटि — दोबारा कोशिश करें");
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="card border-emerald-300 p-4 dark:border-emerald-400/30">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-2xl dark:bg-emerald-500/20">✅</span>
          <div>
            <h3 className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
              आवेदन सफलतापूर्वक जमा हुआ!
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              आपका ट्रैकिंग नंबर <b className="font-mono text-slate-900 dark:text-white">{result.refNo}</b> है। राशि:{" "}
              <b>₹{result.amount}</b>
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              दुकान से संपर्क: 7610420959 · स्थिति पेज पर मोबाइल नंबर व ट्रैकिंग नंबर से देखें।
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/track?ref=${encodeURIComponent(result.refNo)}`} className="btn-primary px-3 py-1.5 text-xs">
                आवेदन ट्रैक करें
              </Link>
              <Link href="/customer/login" className="btn-ghost px-3 py-1.5 text-xs">
                कस्टमर पोर्टल
              </Link>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="btn-soft px-3 py-1.5 text-xs"
              >
                नया आवेदन
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
        ⚠️ सुरक्षा सूचना: फॉर्म में कभी भी पूरा आधार नंबर, पैन नंबर, OTP या बैंक PIN न लिखें। केवल आवश्यक जानकारी दें।
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">ग्राहक का पूरा नाम *</label>
          <input name="customerName" required className="input" placeholder="जैसे: रामकिशोर पटेल" />
        </div>
        <div>
          <label className="label">मोबाइल नंबर *</label>
          <input name="mobile" required inputMode="numeric" pattern="[6-9][0-9]{9}" className="input" placeholder="10 अंकों का मोबाइल" />
        </div>
        <div>
          <label className="label">WhatsApp नंबर (यदि अलग)</label>
          <input name="whatsapp" inputMode="numeric" className="input" placeholder="वैकल्पिक" />
        </div>
        <div>
          <label className="label">पिता / पति का नाम</label>
          <input name="guardianName" className="input" placeholder="पिता या पति का नाम" />
        </div>
        <div>
          <label className="label">गाँव / पता</label>
          <input name="address" className="input" placeholder="गाँव, पोस्ट, तहसील, जिला" />
        </div>
        <div>
          <label className="label">ईमेल (वैकल्पिक)</label>
          <input name="email" type="email" className="input" placeholder="name@example.com" />
        </div>
        <div>
          <label className="label">समग्र परिवार / सदस्य आईडी (वैकल्पिक)</label>
          <input name="familyId" className="input" placeholder="जैसे SAM-448812" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">अतिरिक्त जानकारी / कौन-सा काम करवाना है</label>
          <textarea name="notes" rows={3} className="input" placeholder="जैसे: आधार में पता सुधार करवाना है…" />
        </div>
      </div>

      {(service.formFields ?? []).length > 0 ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-3 dark:border-indigo-400/20 dark:bg-indigo-500/5">
          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">📋 सेवा-विशेष जानकारी</p>
          <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">इस सेवा के लिए आवश्यक अतिरिक्त विवरण भरें।</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(service.formFields ?? []).map((field) => (
              <div key={field.key}>
                <label className="label">{field.label}{field.required ? " *" : ""}</label>
                {field.type === "select" && field.options?.length ? (
                  <select
                    value={extraFields[field.key] ?? ""}
                    onChange={(e) => setExtraFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    required={field.required}
                    className="input py-1.5 text-xs"
                  >
                    <option value="">— चुनें —</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={extraFields[field.key] ?? ""}
                    onChange={(e) => setExtraFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    required={field.required}
                    rows={2}
                    className="input py-1.5 text-xs"
                  />
                ) : (
                  <input
                    type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                    value={extraFields[field.key] ?? ""}
                    onChange={(e) => setExtraFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    required={field.required}
                    className="input py-1.5 text-xs"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(relatedOptions ?? []).length > 0 ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-400/20 dark:bg-emerald-500/5">
          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">➕ साथ में अन्य काम जोड़ें (वैकल्पिक)</p>
          <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">एक ही आवेदन में संबंधित कार्य जोड़ सकते हैं — एडमिन को सूची दिखेगी।</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {(relatedOptions ?? []).map((option) => (
              <label key={option.slug} className="flex items-center gap-2 rounded-xl bg-white/70 px-2 py-1.5 text-[11px] font-semibold dark:bg-white/5">
                <input
                  type="checkbox"
                  checked={tasks.includes(option.slug)}
                  onChange={(e) => setTasks((prev) => (e.target.checked ? [...prev, option.slug] : prev.filter((t) => t !== option.slug)))}
                />
                <span className="truncate">{option.nameHi}</span>
                <span className="ml-auto text-emerald-600 dark:text-emerald-300">₹{option.shopFee}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 p-3 dark:border-white/10">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">दस्तावेज़ — कई फाइलें</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              एक साथ कई दस्तावेज़ चुनें, कैमरा से फोटो लें या &quot;Other Document&quot; चुनें। (JPG/PNG/PDF — एक साथ कई फाइलें, 5 KB से 100 MB तक)
            </p>
          </div>
          <button type="button" onClick={addRow} className="btn-soft px-2.5 py-1.5 text-xs">
            + और दस्तावेज़
          </button>
        </div>
        <div className="space-y-2">
          {docRows.map((row, index) => (
            <div key={row.id} className="grid gap-2 rounded-xl bg-slate-50 p-2 sm:grid-cols-[1fr_auto_auto_auto] dark:bg-white/5">
              <select
                value={row.type}
                onChange={(e) => setDocRows((rows) => rows.map((r) => (r.id === row.id ? { ...r, type: e.target.value } : r)))}
                className="input py-1.5 text-xs"
                aria-label={`दस्तावेज़ प्रकार ${index + 1}`}
              >
                {MASTER_DOCS.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
              <label className="btn-ghost cursor-pointer justify-center py-1.5 text-xs">
                📎 फाइल चुनें
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => setFile(row.id, e.target.files)}
                />
              </label>
              <label className="btn-ghost cursor-pointer justify-center py-1.5 text-xs">
                📷 कैमरा
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setFile(row.id, e.target.files)}
                />
              </label>
              <button type="button" onClick={() => removeRow(row.id)} className="btn-danger justify-center py-1.5 text-xs">
                हटाएँ
              </button>
              {row.fileName ? (
                <p className="truncate text-[11px] font-semibold text-emerald-600 sm:col-span-4 dark:text-emerald-300">
                  ✅ {row.fileName}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <UpiPayBox
        upiName={upi.name}
        upiId={upi.id}
        upiMobile={upi.mobile}
        qrDataUrl={upi.qrDataUrl}
        amount={total}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">पेमेंट माध्यम</label>
          <select name="paymentMode" className="input" defaultValue="UPI">
            <option value="UPI">UPI / QR</option>
            <option value="Mobile UPI">मोबाइल नंबर UPI</option>
            <option value="Cash">दुकान पर नकद</option>
            <option value="Pending">बाद में भुगतान</option>
          </select>
        </div>
        <div>
          <label className="label">पेमेंट UTR / Txn ID</label>
          <input name="utr" className="input" placeholder="जैसे 428891204455" />
        </div>
        <div>
          <label className="label">पेमेंट स्क्रीनशॉट (वैकल्पिक)</label>
          <input type="file" name="paymentScreenshot" accept="image/*" className="input py-1.5 text-xs" />
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-sm">
        {submitting ? "⏳ भेजा जा रहा है…" : "आवेदन + पेमेंट विवरण जमा करें"}
      </button>
      <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
        सबमिट करने पर आपकी जानकारी दुकान के डैशबोर्ड व CSV/Google Sheet संग्रह में सुरक्षित रूप से दर्ज होती है।
      </p>
    </form>
  );
}
