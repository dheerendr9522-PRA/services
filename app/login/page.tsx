import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureSeeded } from "@/db/seed";
import { getStaffSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import LoginForm from "@/components/LoginForm";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "स्टाफ / एडमिन लॉगिन" };

export default async function StaffLoginPage() {
  await ensureSeeded().catch(() => undefined);
  const [session, settings] = await Promise.all([getStaffSession(), getSettings()]);
  if (session) redirect("/admin");

  const loginVisible = settings.loginPageVisible !== "0";

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
      <Card className="overflow-hidden p-0">
        <div className="bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Staff access</p>
          <h1 className="mt-1 text-2xl font-black">स्टाफ / एडमिन लॉगिन</h1>
          <p className="mt-1 text-sm text-white/85">{settings.businessName}</p>
          <p className="mt-2 text-xs leading-relaxed text-white/75">
            Owner को पूरा अधिकार (जोड़ें/हटाएँ/बदलें)। Manager रिकॉर्ड प्रबंधन कर सकता है। Operator केवल दैनिक
            प्रविष्टि कर सकता है।
          </p>
        </div>
        <div className="p-4">
          <LoginForm
            mode={loginVisible ? "staff" : "locked"}
            loginVisible={loginVisible}
            showCredentials={settings.showCredentials !== "0" && loginVisible}
            displayId={settings.displayLoginId}
            displayPassword={settings.displayLoginPassword}
          />
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-[11px] dark:border-white/10">
            <Link href="/customer/login" className="font-bold text-indigo-600 dark:text-indigo-300">
              👤 कस्टमर लॉगिन
            </Link>
            <Link href="/" className="font-bold text-slate-500 dark:text-slate-400">
              ← होम
            </Link>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <Card className="p-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🔐 भूमिका व अधिकार</h2>
          <div className="mt-2 space-y-2 text-xs">
            {[
              ["Owner", "पूरा नियंत्रण — सेवा/मेन्यू/इनवॉइस जोड़ें, बदलें व हटाएँ; सेटिंग्स व लॉगिन नियंत्रण।", "from-indigo-500 to-violet-500"],
              ["Manager", "रिकॉर्ड बनाना व अपडेट करना; मुख्य आइटम हटाना व फंक्शन जोड़ना नहीं।", "from-emerald-500 to-teal-500"],
              ["Operator", "केवल दैनिक प्रविष्टि — ग्राहक, आवेदन स्थिति व बिलिंग।", "from-amber-500 to-orange-500"],
            ].map(([role, desc, tone]) => (
              <div key={role} className="flex gap-2 rounded-xl border border-slate-200 p-2 dark:border-white/10">
                <span className={`mt-0.5 h-6 w-6 shrink-0 rounded-lg bg-gradient-to-br ${tone} text-center text-[10px] font-bold leading-6 text-white`}>
                  {role.slice(0, 2)}
                </span>
                <div>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100">{role}</p>
                  <p className="text-slate-500 dark:text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🛡️ सुरक्षा सूचना</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            ग्राहक लॉगिन व कस्टमर डैशबोर्ड से एडमिन लिंक पूरी तरह छिपे रहते हैं। लॉगिन पेज को एडमिन सेटिंग्स से
            Show/Hide किया जा सकता है; छिपाने पर Owner Access Key से अनलॉक होता है।
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs font-bold">
            <Link href="/track" className="rounded-xl bg-slate-100 py-2 hover:bg-slate-200 dark:bg-white/10">
              📍 ट्रैक
            </Link>
            <Link href="/pay" className="rounded-xl bg-slate-100 py-2 hover:bg-slate-200 dark:bg-white/10">
              💳 UPI पे
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
