"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteDocButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm("यह दस्तावेज़ हटाना है?")) return;
    setBusy(true);
    const response = await fetch(`/api/documents/${id}`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!response || !response.ok) {
      window.alert("केवल Owner दस्तावेज़ हटा सकता है");
      return;
    }
    router.refresh();
  }

  return (
    <button type="button" onClick={remove} disabled={busy} className="btn-danger px-2 py-1 text-[11px]">
      🗑 Delete
    </button>
  );
}
