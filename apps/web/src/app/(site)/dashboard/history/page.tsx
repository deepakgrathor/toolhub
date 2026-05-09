import { Metadata } from "next";
import { HistoryTable } from "@/components/dashboard/HistoryTable";

export const metadata: Metadata = {
  title: "Generation History — Toolspire",
  description: "View all your past AI-generated outputs.",
};

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  return (
    <div className="min-h-full px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Generation History</h1>
      <HistoryTable />
    </div>
  );
}
