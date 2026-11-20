import { desc } from "drizzle-orm";
import type { ReactNode } from "react";
import { db } from "@/db";
import { customMenus, notifications as notificationsTable } from "@/db/schema";
import { ensureSeeded, getCounts } from "@/db/seed";
import { getCustomerSession, getStaffSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import AppShell, { type ShellNotification, type ShellSession } from "@/components/AppShell";

export default async function Shell({ children }: { children: ReactNode }) {
  try {
    await ensureSeeded();
  } catch {
    // Database may not be reachable at boot; pages still render with fallbacks.
  }

  const [settings, staff, customer, counts] = await Promise.all([
    getSettings(),
    getStaffSession(),
    getCustomerSession(),
    getCounts().catch(() => ({ services: 250, categories: 18, websites: 92 })),
  ]);

  let menuRows: { id: number; label: string; href: string; icon: string | null; openNewTab: boolean }[] = [];
  try {
    const rows = await db.select().from(customMenus).orderBy(customMenus.sortOrder);
    menuRows = rows
      .filter((menu) => menu.visible)
      .map((menu) => ({ id: menu.id, label: menu.label, href: menu.href, icon: menu.icon, openNewTab: menu.openNewTab }));
  } catch {
    menuRows = [];
  }

  let notificationRows: ShellNotification[] = [];
  try {
    const rows = await db
      .select()
      .from(notificationsTable)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(12);
    notificationRows = rows
      .filter((n) => n.audience !== "customer" || customer !== null)
      .map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      }));
  } catch {
    notificationRows = [];
  }

  const session: ShellSession = staff
    ? { kind: "staff", name: staff.name, role: staff.role, username: staff.username }
    : customer
      ? { kind: "customer", name: customer.name, mobile: customer.mobile }
      : null;

  return (
    <AppShell
      settings={{
        businessName: settings.businessName,
        tagline: settings.tagline,
        phonePrimary: settings.phonePrimary,
        phoneSecondary: settings.phoneSecondary,
        ownerName: settings.ownerName,
        logoUrl: settings.logoUrl,
        profileUrl: settings.profileUrl,
        groupDigital: settings.groupDigital,
        groupShop: settings.groupShop,
        groupAccount: settings.groupAccount,
        groupAdmin: settings.groupAdmin,
        adminLoginEnabled: settings.adminLoginEnabled,
        bannerEnabled: settings.bannerEnabled,
        bannerText: settings.bannerText,
        bannerSpeed: settings.bannerSpeed,
        brandColor: settings.brandColor,
        accentColor: settings.accentColor,
        serviceCount: counts.services,
        websiteCount: counts.websites,
      }}
      session={session}
      notifications={notificationRows}
      customMenus={menuRows}
    >
      {children}
    </AppShell>
  );
}
