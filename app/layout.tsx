import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Shell from "@/components/Shell";
import OfflineProvider from "@/components/OfflineProvider";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Dheerendra Prajapati Computer & Digital Seva Kendra | अमानगंज, पन्ना",
    template: "%s | Dheerendra Digital Seva Kendra",
  },
  description:
    "Dheerendra Prajapati Computer Hardware, Software & Digital Seva Kendra — आपकी डिजिटल सेवाएँ, एक ही जगह। 230+ सरकारी सेवाएँ, कंप्यूटर रिपेयर, बिलिंग व ऑनलाइन फॉर्म। Bajar Mohalla, Amanganj, Panna (M.P.) 488441.",
  keywords: [
    "Digital Seva Kendra Amanganj",
    "CSC Panna",
    "Aadhaar update Panna",
    "Computer repair Amanganj",
    "Dheerendra Prajapati",
  ],
  manifest: "/manifest.webmanifest",
  applicationName: "DP Digital Seva",
  verification: {
    google: "google5bba588b830c7890.html",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

const themeScript = `
(function(){
  try {
    var stored = localStorage.getItem('dp-theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings().catch(() => null);
  let design: Record<string, unknown> = {};
  if (settings?.designJson) {
    try {
      design = JSON.parse(settings.designJson) as Record<string, unknown>;
    } catch {
      design = {};
    }
  }
  const styleVars = {
    "--dp-primary": String(design.primary ?? "#4f46e5"),
    "--dp-accent": String(design.accent ?? "#f97316"),
    "--dp-radius": `${Number(design.radius ?? 16)}px`,
    "--dp-body-size": `${Number(design.bodySize ?? 12)}px`,
    "--dp-heading-size": `${Number(design.headingSize ?? 18)}px`,
  } as React.CSSProperties;
  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen text-slate-900 antialiased dark:text-slate-100" style={styleVars}>
        <OfflineProvider>
          <Shell>{children}</Shell>
        </OfflineProvider>
      </body>
    </html>
  );
}
