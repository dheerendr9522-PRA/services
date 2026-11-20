"use client";

import { useState } from "react";

export default function FolderButton({ refNo, mobile }: { refNo: string; mobile: string }) {
  const [message, setMessage] = useState("");
  async function open() {
    setMessage("⏳ फोल्डर बन रहा है…");
    const response = await fetch(`/api/customer-folder?mobile=${encodeURIComponent(mobile)}`).catch(() => null);
    if (!response || !response.ok) {
      setMessage("❌ फोल्डर नहीं बना");
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `customer-${mobile}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("✅ ग्राहक के सभी आवेदन व दस्तावेज़ एक फोल्डर (ZIP) में डाउनलोड");
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <button type="button" onClick={open} className="btn-soft px-2.5 py-1.5 text-[11px]">📁 ग्राहक फोल्डर (सभी आवेदन)</button>
      {message ? <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{message}</span> : null}
      <span className="hidden">{refNo}</span>
    </span>
  );
}
