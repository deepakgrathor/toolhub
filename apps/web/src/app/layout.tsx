import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { AuthModal } from "@/components/auth/AuthModal";
import { CommandSearch } from "@/components/search/CommandSearch";
import { PaywallModal } from "@/components/credits/PaywallModal";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { getKitList } from "@/lib/tool-registry";
import { connectDB, SiteConfig } from "@toolhub/db";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Toolspire — AI Tools for Everyone",
  description:
    "India's multi-tool AI platform. PDF tools, image tools, writing tools and more — all in one place.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let kits: { kit: string; toolCount: number }[] = [];
  let announcementText = "";
  let announcementVisible = false;

  try {
    await connectDB();
    const [kitsResult, bannerRecord, visibleRecord] = await Promise.all([
      getKitList(),
      SiteConfig.findOne({ key: "announcement_banner" }).lean(),
      SiteConfig.findOne({ key: "announcement_visible" }).lean(),
    ]);
    kits = kitsResult;
    announcementText = (bannerRecord?.value as string) ?? "";
    announcementVisible = (visibleRecord?.value as boolean) ?? false;
  } catch {
    // DB not connected in dev — silent fallback
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionProvider>
            {announcementVisible && announcementText && (
              <AnnouncementBanner text={announcementText} />
            )}
            <div className="flex h-screen overflow-hidden bg-background">
              <Sidebar kits={kits} />
              <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                <Navbar />
                <main className="flex-1 overflow-auto">{children}</main>
              </div>
            </div>
            <AuthModal />
            <PaywallModal />
            <CommandSearch />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
