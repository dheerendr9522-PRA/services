import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "ऐप फ्रेम" };

export default async function AppFramePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; name?: string }>;
}) {
  const { url = "", name = "ऐप" } = await searchParams;
  const safe = /^https?:\/\//i.test(url) || url.startsWith("/") ? url : "";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Link href="/apps" className="btn-ghost px-2.5 py-1.5 text-xs">← Back</Link>
        <span className="text-sm font-extrabold text-slate-900 dark:text-white">{name}</span>
        <span className="truncate font-mono text-[10px] text-slate-400">{safe}</span>
        {safe && /^https?:\/\//i.test(safe) ? (
          <a href={safe} target="_blank" rel="noreferrer" className="btn-primary ml-auto px-2.5 py-1.5 text-[11px]">↗ नए टैब में खोलें</a>
        ) : null}
      </div>
      {safe ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
          <iframe src={safe} title={name} className="h-[78vh] w-full" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="no-referrer" />
        </div>
      ) : (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">अमान्य लिंक — एडमिन से सही URL जोड़वाएँ।</p>
      )}
      <p className="text-[10px] text-slate-400">
        सुरक्षा: कुछ वेबसाइटें (बैंक, सरकारी पोर्टल) फ्रेम में खुलने की अनुमति नहीं देतीं — वहाँ ऊपर का “नए टैब में खोलें” उपयोग करें।
        OTP/PIN कभी इस फ्रेम में न डालें जब तक URL विश्वसनीय न हो।
      </p>
    </div>
  );
}
