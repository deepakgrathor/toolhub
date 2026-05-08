import { Suspense } from "react";
import { ToolsClient } from "@/components/tools/ToolsClient";

export const metadata = {
  title: "All Tools — Toolspire",
  description: "Browse 30+ AI-powered tools for creators, businesses, and professionals.",
};

function ToolsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-40 rounded-lg bg-surface animate-pulse" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-surface animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-surface border border-border animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<ToolsSkeleton />}>
      <ToolsClient />
    </Suspense>
  );
}
