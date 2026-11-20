import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { repairs } from "@/db/schema";
import { requireStaff } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import { formatDateTime, formatINR, statusTone } from "@/lib/utils";
import { Card } from "@/components/ui";
import BackButton from "@/components/BackButton";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function RepairJobCardPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const rows = await db.select().from(repairs).where(eq(repairs.id, Number(id))).limit(1);
  const job = rows[0];
  if (!job) notFound();
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <BackButton />
      <div className="no-print flex items-center justify-between">
        <Link href="/admin/repairs" className="text-xs font-bold text-indigo-600 dark:text-indigo-300">
          ← रिपेयर जॉब सूची
        </Link>
        <PrintButton label="🖨 जॉब कार्ड प्रिंट" />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 pb-2 dark:border-white/10">
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white">{settings.businessName}</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{settings.address} · 📞 {settings.phonePrimary}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Repair Job Card</p>
            <p className="font-mono text-lg font-black text-slate-900 dark:text-white">{job.jobNo}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDateTime(job.createdAt)}</p>
          </div>
        </div>

        <div className="mt-2 grid gap-1.5 text-xs sm:grid-cols-2">
          {[
            ["ग्राहक", job.customerName],
            ["मोबाइल", job.mobile],
            ["डिवाइस", job.device],
            ["समस्या", job.issue],
            ["टेक्नीशियन", job.technician || "—"],
            ["स्थिति", job.status],
            ["अनुमानित राशि", formatINR(job.estimate)],
            ["अंतिम राशि", formatINR(job.finalAmount)],
            ["नोट", job.notes || "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 px-2.5 py-1.5 dark:border-white/10">
              <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
          ))}
        </div>
        <span className={`chip mt-2 ${statusTone(job.status)}`}>{job.status}</span>
        <p className="mt-3 border-t border-dashed border-slate-300 pt-2 text-[10px] text-slate-400">
          ग्राहक की जानकारी केवल दुकान के रिकॉर्ड हेतु। डिवाइस में डेटा बैकअप ग्राहक की ज़िम्मेदारी है।
        </p>
      </Card>
    </div>
  );
}
