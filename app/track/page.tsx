import Link from "next/link";
import { ensureSeeded } from "@/db/seed";
import { getApplicationByRef, getApplicationDocuments } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";
import { Badge, Card, PageHeader } from "@/components/ui";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "आवेदन व रिपेयर ट्रैकिंग" };

const STEPS = ["Pending", "In Progress", "Completed"];

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; mobile?: string }>;
}) {
  await ensureSeeded().catch(() => undefined);
  const { ref = "", mobile = "" } = await searchParams;
  const application = ref ? await getApplicationByRef(ref, mobile || undefined) : null;
  const documents = application ? await getApplicationDocuments([application.id]) : [];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Tracking"
        title="आवेदन व रिपेयर ट्रैकिंग"
        subtitle="ट्रैकिंग नंबर (जैसे DP-R2001) और मोबाइल नंबर से अपने काम की स्थिति देखें, तैयार दस्तावेज़ डाउनलोड करें व रसीद प्रिंट करें।"
      />

      <Card className="p-4">
        <form action="/track" className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="label">ट्रैकिंग / आवेदन नंबर</label>
            <input name="ref" defaultValue={ref} className="input" placeholder="DP-R2001" required />
          </div>
          <div>
            <label className="label">मोबाइल नंबर (वैकल्पिक)</label>
            <input name="mobile" defaultValue={mobile} className="input" inputMode="numeric" placeholder="9425012345" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full sm:w-auto">
              🔍 स्थिति देखें
            </button>
          </div>
        </form>
        <p className="mt-2 rounded-xl bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
          डेमो: ट्रैकिंग नंबर <b>DP-R2001</b> · मोबाइल <b>9425012345</b> — पहली बार खोलते ही काम करता है।
        </p>
      </Card>

      {ref && !application ? (
        <Card className="border-rose-300 p-4 dark:border-rose-400/30">
          <p className="text-sm font-extrabold text-rose-700 dark:text-rose-300">कोई आवेदन नहीं मिला</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            ट्रैकिंग नंबर जाँचें। सहायता के लिए 📞 7610420959 पर कॉल करें। कस्टमर लॉगिन से सभी आवेदन देखें।
          </p>
          <Link href="/customer/login" className="btn-primary mt-2 px-3 py-1.5 text-xs">
            कस्टमर लॉगिन
          </Link>
        </Card>
      ) : null}

      {application ? (
        <Card className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-300">{application.refNo}</p>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{application.serviceName}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {application.customerName} · {application.mobile} · {formatDateTime(application.createdAt)}
              </p>
            </div>
            <Badge tone={application.status === "Completed" ? "emerald" : application.status === "Pending" ? "amber" : "sky"}>
              {application.status}
            </Badge>
          </div>

          <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
            {STEPS.map((step, index) => {
              const currentIndex = STEPS.indexOf(application.status);
              const done = currentIndex >= index;
              return (
                <div
                  key={step}
                  className={`rounded-xl border px-2.5 py-2 text-xs font-bold ${
                    done
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5"
                  }`}
                >
                  {done ? "✅" : index + 1} {step}
                  <span className="block text-[10px] font-medium opacity-80">
                    {step === "Pending" ? "आवेदन प्राप्त" : step === "In Progress" ? "काम चल रहा है" : "तैयार / पूर्ण"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-2.5 dark:border-white/10">
              <p className="font-bold text-slate-700 dark:text-slate-200">भुगतान विवरण</p>
              <p className="text-slate-500 dark:text-slate-400">
                राशि ₹{application.amount} · {application.paymentMode}
                {application.utr ? ` · UTR ${application.utr}` : ""}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-2.5 dark:border-white/10">
              <p className="font-bold text-slate-700 dark:text-slate-200">दुकान नोट</p>
              <p className="text-slate-500 dark:text-slate-400">{application.adminNote || "कोई नोट नहीं"}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {application.completedFileId ? (
              <a href={`/api/files/${application.completedFileId}`} className="btn-primary px-3 py-1.5 text-xs">
                ⬇️ तैयार दस्तावेज़ डाउनलोड
              </a>
            ) : null}
            {documents.length > 0 ? (
              <a href={`/api/applications/${application.id}/zip`} className="btn-ghost px-3 py-1.5 text-xs">
                📦 सभी दस्तावेज़ (ZIP)
              </a>
            ) : null}
            <PrintButton />
            <Link href={`/service/${application.serviceSlug}`} className="btn-ghost px-3 py-1.5 text-xs">
              🔁 फिर से आवेदन
            </Link>
          </div>
        </Card>
      ) : null}

      <Card className="p-4">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">रिपेयर जॉब ट्रैकिंग</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          कंप्यूटर/लैपटॉप/प्रिंटर रिपेयर के लिए जॉब कार्ड नंबर (जैसे RJ-2001) की स्थिति दुकान पर कॉल करके या
          WhatsApp पर पूछें। जॉब कार्ड व रसीद प्रिंट दुकान पर उपलब्ध है।
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <a href="tel:7610420959" className="btn-primary px-3 py-1.5 text-xs">
            📞 रिपेयर स्थिति पूछें
          </a>
          <a
            href="https://wa.me/917610420959?text=%E0%A4%B0%E0%A4%BF%E0%A4%AA%E0%A5%87%E0%A4%AF%E0%A4%B0%20%E0%A4%9C%E0%A5%89%E0%A4%AC%20%E0%A4%B8%E0%A5%8D%E0%A4%A5%E0%A4%BF%E0%A4%A4%E0%A4%BF"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost px-3 py-1.5 text-xs"
          >
            💬 WhatsApp
          </a>
        </div>
      </Card>
    </div>
  );
}
