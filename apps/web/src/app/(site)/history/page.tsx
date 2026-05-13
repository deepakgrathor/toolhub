import { Metadata } from "next";
import { HistoryTable } from "@/components/dashboard/HistoryTable";

export const metadata: Metadata = {
  title: "Generation History — SetuLix",
  description: "View all your past AI-generated outputs.",
};

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  return (
    <div className="min-h-full px-4 py-8 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Generation History</h1>
        <p className="text-sm text-muted-foreground mt-1">Your recent AI generations</p>
      </div>
      <HistoryTable />
    </div>
  );
}
