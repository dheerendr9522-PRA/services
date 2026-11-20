import Link from "next/link";
import { ensureSeeded } from "@/db/seed";
import { getSettings } from "@/lib/settings";
import { Card, PageHeader } from "@/components/ui";
import ShareButton from "@/components/ShareButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "संपर्क करें" };

export default async function ContactPage() {
  await ensureSeeded().catch(() => undefined);
  const settings = await getSettings();

  const actions = [
    { href: `tel:${settings.phonePrimary}`, icon: "📞", title: "अभी कॉल करें", hint: settings.phonePrimary, tone: "bg-emerald-500" },
    { href: `tel:${settings.phoneSecondary}`, icon: "☎️", title: "दूसरा नंबर", hint: settings.phoneSecondary, tone: "bg-teal-500" },
    {
      href: `https://wa.me/91${settings.phonePrimary}?text=${encodeURIComponent("नमस्ते, मुझे डिजिटल सेवा की जानकारी चाहिए।")}`,
      icon: "💬",
      title: "WhatsApp पूछताछ",
      hint: "तुरंत उत्तर",
      tone: "bg-emerald-600",
    },
    { href: `mailto:${settings.email}`, icon: "✉️", title: "ईमेल भेजें", hint: settings.email, tone: "bg-indigo-600" },
    { href: settings.mapsUrl, icon: "🗺️", title: "दिशा-निर्देश", hint: "Google Maps", tone: "bg-sky-600" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Contact"
        title="संपर्क करें"
        subtitle={`${settings.businessName} · ${settings.address}`}
        actions={<ShareButton title="Dheerendra Digital Seva Kendra" text="अपनी डिजिटल सेवाएँ एक ही जगह —" />}
      />

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <a
            key={action.title}
            href={action.href}
            target={action.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="card flex items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={`grid h-10 w-10 place-items-center rounded-xl text-lg text-white ${action.tone}`}>{action.icon}</span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold text-slate-800 dark:text-slate-100">{action.title}</span>
              <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{action.hint}</span>
            </span>
          </a>
        ))}
        <div className="card flex items-center gap-3 p-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-lg text-white">⬇️</span>
          <span>
            <span className="block text-sm font-extrabold text-slate-800 dark:text-slate-100">ऐप इंस्टॉल करें</span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
              Chrome मेन्यू → &quot;Add to Home screen&quot;
            </span>
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🏪 दुकान की जानकारी</h2>
          <div className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{settings.businessName}</p>
            <p>मालिक: {settings.ownerName}</p>
            <p>📍 {settings.address}</p>
            <p>📞 {settings.phonePrimary} · {settings.phoneSecondary}</p>
            <p>✉️ {settings.email}</p>
            <p>💳 UPI: {settings.upiId}</p>
            <p>🕘 समय: सोमवार – शनिवार, 9:30 AM – 8:00 PM (रविवार: फोन पर उपलब्ध)</p>
          </div>
          <div className="mt-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-3 text-xs text-white">
            <p className="font-bold">सेवाएँ शुरू करें</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Link href="/services" className="btn bg-white px-2.5 py-1 text-[11px] text-indigo-700">
                सभी सेवाएँ
              </Link>
              <Link href="/pay" className="btn bg-white/15 px-2.5 py-1 text-[11px]">
                UPI भुगतान
              </Link>
              <Link href="/track" className="btn bg-white/15 px-2.5 py-1 text-[11px]">
                आवेदन ट्रैक
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">📍 दुकान कैसे पहुँचें</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            बाजार मोहल्ला, अमानगंज, जिला पन्ना (म.प्र.) — 488441। मुख्य बाजार में पन्ना-सतना मार्ग के पास।
          </p>
          <a
            href={settings.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block rounded-2xl bg-slate-100 p-6 text-center text-xs font-bold text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300"
          >
            🗺️ Google Maps पर दिशा-निर्देश खोलें
          </a>
          <p className="mt-2 rounded-xl bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            किसी भी सरकारी सेवा में स्वीकृति विभाग के अधिकार क्षेत्र में है। दुकान केवल आवेदन सहायता प्रदान करती है।
          </p>
        </Card>
      </div>
    </div>
  );
}
