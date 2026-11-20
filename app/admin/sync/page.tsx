import { desc } from "drizzle-orm";
import { db } from "@/db";
import { syncLogs } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { requireStaff } from "@/lib/guard";
import { formatDateTime, statusTone } from "@/lib/utils";
import { Card, PageHeader, Stat } from "@/components/ui";
import BackButton from "@/components/BackButton";
import OfflineBar from "@/components/OfflineBar";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "बैकअप, ऑफलाइन सिंक व रिकवरी" };

export default async function AdminSyncPage() {
  await ensureSeeded().catch(() => undefined);
  await requireStaff();
  const logs = await db.select().from(syncLogs).orderBy(desc(syncLogs.createdAt)).limit(100);

  return (
    <div className="space-y-3">
      <BackButton />
      <PageHeader
        eyebrow="Offline · Sync · Backup"
        title="🔄 ऑफलाइन सिंक, बैकअप व रिकवरी"
        subtitle="इंटरनेट बंद होने पर बिल/ग्राहक रिकॉर्ड स्थानीय रूप से सुरक्षित रहते हैं और इंटरनेट आने पर सर्वर पर सिंक होते हैं (Unique Key से डुप्लीकेट रुकते हैं)।"
        actions={<><a href="/api/backup" className="btn-primary px-3 py-1.5 text-xs">💾 Create Backup (JSON)</a><PrintButton label="🖨 सिंक रिपोर्ट" /></>}
      />
      <OfflineBar />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon="📤" label="सिंक लॉग" value={logs.length} tone="indigo" />
        <Stat icon="✅" label="सफल" value={logs.filter((l) => l.status === "synced").length} tone="emerald" />
        <Stat icon="❌" label="विफल" value={logs.filter((l) => l.status === "failed").length} tone="rose" />
        <Stat icon="📱" label="डिवाइस" value={new Set(logs.map((l) => l.device)).size} tone="sky" />
      </div>
      <Card className="p-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
        <p className="font-bold text-slate-800 dark:text-slate-100">📌 Offline सीमाएँ (स्पष्ट)</p>
        <p>• ऑफलाइन बिल/ग्राहक ड्राफ्ट स्थानीय ब्राउज़र स्टोरेज में सुरक्षित रहते हैं; सिंक पर स्थायी Database में जाते हैं।</p>
        <p>• UPI सत्यापन, सरकारी पोर्टल पर फॉर्म जमा करना, रेल टिकट बुकिंग व Google Sheet लाइव अपडेट — इनके लिए इंटरनेट अनिवार्य है।</p>
        <p>• Google Sheet सिंक: सर्वर से होता है (Service Account / Webhook)। क्रेडेंशियल केवल सर्वर पर रहते हैं।</p>
        <p>• वास्तविक Push Notification के लिए Web-Push (VAPID) या Firebase कुंजियाँ आवश्यक हैं।</p>
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="table-base">
          <thead><tr><th>समय</th><th>रिकॉर्ड</th><th>Offline Key</th><th>स्थिति</th><th>संदेश</th><th>डिवाइस</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap text-[11px]">{formatDateTime(log.createdAt)}</td>
                <td className="text-[11px] font-semibold">{log.entity}</td>
                <td className="font-mono text-[10px] text-slate-400">{log.offlineKey || "—"}</td>
                <td><span className={`chip ${statusTone(log.status === "synced" ? "Completed" : "Rejected")}`}>{log.status}</span></td>
                <td className="text-[11px] text-slate-500 dark:text-slate-400">{log.message || "—"}</td>
                <td className="text-[11px] text-slate-400">{log.device}</td>
              </tr>
            ))}
            {logs.length === 0 ? <tr><td colSpan={6} className="py-8 text-center text-xs text-slate-400">अभी कोई ऑफलाइन सिंक नहीं हुआ।</td></tr> : null}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
