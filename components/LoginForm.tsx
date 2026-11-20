"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DEMO_ACCOUNTS = [
  { username: "dheerendra", password: "Dheeru@2026", label: "Owner" },
  { username: "manager", password: "Manager@2026", label: "Manager" },
  { username: "operator", password: "Shop@2026", label: "Operator" },
];

export default function LoginForm({
  mode,
  showCredentials,
  displayId,
  displayPassword,
  loginVisible,
}: {
  mode: "staff" | "locked";
  showCredentials: boolean;
  displayId: string;
  displayPassword: string;
  loginVisible: boolean;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "staff", username, password }),
      });
      const json = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !json.ok) {
        setError(json.error || "लॉगिन नहीं हो सका");
        setLoading(false);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("नेटवर्क त्रुटि");
      setLoading(false);
    }
  }

  if (!loginVisible && mode === "locked") {
    return (
      <form onSubmit={submit} className="space-y-3">
        <div className="rounded-2xl bg-slate-900 p-5 text-center text-white dark:bg-black/40">
          <p className="text-3xl">🔒</p>
          <h2 className="mt-2 text-lg font-extrabold">एडमिन लॉगिन पेज अस्थायी रूप से बंद है</h2>
          <p className="mt-1 text-xs text-white/70">
            दुकान मालिक अपना Owner Access Key दर्ज करके सीधे डैशबोर्ड खोल सकता है।
          </p>
        </div>
        <div>
          <label className="label">Owner Access Key</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="input"
            placeholder="Owner access key दर्ज करें"
            autoFocus
          />
        </div>
        {error ? <p className="text-xs font-semibold text-rose-600 dark:text-rose-300">{error}</p> : null}
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? "⏳ जाँच…" : "🔓 अनलॉक करें"}
        </button>
        <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
          सामान्य ग्राहक सेवाओं के लिए{" "}
          <a href="/customer/login" className="font-bold text-indigo-600 dark:text-indigo-300">
            कस्टमर लॉगिन
          </a>{" "}
          उपयोग करें।
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">यूज़रनेम / ID</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input"
          placeholder="dheerendra"
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="label">पासवर्ड</label>
        <div className="flex gap-2">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            className="input"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <button type="button" onClick={() => setShowPassword((v) => !v)} className="btn-ghost px-2.5">
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>
      {error ? (
        <p className="rounded-xl bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
        {loading ? "⏳ लॉगिन हो रहा है…" : "🔐 स्टाफ लॉगिन करें"}
      </button>

      {showCredentials ? (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-2.5 dark:border-indigo-400/20 dark:bg-indigo-500/10">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
            डेमो लॉगिन (भरें बटन से भर जाएगा)
          </p>
          <div className="mt-1 space-y-1">
            {DEMO_ACCOUNTS.map((account) => (
              <div key={account.username} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                  {account.label}: {account.username} / {account.password}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUsername(account.username);
                    setPassword(account.password);
                  }}
                  className="btn-soft px-2 py-1 text-[10px]"
                >
                  भरें
                </button>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400">
            डिस्प्ले ID: <b>{displayId}</b> · पासवर्ड: <b>{displayPassword}</b> (एडमिन सेटिंग्स से बदलें)
          </p>
        </div>
      ) : null}
    </form>
  );
}
