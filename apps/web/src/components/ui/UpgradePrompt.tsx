"use client";

import { Lock, ArrowRight, LayoutGrid } from "lucide-react";
import Link from "next/link";

interface Props {
  toolName: string;
  requiredPlan: string;
  message: string;
}

export function UpgradePrompt({ toolName, requiredPlan, message }: Props) {
  const planDisplay = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7c3aed]/10 mx-auto mb-5">
          <Lock className="h-8 w-8 text-[#7c3aed]" />
        </div>

        <h2 className="text-xl font-bold text-foreground mb-2">{toolName}</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{message}</p>

        <div className="space-y-3">
          <Link
            href={`/pricing`}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#7c3aed] py-2.5 text-sm font-semibold text-white hover:bg-[#6d28d9] transition-colors"
          >
            Upgrade to {planDisplay}
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <LayoutGrid className="h-4 w-4" />
            View all plans
          </Link>
        </div>
      </div>
    </div>
  );
}
