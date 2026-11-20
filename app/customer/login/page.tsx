import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureSeeded } from "@/db/seed";
import { getCustomerSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import CustomerLoginForm from "@/components/CustomerLoginForm";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "कस्टमर लॉगिन" };

export default async function CustomerLoginPage() {
  await ensureSeeded().catch(() => undefined);
  const [session, settings] = await Promise.all([getCustomerSession(), getSettings()]);
  if (session) redirect("/customer");

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Customer portal</p>
          <h1 className="mt-1 text-2xl font-black">कस्टमर लॉगिन</h1>
          <p className="mt-1 text-sm text-white/85">
            मोबाइल नंबर + 4-अंकों पिन से अपने आवेदन, स्थिति, रसीद व तैयार दस्तावेज़ देखें।
          </p>
        </div>
        <div className="p-4">
          <CustomerLoginForm pinHint={settings.customerPin || "1234"} />
          <div className="mt-3 border-t border-slate-200 pt-2 text-[11px] dark:border-white/10">
            <Link href="/" className="font-bold text-slate-500 dark:text-slate-400">
              ← होम पर लौटें
            </Link>
            <p className="mt-1 text-slate-400">
              कस्टमर पोर्टल से कोई भी एडमिन/प्रबंधन लिंक नहीं दिखता — पूर्ण गोपनीयता।
            </p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">कस्टमर पोर्टल में क्या मिलता है?</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            ["📁", "मेरे आवेदन", "Pending / In Progress / Completed स्थिति"],
            ["🖨️", "रसीद प्रिंट", "भुगतान व UTR विवरण के साथ"],
            ["📦", "तैयार दस्तावेज़", "दुकान द्वारा अपलोड सर्टिफिकेट डाउनलोड"],
            ["📍", "ट्रैकिंग", "ट्रैकिंग नंबर से स्थिति जाँच"],
          ].map(([icon, title, text]) => (
            <div key={title} className="flex gap-2 rounded-xl border border-slate-200 p-2 dark:border-white/10">
              <span className="text-lg">{icon}</span>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
