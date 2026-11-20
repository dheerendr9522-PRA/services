import { db } from "@/db";
import { profileEvents } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { requireStaff } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import { matchesFilters, parseFilters } from "@/lib/filters";
import { formatDate } from "@/lib/utils";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import AdminFilterBar from "@/components/AdminFilterBar";
import PrintButton from "@/components/PrintButton";
import { googleConfig } from "@/lib/googleSheet";

export const dynamic = "force-dynamic";
export const metadata = { title: "DP बिज़नेस प्रोफाइल" };

export default async function AdminBusinessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await ensureSeeded().catch(() => undefined);
  await requireStaff();
  const filters = parseFilters(await searchParams);
  const [settings, events] = await Promise.all([getSettings(), db.select().from(profileEvents)]);
  const inRange = events.filter((e) => matchesFilters(e.createdAt, filters));
  const count = (kind: string) => inRange.filter((e) => e.kind === kind).length;
  const months: { label: string; views: number; calls: number }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    months.push({
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      views: events.filter((e) => e.kind === "view" && e.createdAt.toISOString().slice(0, 7) === key).length,
      calls: events.filter((e) => e.kind === "call" && e.createdAt.toISOString().slice(0, 7) === key).length,
    });
  }
  const maxViews = Math.max(1, ...months.map((m) => m.views));
  const keywords = Object.entries(inRange.reduce<Record<string, number>>((acc, e) => {
    if (e.label) acc[e.label] = (acc[e.label] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const configured = googleConfig().configured;

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="DP Business Profile"
        title="🏪 दुकान की ऑनलाइन पहुँच — रिपोर्ट"
        subtitle="प्रोफाइल व्यू, कॉल/WhatsApp/दिशा क्लिक, खोज शब्द — चार्ट व फ़िल्टर सहित। रिपोर्ट Google Sheet व CSV में भी जाती है।"
        actions={
          <>
            <a href={settings.gmbLink} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 text-xs">🔗 Google Business</a>
            <a href="/business" className="btn-ghost px-3 py-1.5 text-xs">🌐 पब्लिक प्रोफाइल</a>
            <PrintButton label="🖨 रिपोर्ट प्रिंट" />
          </>
        }
      />
      <AdminFilterBar label="रिपोर्ट अवधि" searchPlaceholder="खोज शब्द…" exportHref="/exports/audit.csv" />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="👁" label="प्रोफाइल व्यू" value={count("view")} tone="indigo" />
        <Stat icon="📞" label="कॉल क्लिक" value={count("call")} tone="emerald" />
        <Stat icon="💬" label="WhatsApp क्लिक" value={count("whatsapp")} tone="sky" />
        <Stat icon="🗺️" label="दिशा क्लिक" value={count("direction")} tone="amber" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">📈 पिछले 6 माह — व्यू व कॉल (चार्ट)</h2>
          <div className="mt-2 flex h-36 items-end gap-2">
            {months.map((month) => (
              <div key={month.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-28 w-full items-end justify-center gap-0.5">
                  <div className="w-1/2 rounded-t bg-indigo-500" style={{ height: `${(month.views / maxViews) * 100}%` }} title={`${month.views} views`} />
                  <div className="w-1/3 rounded-t bg-emerald-400" style={{ height: `${(month.calls / maxViews) * 100}%` }} title={`${month.calls} calls`} />
                </div>
                <span className="text-[10px] font-bold text-slate-500">{month.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-slate-400">नीला = प्रोफाइल व्यू · हरा = कॉल क्लिक</p>
        </Card>

        <Card className="p-3">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">🔍 ग्राहक किन शब्दों से खोजते हैं</h2>
          <div className="mt-2 space-y-1.5">
            {keywords.map(([label, value]) => (
              <div key={label}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="truncate text-slate-600 dark:text-slate-300">{label}</span>
                  <span className="font-bold text-slate-500">{value}</span>
                </div>
                <span className="mt-0.5 block h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${(value / (keywords[0]?.[1] ?? 1)) * 100}%` }} />
                </span>
              </div>
            ))}
            {keywords.length === 0 ? <p className="text-xs text-slate-400">कोई डेटा नहीं।</p> : null}
          </div>
        </Card>
      </div>

      <Card className="p-3">
        <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">📄 हाल की गतिविधि (क्लिक करने पर विवरण)</h2>
        <div className="mt-1.5 max-h-64 overflow-y-auto">
          <table className="table-base">
            <thead><tr><th>समय</th><th>प्रकार</th><th>विवरण</th><th>स्रोत</th></tr></thead>
            <tbody>
              {inRange.slice(0, 40).map((event) => (
                <tr key={event.id}>
                  <td className="whitespace-nowrap text-[11px]">{formatDate(event.createdAt)}</td>
                  <td><span className="chip bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{event.kind}</span></td>
                  <td className="text-[11px]">{event.label || "—"}</td>
                  <td className="text-[11px] text-slate-400">{event.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">
          Google Sheet स्थिति: {configured ? "✅ कनेक्टेड — /admin/sheets से सिंक करें" : "⚠ सेट नहीं — /admin/sheets पर जाएँ"} · CSV डाउनलोड उपलब्ध।
        </p>
      </Card>
    </div>
  );
}
