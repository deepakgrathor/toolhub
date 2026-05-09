import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { AuthModal } from "@/components/auth/AuthModal";
import { CommandSearch } from "@/components/search/CommandSearch";
import { PaywallModal } from "@/components/credits/PaywallModal";

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

/**
 * Root layout — providers + global modals only.
 * Visual chrome (sidebar, navbar) lives in (site)/layout.tsx so that
 * /admin routes can have a fully isolated full-screen layout.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
            {children}
            <AuthModal />
            <PaywallModal />
            <CommandSearch />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
