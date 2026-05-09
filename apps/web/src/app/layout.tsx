import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { AuthModal } from "@/components/auth/AuthModal";
import { CommandSearch } from "@/components/search/CommandSearch";
import { PaywallModal } from "@/components/credits/PaywallModal";
import { connectDB, SiteConfig } from "@toolhub/db";
import { Toaster } from "sonner";

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
  metadataBase: new URL("https://setulix.com"),
  title: {
    default: "SetuLix — AI Tools for Every Indian Business | SetuLabsAI",
    template: "%s | SetuLix",
  },
  description:
    "SetuLix is an AI-powered multi-tool SaaS platform for Indian businesses. 27 tools across 5 kits — Creator, SME, HR, CA/Legal, Marketing. Free tools + simple credit system.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://setulix.com",
    siteName: "SetuLix",
    title: "SetuLix — AI Tools for Every Indian Business",
    description: "27 AI tools for Indian businesses. Free tools + simple credits.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SetuLix — AI Tools for Every Indian Business",
    description: "27 AI tools for Indian businesses. Free tools + simple credits.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

async function getDefaultTheme(): Promise<"dark" | "light"> {
  try {
    await connectDB();
    const config = await SiteConfig.findOne({ key: "default_theme" }).lean();
    const val = config?.value as string | undefined;
    if (val === "light" || val === "dark") return val;
  } catch {
    // DB unavailable — fall back to dark
  }
  return "dark";
}

/**
 * Root layout — providers + global modals only.
 * Visual chrome (sidebar, navbar) lives in (site)/layout.tsx so that
 * /admin routes can have a fully isolated full-screen layout.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const defaultTheme = await getDefaultTheme();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultTheme}
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
            <AuthModal />
            <PaywallModal />
            <CommandSearch />
            <Toaster position="bottom-right" theme="system" richColors />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
