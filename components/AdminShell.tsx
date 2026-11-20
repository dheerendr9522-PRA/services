"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import OfflineBar from "@/components/OfflineBar";
import BackButton from "@/components/BackButton";

export type AdminNavItem = { href: string; label: string; icon: string; exact?: boolean };

export default function AdminShell({
  children,
  nav,
  profile,
  businessName,
}: {
  children: React.ReactNode;
  nav: AdminNavItem[];
  profile: {
    name: string;
    username: string;
    role: string;
    profileUrl: string;
    loginCount: number;
    lastLoginAt: string;
  };
  businessName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState<"none" | "profile" | "security">("none");
  const [avatar, setAvatar] = useState(profile.profileUrl);
  const [name, setName] = useState(profile.name);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    setDrawer(false);
    setMenuOpen("none");
  }, [pathname]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("dp-theme", next ? "dark" : "light");
    } catch {}
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/login");
    router.refresh();
  };

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    setBusy(true);
    const data = new FormData();
    data.append("file", file);
    const upload = await fetch("/api/upload", { method: "POST", body: data }).catch(() => null);
    if (!upload || !upload.ok) {
      setBusy(false);
      setMessage("❌ इमेज अपलोड नहीं हुई");
      return;
    }
    const json = (await upload.json()) as { url?: string };
    if (json.url) {
      setAvatar(json.url);
      const saved = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileUrl: json.url }),
      }).catch(() => null);
      setMessage(saved && saved.ok ? "✅ प्रोफाइल फोटो बदल गई" : "❌ सेव नहीं हो सकी");
      router.refresh();
    }
    setBusy(false);
  }

  async function saveName() {
    setBusy(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).catch(() => null);
    setBusy(false);
    setMessage(response && response.ok ? "✅ नाम अपडेट हुआ" : "❌ अपडेट नहीं हुआ");
    router.refresh();
  }

  async function savePassword() {
    setBusy(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passwords),
    }).catch(() => null);
    const json = (await response?.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (!response || !response.ok) {
      setMessage(`❌ ${json?.error ?? "पासवर्ड नहीं बदला"}`);
      return;
    }
    setPasswords({ currentPassword: "", newPassword: "" });
    setMessage("✅ पासवर्ड बदल गया");
  }


  const initials = (name || "DP").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  const topCard = (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-orange-500 text-base font-black text-white">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt={name} className="h-full w-full object-cover" />
            ) : (
              initials.slice(0, 1)
            )}
          </span>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] shadow ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-white/20"
            title="लोगो / फोटो बदलें"
          >
            📷
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadAvatar(e.target.files?.[0] ?? null)} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{name}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{profile.role}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <span className="hidden text-[10px] text-slate-400 sm:inline">{message}</span>
          <a href="/api/backup" className="btn-ghost px-2.5 py-1.5 text-[11px]" title="पूरा डेटा बैकअप (JSON)">
            💾 बैकअप
          </a>
          <button type="button" onClick={toggleTheme} className="btn-ghost px-2.5 py-1.5 text-[11px]" title="डार्क मोड">
            {dark ? "☀️" : "🌙"}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => (v === "profile" ? "none" : "profile"))}
              className="btn-ghost px-2.5 py-1.5 text-[11px]"
              title="प्रोफाइल / पासवर्ड"
            >
              🔑 आईडी / पासवर्ड
            </button>
            {menuOpen === "profile" ? (
              <div className="absolute right-0 top-10 z-50 w-[300px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-orange-500 text-base font-black text-white">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials.slice(0, 1)
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{name}</p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">@{profile.username} · {profile.role === "owner" ? "मालिक" : profile.role}</p>
                    <p className="text-[10px] text-slate-400">अंतिम लॉगिन: {profile.lastLoginAt} · {profile.loginCount} बार</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button type="button" onClick={() => fileRef.current?.click()} className="btn-soft px-2 py-1 text-[11px]" disabled={busy}>
                    📷 बदलें
                  </button>
                  <span className="text-[10px] text-slate-400">लोगो / प्रोफाइल फोटो</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  <label className="label">नाम</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="input px-2 py-1 text-xs" />
                  <button type="button" onClick={saveName} className="btn-primary w-full px-2 py-1 text-[11px]" disabled={busy}>नाम सहेजें</button>
                </div>
                <div className="mt-2 rounded-xl bg-slate-50 p-2 dark:bg-white/5">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">🔑 पासवर्ड बदलें</p>
                  <input type="password" placeholder="पुराना पासवर्ड" value={passwords.currentPassword} onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))} className="input mt-1 px-2 py-1 text-[11px]" />
                  <input type="password" placeholder="नया पासवर्ड" value={passwords.newPassword} onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} className="input mt-1 px-2 py-1 text-[11px]" />
                  <button type="button" onClick={savePassword} className="btn-primary mt-1 w-full px-2 py-1 text-[11px]" disabled={busy}>पासवर्ड अपडेट करें</button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <Link href="/admin/users" className="btn-ghost justify-center px-2 py-1 text-[11px]">👔 उपयोगकर्ता</Link>
                  <button type="button" onClick={logout} className="btn-danger justify-center px-2 py-1 text-[11px]">🚪 लॉगआउट</button>
                </div>
              </div>
            ) : null}
          </div>
          <button type="button" onClick={logout} className="btn-ghost px-2.5 py-1.5 text-[11px]">
            🚪 लॉगआउट
          </button>
        </div>
      </div>
    </div>
  );

  const topSearch = (
    <form action="/search" className="flex items-center gap-1.5">
      <input name="q" placeholder="सेवा · ग्राहक · बिल · उत्पाद खोजें…" className="input max-w-[240px] px-2 py-1.5 text-[11px]" />
      <button type="submit" className="btn-primary px-2 py-1.5 text-[11px]">🔍</button>
    </form>
  );

  const tabBar = (
    <div className="scrollbar-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {nav.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold transition ${
              active
                ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            <span>{item.icon}</span>
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[1280px] px-2.5 py-3 sm:px-4">
        <div className="space-y-2.5">
          {topCard}
          <div className="flex flex-wrap items-center gap-1.5">
            <BackButton label="Back" />
            {topSearch}
            <a href={`tel:${businessName ? "7610420959" : "7610420959"}`} className="btn-ghost px-2 py-1.5 text-[11px]">📞 Call</a>
            <a href="https://wa.me/917610420959" target="_blank" rel="noreferrer" className="btn-ghost px-2 py-1.5 text-[11px]">💬 WhatsApp</a>
            <Link href="/apps" className="btn-ghost px-2 py-1.5 text-[11px]">🖥️ ऐप फ्रेम</Link>
            <Link href="/customer/login" className="btn-ghost px-2 py-1.5 text-[11px]">👤 Customer Login</Link>
            <Link href="/admin/sheets" className="btn-ghost px-2 py-1.5 text-[11px]">📊 Google Sheets</Link>
            <span className="ml-auto" />
          </div>
          <OfflineBar />
          {tabBar}
        </div>
        <main className="mt-3">{children}</main>
        <footer className="mt-6 border-t border-slate-200 px-2 py-4 text-center text-[11px] leading-relaxed text-slate-500 dark:border-white/10 dark:text-slate-400">
          <p className="font-bold text-slate-700 dark:text-slate-200">{businessName}</p>
          <p>बाज़ार मोहल्ला, अमानगंज, पन्ना, मध्य प्रदेश – 488441, भारत</p>
          <p>📞 7610420959 · 8962680352 · ✉️ dheerendr9522@gmail.com</p>
          <p className="mt-1 flex flex-wrap justify-center gap-2">
            <Link href="/privacy" className="font-semibold underline">गोपनीयता नीति</Link>
            <Link href="/terms" className="font-semibold underline">सेवा शर्तें</Link>
            <Link href="/contact" className="font-semibold underline">संपर्क</Link>
          </p>
          <p className="mt-1">यह एक सहायता केंद्र है। सरकारी स्वीकृति, भुगतान व बुकिंग संबंधित पुष्टि केवल संबंधित आधिकारिक पोर्टल/प्रदाता द्वारा की जाती है।</p>
        </footer>
      </div>
    </div>
  );
}
