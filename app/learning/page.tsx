import Link from "next/link";
import { db } from "@/db";
import { learnings } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { getSettings } from "@/lib/settings";
import { PageHeader, Card } from "@/components/ui";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "सेवा सीखें — स्टेप बाय स्टेप ट्रेनिंग" };

export default async function LearningPage() {
  await ensureSeeded().catch(() => undefined);
  const [rows, settings] = await Promise.all([db.select().from(learnings), getSettings()]);
  const active = rows.filter((r) => r.active);

  return (
    <div className="space-y-4">
      <BackButton />
      <PageHeader
        eyebrow="Service Learning"
        title="🎓 सेवा सीखें — स्टेप बाय स्टेप ट्रेनिंग"
        subtitle="हर सेवा की पूरी प्रक्रिया — पात्रता, दस्तावेज़, वेबसाइट, फॉर्म भरने का तरीका, फीस, चेकलिस्ट और सामान्य गलतियाँ। दुकान के कर्मचारी व ग्राहक दोनों के लिए।"
        actions={<a href={`tel:${settings.phonePrimary}`} className="btn-primary px-3 py-1.5 text-xs">📞 सहायता</a>}
      />
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {active.map((item) => (
          <Card key={item.id} className="flex flex-col gap-1 p-3">
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">{item.serviceName}</p>
            <p className="line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">{item.intro}</p>
            <p className="text-[10px] text-slate-400">{item.steps.length} स्टेप · {item.mistakes ? "गलतियाँ सूची" : ""}</p>
            <Link href={`/learning/${item.id}`} className="btn-primary mt-auto px-2.5 py-1.5 text-[11px]">📖 प्रशिक्षण खोलें</Link>
          </Card>
        ))}
        {active.length === 0 ? <p className="text-xs text-slate-400">अभी कोई ट्रेनिंग नहीं जोड़ी गई।</p> : null}
      </div>
    </div>
  );
}
