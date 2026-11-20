"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type QueueItem = { key: string; entity: "bill" | "application" | "customer" | "stock"; payload: Record<string, unknown>; createdAt: string };

type OfflineContext = {
  online: boolean;
  pending: QueueItem[];
  syncing: boolean;
  message: string;
  queue: (item: Omit<QueueItem, "createdAt">) => void;
  syncNow: () => Promise<void>;
  clearQueue: () => void;
};

const STORAGE_KEY = "dp-offline-queue";
const Context = createContext<OfflineContext | null>(null);

export function useOffline() {
  const ctx = useContext(Context);
  return (
    ctx ?? {
      online: true,
      pending: [],
      syncing: false,
      message: "",
      queue: () => undefined,
      syncNow: async () => undefined,
      clearQueue: () => undefined,
    }
  );
}

export default function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState<QueueItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  const persist = useCallback((items: QueueItem[]) => {
    setPending(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPending(JSON.parse(raw) as QueueItem[]);
    } catch {}
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const queue = useCallback(
    (item: Omit<QueueItem, "createdAt">) => {
      setPending((prev) => {
        const next = [...prev, { ...item, createdAt: new Date().toISOString() }];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      setMessage("📥 रिकॉर्ड स्थानीय रूप से सुरक्षित — इंटरनेट आने पर Sync करें");
    },
    [],
  );

  const syncNow = useCallback(async () => {
    if (pending.length === 0) {
      setMessage("कोई लंबित रिकॉर्ड नहीं — सब सिंक है");
      return;
    }
    setSyncing(true);
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queue: pending, device: "web" }),
    }).catch(() => null);
    setSyncing(false);
    if (!response || !response.ok) {
      setMessage("❌ सिंक विफल — रिकॉर्ड सुरक्षित हैं, दोबारा कोशिश करें");
      return;
    }
    const json = (await response.json()) as { results?: { ok: boolean; message: string }[] };
    const failed = (json.results ?? []).filter((r) => !r.ok);
    setMessage(`✅ ${(json.results ?? []).length - failed.length} रिकॉर्ड सिंक · ${failed.length} विफल`);
    persist([]);
  }, [pending, persist]);

  const clearQueue = useCallback(() => {
    if (!window.confirm("स्थानीय लंबित रिकॉर्ड मिटाएँ? यह वापस नहीं आएंगे।")) return;
    persist([]);
    setMessage("🗑️ स्थानीय क्यू साफ़ कर दी गई");
  }, [persist]);

  const value = useMemo(
    () => ({ online, pending, syncing, message, queue, syncNow, clearQueue }),
    [online, pending, syncing, message, queue, syncNow, clearQueue],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
