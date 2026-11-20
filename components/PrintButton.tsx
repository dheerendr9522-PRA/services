"use client";

export default function PrintButton({ label = "🖨️ रसीद प्रिंट करें" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-ghost no-print px-2.5 py-1.5 text-xs">
      {label}
    </button>
  );
}
