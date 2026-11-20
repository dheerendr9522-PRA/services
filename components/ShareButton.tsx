"use client";

import { useState } from "react";

export default function ShareButton({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.origin;
    const payload = { title, text, url };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* fall back to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" onClick={share} className="btn-ghost px-3 py-2 text-xs">
      {copied ? "✅ लिंक कॉपी हुआ" : "📤 ऐप शेयर करें"}
    </button>
  );
}
