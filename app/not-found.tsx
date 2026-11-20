import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-indigo-100 text-3xl dark:bg-indigo-500/15">🧭</div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">पेज नहीं मिला</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        यह लिंक उपलब्ध नहीं है। आप होम डैशबोर्ड से सभी सेवाएँ देख सकते हैं या दुकान पर कॉल कर सकते हैं।
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn-primary px-3 py-2 text-xs">
          🏠 होम
        </Link>
        <Link href="/services" className="btn-ghost px-3 py-2 text-xs">
          🧾 सभी सेवाएँ
        </Link>
        <a href="tel:7610420959" className="btn-ghost px-3 py-2 text-xs">
          📞 7610420959
        </a>
      </div>
    </div>
  );
}
