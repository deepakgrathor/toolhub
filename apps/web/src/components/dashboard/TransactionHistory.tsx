"use client";

import { useEffect, useState } from "react";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  _id: string;
  type: "purchase" | "use" | "refund" | "referral_bonus" | "manual_admin";
  amount: number;
  balanceAfter: number;
  toolSlug?: string;
  createdAt: string;
}

const TYPE_LABELS: Record<Transaction["type"], string> = {
  purchase: "Purchase",
  use: "Tool Use",
  refund: "Refund",
  referral_bonus: "Referral",
  manual_admin: "Admin",
};

const TYPE_COLORS: Record<Transaction["type"], string> = {
  purchase: "bg-[#10b981]/15 text-[#10b981]",
  use: "bg-[#7c3aed]/15 text-[#7c3aed]",
  refund: "bg-blue-500/15 text-blue-400",
  referral_bonus: "bg-[#10b981]/15 text-[#10b981]",
  manual_admin: "bg-yellow-500/15 text-yellow-400",
};

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {[1, 2, 3, 4, 5].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-white/10" />
        </td>
      ))}
    </tr>
  );
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/credits")
      .then((r) => r.json())
      .then((data) => {
        setTransactions(data.transactions ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Transaction History</h2>
      </div>

      {!loading && transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <SearchX className="h-8 w-8" />
          <p className="text-sm">No transactions yet. Try a tool!</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tool</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Balance After</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : transactions.map((tx) => (
                    <tr key={tx._id} className="border-b border-border last:border-0 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {tx.toolSlug ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            TYPE_COLORS[tx.type]
                          )}
                        >
                          {TYPE_LABELS[tx.type]}
                        </span>
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right font-semibold tabular-nums",
                          tx.amount > 0 ? "text-[#10b981]" : "text-red-400"
                        )}
                      >
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                        {tx.balanceAfter}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
