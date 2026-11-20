"use client";

import { useState } from "react";

export default function UpiPayBox({
  upiName,
  upiId,
  upiMobile,
  qrDataUrl,
  amount,
  compact = false,
}: {
  upiName: string;
  upiId: string;
  upiMobile: string;
  qrDataUrl: string;
  amount?: number;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&cu=INR${
    amount ? `&am=${amount}` : ""
  }`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3 dark:border-indigo-400/20 dark:bg-indigo-500/10">
      <div className={`flex ${compact ? "flex-row items-center" : "flex-col sm:flex-row"} gap-3`}>
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt="UPI QR Code"
            className="h-[132px] w-[132px] shrink-0 rounded-xl border border-white bg-white p-1 shadow-sm"
          />
        ) : null}
        <div className="min-w-0 flex-1 text-sm">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
            ऑनलाइन UPI / QR भुगतान
          </p>
          <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">नाम: {upiName}</p>
          <p className="font-mono text-[13px] font-bold text-slate-900 dark:text-white">UPI ID: {upiId}</p>
          <p className="text-[12px] text-slate-600 dark:text-slate-300">
            मोबाइल UPI: <span className="font-semibold">{upiMobile}</span>
          </p>
          {amount ? (
            <p className="mt-1 text-sm font-extrabold text-indigo-700 dark:text-indigo-200">
              देय राशि: ₹{amount}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" onClick={copy} className="btn-primary px-2.5 py-1.5 text-xs">
              {copied ? "✅ कॉपी हुआ" : "UPI कॉपी करें"}
            </button>
            <a href={upiLink} className="btn-ghost px-2.5 py-1.5 text-xs">
              UPI ऐप खोलें
            </a>
          </div>
        </div>
      </div>
      <p className="mt-2 rounded-xl bg-white/70 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
        भुगतान के बाद <b>UTR / Txn ID</b> व स्क्रीनशॉट अपलोड करें। भुगतान सीधे दुकान के UPI पर जाता है — कभी भी
        OTP/PIN किसी को न बताएँ।
      </p>
    </div>
  );
}
