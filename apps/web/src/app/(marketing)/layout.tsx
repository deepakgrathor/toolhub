import { MarketingNavbar } from "@/components/layout/MarketingNavbar";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
