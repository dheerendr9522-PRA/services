"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ label = "Back", href }: { label?: string; href?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (href) router.push(href);
        else router.back();
      }}
      className="btn-ghost no-print px-2.5 py-1.5 text-xs"
    >
      ← {label}
    </button>
  );
}
