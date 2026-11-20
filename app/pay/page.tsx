import Link from "next/link";
import { ensureSeeded } from "@/db/seed";
import { getSettings } from "@/lib/settings";
import { makeQrDataUrl, upiUri } from "@/lib/upi";
import { Card, PageHeader } from "@/components/ui";
import UpiPayBox from "@/components/UpiPayBox";

export const dynamic = "force-dynamic";
export const metadata = { title: "UPI / QR भुगतान" };

export default async function PayPage() {
  await ensureSeeded().catch(() => undefined);
  const settings = await getSettings();
  const qrDataUrl = await makeQrDataUrl(upiUri(settings.upiId, settings.upiName, undefined, "Digital Seva Kendra"));

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Payments"
        title="UPI / QR / मोबाइल नंबर भुगतान"
        subtitle="दुकान के UPI पर सीधा भुगतान करें। भुगतान के बाद UTR / Txn ID और स्क्रीनशॉट आवेदन फॉर्म में अवश्य दर्ज करें।"
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className="p-4">
          {settings.upiEnabled === "0" ? (
            <p className="rounded-2xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              ऑनलाइन UPI भुगतान अस्थायी रूप से बंद है — कृपया दुकान पर नकद भुगतान करें या 📞 {settings.phonePrimary} पर संपर्क करें।
            </p>
          ) : (
          <UpiPayBox
            upiName={settings.upiName}
            upiId={settings.upiId}
            upiMobile={settings.upiMobile}
            qrDataUrl={qrDataUrl}
          />
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              ["1", "QR स्कैन करें", "किसी भी UPI ऐप (PhonePe, GPay, Paytm) से स्कैन करें।"],
              ["2", "राशि वेरिफाई करें", "नाम Dheerendra Prajapati दिखना चाहिए — राशि जाँचें।"],
              ["3", "UTR दर्ज करें", "आवेदन फॉर्म में UTR / Txn ID व स्क्रीनशॉट अपलोड करें।"],
              ["4", "रसीद प्राप्त करें", "दुकान से पुष्टि के बाद रसीद व स्थिति अपडेट।"],
            ].map(([step, title, desc]) => (
              <div key={step} className="rounded-xl border border-slate-200 p-2.5 dark:border-white/10">
                <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-300">Step {step}</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-3">
          <Card className="p-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">📱 मोबाइल नंबर से UPI</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              कई UPI ऐप में UPI ID की जगह मोबाइल नंबर से भुगतान होता है। भुगतान करते समय नाम{" "}
              <b>{settings.upiName}</b> और नंबर <b>{settings.upiMobile}</b> दिखेगा।
            </p>
            <div className="mt-2 grid gap-1.5">
              <a href={`tel:${settings.phonePrimary}`} className="btn-ghost px-3 py-2 text-xs">
                📞 भुगतान सहायता: {settings.phonePrimary}
              </a>
              <a href={`tel:${settings.phoneSecondary}`} className="btn-ghost px-3 py-2 text-xs">
                📞 वैकल्पिक: {settings.phoneSecondary}
              </a>
              <a
                href={`https://wa.me/91${settings.phonePrimary}?text=${encodeURIComponent("मैंने UPI भुगतान किया है, UTR भेज रहा हूँ।")}`}
                target="_blank"
                rel="noreferrer"
                className="btn bg-emerald-500 px-3 py-2 text-xs text-white hover:bg-emerald-600"
              >
                💬 WhatsApp पर UTR भेजें
              </a>
            </div>
          </Card>
          <Card className="border-amber-300 p-4 dark:border-amber-400/30">
            <h2 className="text-sm font-extrabold text-amber-800 dark:text-amber-200">⚠️ सुरक्षा चेतावनी</h2>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-200/90">
              <li>कभी भी OTP, PIN या पासवर्ड किसी को न बताएँ।</li>
              <li>भुगतान केवल ऊपर दिख रहे UPI ID पर करें।</li>
              <li>रसीद के बिना नकद भुगतान न करें।</li>
              <li>संदेह हो तो दुकान पर सीधे संपर्क करें।</li>
            </ul>
          </Card>
          <Card className="p-4">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">भुगतान के बाद</h2>
            <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs font-bold">
              <Link href="/services" className="rounded-xl bg-indigo-50 py-2 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                सेवा चुनें
              </Link>
              <Link href="/customer/login" className="rounded-xl bg-slate-100 py-2 dark:bg-white/10">
                मेरी रसीद
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
