"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ShellNotification = {
  id: number;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
};

export type ShellSession =
  | { kind: "staff"; name: string; role: string; username: string }
  | { kind: "customer"; name: string; mobile: string }
  | null;

export type ShellSettings = {
  businessName: string;
  tagline: string;
  phonePrimary: string;
  phoneSecondary: string;
  ownerName: string;
  logoUrl: string;
  profileUrl: string;
  groupDigital: string;
  groupShop: string;
  groupAccount: string;
  groupAdmin: string;
  adminLoginEnabled: string;
  bannerEnabled: string;
  bannerText: string;
  bannerSpeed: string;
  brandColor: string;
  accentColor: string;
  serviceCount: number;
  websiteCount: number;
};

type NavItem = { href: string; label: string; badge?: string };
type NavGroup = { key: string; title: string; icon: string; enabled: boolean; items: NavItem[] };

export default function AppShell({
  settings,
  session,
  notifications,
  customMenus = [],
  children,
}: {
  settings: ShellSettings;
  session: ShellSession;
  notifications: ShellNotification[];
  children: React.ReactNode;
  customMenus?: { id: number; label: string; href: string; icon: string | null; openNewTab: boolean }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname.startsWith("/admin");
  const [viewMode, setViewMode] = useState<"auto" | "desktop" | "mobile">("auto");
  const [dark, setDark] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    digital: true,
    shop: false,
    account: false,
    admin: false,
  });

  useEffect(() => {
    try {
      const storedView = localStorage.getItem("dp-view") as "auto" | "desktop" | "mobile" | null;
      if (storedView) setViewMode(storedView);
      setDark(document.documentElement.classList.contains("dark"));
    } catch {}
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as unknown as { prompt: () => Promise<void> });
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setBellOpen(false);
  }, [pathname]);

  const isCustomer = session?.kind === "customer";
  const isStaff = session?.kind === "staff";

  const changeView = () => {
    const order = ["auto", "desktop", "mobile"] as const;
    const next = order[(order.indexOf(viewMode) + 1) % order.length];
    setViewMode(next);
    try {
      localStorage.setItem("dp-view", next);
    } catch {}
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("dp-theme", next ? "dark" : "light");
    } catch {}
  };

  const markRead = useCallback(async () => {
    await fetch("/api/notifications/read", { method: "POST" }).catch(() => undefined);
    router.refresh();
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/");
    router.refresh();
  };

  const groups: NavGroup[] = useMemo(
    () => [
      {
        key: "digital",
        title: "डिजिटल सेवा केंद्र",
        icon: "🏛️",
        enabled: settings.groupDigital !== "0",
        items: [
          { href: "/", label: "होम डैशबोर्ड" },
          { href: "/services", label: "सभी सेवाएँ", badge: `${settings.serviceCount}+` },
          { href: "/category/government", label: "सरकारी सेवाएँ" },
          { href: "/category/banking", label: "बैंकिंग सेवाएँ" },
          { href: "/category/bills", label: "बिल व रिचार्ज" },
          { href: "/train", label: "रेल टिकट बुकिंग" },
          { href: "/category/travel", label: "यात्रा व होटल" },
          { href: "/category/forms", label: "ऑनलाइन फॉर्म" },
          { href: "/category/mp-schemes", label: "म.प्र. योजनाएँ व पोर्टल" },
          { href: "/category/central-gov", label: "केंद्र सरकार पोर्टल" },
          { href: "/category/education", label: "शिक्षा व कॉलेज फॉर्म" },
          { href: "/category/jobs", label: "जॉब्स मेनू" },
          { href: "/directory", label: "सभी सरकारी वेबसाइट", badge: `${settings.websiteCount}` },
          { href: "/apps", label: "मेरे ऐप व वेबसाइट" },
          { href: "/offers", label: "ऑफर, छूट व रेटिंग" },
          { href: "/business", label: "DP बिज़नेस प्रोफाइल" },
          { href: "/accounting", label: "बिलिंग एवं अकाउंटिंग" },
          { href: "/learning", label: "सेवा सीखें (ट्रेनिंग)" },
          ...customMenus.map((menu: { id: number; label: string; href: string; icon: string | null; openNewTab: boolean }) => ({ href: menu.href, label: `${menu.icon ?? "🔗"} ${menu.label}` })),
        ],
      },
      {
        key: "shop",
        title: "कंप्यूटर शॉप",
        icon: "🖥️",
        enabled: settings.groupShop !== "0",
        items: [
          { href: "/category/hardware", label: "कंप्यूटर हार्डवेयर" },
          { href: "/category/software", label: "कंप्यूटर सॉफ्टवेयर" },
          { href: "/category/printing", label: "प्रिंटिंग व स्कैनिंग" },
          { href: "/category/typing", label: "टाइपिंग व डॉक्यूमेंट" },
        ],
      },
      {
        key: "account",
        title: "मेरा खाता व आवेदन",
        icon: "📁",
        enabled: settings.groupAccount !== "0",
        items: [
          { href: "/customer", label: "मेरे आवेदन स्थिति" },
          { href: "/customer?tab=completed", label: "तैयार दस्तावेज़ डाउनलोड" },
          { href: "/customer?tab=receipts", label: "रसीद प्रिंट" },
          { href: "/track", label: "आवेदन ट्रैकिंग" },
          { href: "/search", label: "ग्लोबल सर्च" },
          { href: "/pay", label: "UPI भुगतान" },
          { href: "/contact", label: "संपर्क करें" },
        ],
      },
      {
        key: "admin",
        title: "प्रबंधन (एडमिन)",
        icon: "📋",
        enabled: settings.groupAdmin !== "0",
        items: [
          { href: "/admin/login", label: "एडमिन लॉगिन" },
          { href: "/admin/customers", label: "ग्राहक प्रबंधन" },
          { href: "/admin/repairs", label: "रिपेयर जॉब" },
          { href: "/admin/invoices", label: "बिलिंग व भुगतान" },
          { href: "/admin/sheets", label: "गूगल शीट / CSV" },
          { href: "/admin/websites", label: "ऑफिशियल लिंक" },
          { href: "/admin/users", label: "यूज़र प्रबंधन" },
          { href: "/admin", label: "एडमिन डैशबोर्ड" },
          { href: "/admin/settings", label: "सेटिंग्स" },
        ],
      },
    ],
    [settings.serviceCount, settings.websiteCount, settings.groupAccount, settings.groupAdmin, settings.groupDigital, settings.groupShop, customMenus],
  );

  const visibleGroups = groups.filter((group) => {
    if (group.key === "admin" && (isCustomer || settings.groupAdmin === "0")) return false;
    if (!group.enabled && !isStaff) return false;
    if (group.key === "admin" && !isStaff && settings.adminLoginEnabled === "0") {
      return group.items.some((item) => item.href !== "/admin/login");
    }
    if (group.key === "admin" && !isStaff) {
      return true;
    }
    return true;
  });

  const filteredGroups = visibleGroups.map((group) => {
    const baseItems =
      group.key === "admin" && !isStaff && settings.adminLoginEnabled === "0"
        ? group.items.filter((item) => item.href !== "/admin/login")
        : group.items;
    const seen = new Set<string>();
    return {
      ...group,
      items: baseItems.filter((item) => {
        if (seen.has(item.href)) return false;
        seen.add(item.href);
        return true;
      }),
    };
  });

  const unread = notifications.filter((n) => !n.read).length;
  const viewClass =
    viewMode === "desktop"
      ? "min-w-[1180px]"
      : viewMode === "mobile"
        ? "mx-auto max-w-[640px]"
        : "";

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3 scrollbar-thin">
      <div className="mb-2 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-orange-500 p-3 text-white">
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/20 text-lg font-black">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            "DP"
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wide text-white/80">Dheerendra Digital</p>
          <p className="truncate text-sm font-extrabold">सेवा केंद्र, अमानगंज</p>
        </div>
      </div>

      {filteredGroups.map((group) => {
        const isOpen = openGroups[group.key] ?? false;
        return (
          <div key={group.key} className="rounded-xl">
            <button
              type="button"
              onClick={() => setOpenGroups((prev) => ({ ...prev, [group.key]: !prev[group.key] }))}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-extrabold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
            >
              <span className="flex items-center gap-2">
                <span>{group.icon}</span>
                <span className="truncate">{group.title}</span>
              </span>
              <span className="flex items-center gap-1">
                {!group.enabled ? (
                  <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                    बंद
                  </span>
                ) : null}
                <span className="text-slate-400">{isOpen ? "▴" : "▾"}</span>
              </span>
            </button>
            {isOpen ? (
              <div className="mt-1 space-y-0.5 pb-1">
                {group.items.map((item) => {
                  const active = pathname === item.href.split("?")[0] && (item.href.includes("?") ? false : true);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-white/10 dark:bg-white/5">
        <p className="font-bold text-slate-700 dark:text-slate-200">दुकान सहायता</p>
        <a href={`tel:${settings.phonePrimary}`} className="mt-1 block font-semibold text-indigo-600 dark:text-indigo-300">
          📞 {settings.phonePrimary}
        </a>
        <a
          href={`https://wa.me/91${settings.phonePrimary}`}
          target="_blank"
          rel="noreferrer"
          className="block font-semibold text-emerald-600 dark:text-emerald-300"
        >
          💬 WhatsApp
        </a>
        <p className="mt-2 leading-relaxed text-slate-500 dark:text-slate-400">
          Bajar Mohalla, Amanganj, Panna (M.P.) 488441
        </p>
      </div>
    </nav>
  );

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className={viewClass} data-view={viewMode}>
      <div className="flex min-h-screen">
        <aside className={`no-print sticky top-0 h-screen w-[272px] shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/60 ${viewMode === "desktop" ? "block" : "hidden lg:block"}`}>
          {sidebar}
        </aside>

        {drawerOpen ? (
          <div className="no-print fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setDrawerOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-[290px] max-w-[86%] bg-white shadow-2xl dark:bg-slate-950">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-white/10">
                <span className="text-sm font-bold">मेन्यू</span>
                <button type="button" className="btn-ghost" onClick={() => setDrawerOpen(false)}>
                  ✕
                </button>
              </div>
              <div className="h-[calc(100vh-52px)] overflow-y-auto">{sidebar}</div>
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
            <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="btn-ghost px-2.5 py-2 lg:hidden"
                aria-label="Open menu"
              >
                ☰
              </button>
              <Link href="/" className="flex min-w-0 items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 to-orange-500 text-xs font-black text-white">
                  {settings.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.logoUrl} alt="logo" className="h-full w-full object-cover" />
                  ) : (
                    "DP"
                  )}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-sm font-extrabold leading-tight text-slate-900 dark:text-white">
                    Dheerendra Digital Seva
                  </span>
                  <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {settings.tagline}
                  </span>
                </span>
              </Link>

              <form action="/search" className="ml-auto hidden flex-1 max-w-md items-center gap-2 md:flex">
                <input
                  name="q"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="सेवा, ग्राहक, वेबसाइट खोजें…"
                  className="input"
                  aria-label="Global search"
                />
                <button type="submit" className="btn-primary px-3">
                  🔍
                </button>
              </form>

              <div className="ml-auto flex items-center gap-1.5 md:ml-0">
                <button
                  type="button"
                  onClick={changeView}
                  className="btn-ghost hidden px-2.5 py-2 text-xs sm:inline-flex"
                  title="डिस्प्ले मोड बदलें"
                >
                  {viewMode === "desktop" ? "🖥️ Desktop" : viewMode === "mobile" ? "📱 Mobile" : "🔄 Auto"}
                </button>
                {installEvent ? (
                  <button
                    type="button"
                    onClick={() => installEvent.prompt()}
                    className="btn-ghost px-2.5 py-2 text-xs"
                    title="ऐप इंस्टॉल करें"
                  >
                    ⬇️ <span className="hidden sm:inline">Install</span>
                  </button>
                ) : null}
                <button type="button" onClick={toggleTheme} className="btn-ghost px-2.5 py-2" aria-label="Toggle dark mode">
                  {dark ? "☀️" : "🌙"}
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setBellOpen((v) => !v)}
                    className="btn-ghost relative px-2.5 py-2"
                    aria-label="Notifications"
                  >
                    🔔
                    {unread > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    ) : null}
                  </button>
                  {bellOpen ? (
                    <div className="absolute right-0 top-12 z-50 w-[320px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-900">
                      <div className="flex items-center justify-between px-2 py-1">
                        <span className="text-sm font-bold">सूचनाएँ</span>
                        <button type="button" onClick={markRead} className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                          सभी पढ़ा
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="px-2 py-4 text-xs text-slate-500">कोई सूचना नहीं।</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`rounded-xl px-2 py-2 text-xs ${n.read ? "text-slate-500" : "bg-indigo-50/70 text-slate-700 dark:bg-indigo-500/10 dark:text-slate-200"}`}
                            >
                              <p className="font-bold">{n.title}</p>
                              <p className="mt-0.5 leading-relaxed">{n.body}</p>
                              <p className="mt-1 text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString("en-IN")}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                {session ? (
                  <div className="flex items-center gap-1.5">
                    <span className="hidden max-w-[130px] truncate rounded-xl bg-slate-100 px-2 py-1.5 text-xs font-bold text-slate-700 sm:inline dark:bg-white/10 dark:text-slate-200">
                      {session.kind === "staff" ? `👤 ${session.name.split(" ")[0]}` : `👤 ${session.name}`}
                    </span>
                    <button type="button" onClick={logout} className="btn-ghost px-2.5 py-2 text-xs">
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link href={isCustomer ? "/customer/login" : "/login"} className="btn-primary px-3 py-2 text-xs">
                    लॉगिन
                  </Link>
                )}
              </div>
            </div>

            <div
              className="overflow-hidden border-t border-slate-200/70 py-1 text-[11px] font-semibold text-white dark:border-white/10"
              style={{ backgroundColor: settings.brandColor || "#4f46e5" }}
            >
              <div className="marquee-track" style={{ animationDuration: `${settings.bannerSpeed || 28}s` }}>
                <span className="px-6">
                  {settings.bannerEnabled === "0"
                    ? ""
                    : settings.bannerText ||
                      `⭐ ${settings.businessName} ★ ${settings.tagline} • ${settings.ownerName} • 📞 ${settings.phonePrimary} / ${settings.phoneSecondary} • 📍 Bajar Mohalla, Amanganj, Panna (M.P.) 488441`}
                </span>
                <span className="px-6" aria-hidden>
                  {settings.bannerEnabled === "0"
                    ? ""
                    : settings.bannerText ||
                      `⭐ ${settings.businessName} ★ ${settings.tagline} • ${settings.ownerName} • 📞 ${settings.phonePrimary} / ${settings.phoneSecondary} • 📍 Bajar Mohalla, Amanganj, Panna (M.P.) 488441`}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-3 py-4 sm:px-5 sm:py-6">
            <div className="mx-auto w-full max-w-[1180px]">{children}</div>
          </main>

          <footer className="no-print border-t border-slate-200 px-4 py-5 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              © {new Date().getFullYear()} {settings.businessName}
            </p>
            <p className="mt-1">
              Bajar Mohalla, Amanganj, Panna, M.P. – 488441 · 📞 {settings.phonePrimary}, {settings.phoneSecondary} · ✉️ dheerendr9522@gmail.com
            </p>
            <p className="mt-1">सभी शुल्क व समय अनुमानित हैं। सरकारी स्वीकृति की गारंटी नहीं है — केवल आवेदन सहायता सेवा।</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
