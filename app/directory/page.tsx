import Link from "next/link";
import { ensureSeeded } from "@/db/seed";
import { getStaffSession } from "@/lib/auth";
import { getWebsites } from "@/lib/queries";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "सरकारी वेबसाइट डायरेक्टरी" };

const SECTION_LABELS: Record<string, { label: string; icon: string }> = {
  mp: { label: "मध्य प्रदेश पोर्टल", icon: "🏵️" },
  central: { label: "केंद्र सरकार व सामान्य पोर्टल", icon: "🇮🇳" },
  tech: { label: "टेक व सहायक लिंक", icon: "🛠️" },
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; section?: string }>;
}) {
  await ensureSeeded().catch(() => undefined);
  const { q = "", section = "" } = await searchParams;
  const staff = await getStaffSession();
  const all = await getWebsites(false);
  const visible = staff ? all : all.filter((site) => site.active);
  const filtered = visible.filter((site) => {
    const matchSection = !section || site.section === section;
    const matchQuery = !q || `${site.name} ${site.url}`.toLowerCase().includes(q.toLowerCase());
    return matchSection && matchQuery;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Official links"
        title="सभी सरकारी वेबसाइट डायरेक्टरी"
        subtitle="म.प्र. सरकार, केंद्र सरकार व टेक पोर्टल — सभी सत्यापित लिंक एक जगह। एडमिन किसी भी वेबसाइट को ON/OFF कर सकता है या नई जोड़ सकता है।"
        actions={
          <>
            <Link href="/business" className="btn-ghost px-3 py-1.5 text-xs">🏪 DP बिज़नेस प्रोफाइल</Link>
            {staff ? (
              <Link href="/admin/websites" className="btn-primary px-3 py-1.5 text-xs">
                ⚙️ वेबसाइट प्रबंधन / ➕ Add Website
              </Link>
            ) : null}
          </>
        }
      />

      <Card className="p-3">
        <form action="/directory" className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input name="q" defaultValue={q} placeholder="वेबसाइट खोजें… (uidai, mponline, irctc)" className="input" />
          <select name="section" defaultValue={section} className="input sm:w-52">
            <option value="">सभी वर्ग</option>
            <option value="mp">मध्य प्रदेश पोर्टल</option>
            <option value="central">केंद्र सरकार</option>
            <option value="tech">टेक लिंक</option>
          </select>
          <button type="submit" className="btn-primary">
            🔍 खोजें
          </button>
        </form>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <Badge tone="indigo">कुल {visible.length} लिंक</Badge>
          <Badge tone="emerald">चालू {visible.filter((s) => s.active).length}</Badge>
          {staff ? <Badge tone="rose">बंद {all.filter((s) => !s.active).length}</Badge> : null}
          <Badge tone="amber">सभी बाहरी लिंक सरकारी/आधिकारिक स्रोत से</Badge>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon="🌐" title="कोई वेबसाइट नहीं मिली" description="खोज बदलें या एडमिन से नई वेबसाइट जोड़ें।" />
      ) : (
        ["mp", "central", "tech"].map((key) => {
          const items = filtered.filter((site) => site.section === key);
          if (items.length === 0) return null;
          const meta = SECTION_LABELS[key];
          const labels = Array.from(new Set(items.map((site) => site.groupLabel || meta.label)));
          return (
            <div key={key} className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
                <span>{meta.icon}</span> {meta.label} <Badge tone="slate">{items.length}</Badge>
              </h2>
              {labels.map((label) => {
                const groupItems = items.filter((site) => (site.groupLabel || meta.label) === label);
                return (
                  <div key={label}>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                      {label} ({groupItems.length})
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {groupItems.map((site) => (
                  <a
                    key={site.id}
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                    className="card flex items-center gap-2.5 p-2.5 transition hover:border-indigo-300 hover:shadow-sm"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-sm dark:bg-indigo-500/15">
                      {site.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">{site.name}</span>
                      <span className="block truncate text-[10px] text-slate-400">{site.url}</span>
                    </span>
                    {site.active ? (
                      <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        ON
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                        OFF
                      </span>
                    )}
                  </a>
                ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}
