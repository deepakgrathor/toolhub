import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All AI Tools for Indian Businesses",
  description:
    "27 free and AI-powered tools for Indian creators, SMEs, HR teams, CA/legal professionals and marketers. GST invoice, resume screener, legal notice, ad copy and more.",
  alternates: {
    canonical: "https://setulix.com/tools",
  },
  openGraph: {
    title: "All AI Tools for Indian Businesses — SetuLix",
    description:
      "27 tools across 5 professional kits. Free tools + credit-based AI tools.",
    url: "https://setulix.com/tools",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "All AI Tools for Indian Businesses — SetuLix",
    images: ["/og-default.png"],
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
