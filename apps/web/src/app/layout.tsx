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
import { ProgressBar } from "@/components/providers/ProgressBar";

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
    default: "SetuLix — AI Tools for Every Indian Business",
    template: "%s | SetuLix",
  },
  description:
    "27 AI-powered tools for Indian creators, SMEs, HR teams, CA/legal professionals and marketers. Free tools + credit-based AI tools. No subscription needed to start.",
  keywords: [
    "ai tools india",
    "free gst invoice generator india",
    "ai tools for indian business",
    "hr tools india",
    "legal notice generator india",
    "setulix",
    "setulabasai",
    "free business tools india",
    "ai tools for creators india",
  ],
  authors: [{ name: "Deepak Rathor", url: "https://www.linkedin.com/in/deepakgrathor/" }],
  creator: "SetuLabsAI",
  publisher: "SetuLabsAI",
  alternates: {
    canonical: "https://setulix.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "SetuLix",
    title: "SetuLix — AI Tools for Every Indian Business",
    description:
      "27 AI-powered tools for Indian creators, SMEs, HR teams and marketers. Free + credit-based.",
    url: "https://setulix.com",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "SetuLix — AI Tools for Indian Business",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SetuLix — AI Tools for Every Indian Business",
    description:
      "27 AI-powered tools for Indian businesses. Free tools + AI-powered paid tools.",
    images: ["/og-default.png"],
    creator: "@setulix",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "manifest", url: "/site.webmanifest" }],
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
            <ProgressBar />
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
