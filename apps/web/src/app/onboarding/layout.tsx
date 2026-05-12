import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Setup Your Workspace | SetuLix",
  description: "Personalize your AI workspace in 4 quick steps.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="h-14 flex items-center px-6 border-b border-border shrink-0">
        <Logo size="sm" />
      </header>
      <main className="flex-1 flex items-start justify-center px-4 py-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}
