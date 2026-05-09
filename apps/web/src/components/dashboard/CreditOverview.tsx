"use client";

import Link from "next/link";
import { Coins, ShoppingBag } from "lucide-react";
import { useCreditStore } from "@/store/credits-store";
import { useEffect } from "react";

export function CreditOverview() {
  const { balance, isLoading, syncFromServer } = useCreditStore();

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  return (
    <div className="rounded-xl border border-border bg-surface p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7c3aed]/15">
          <Coins className="h-6 w-6 text-[#7c3aed]" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Your Credits</p>
      </div>

      {isLoading ? (
        <div className="h-10 w-24 animate-pulse rounded-lg bg-white/10" />
      ) : (
        <p className="text-4xl font-extrabold text-[#7c3aed]">{balance}</p>
      )}

      <Link
        href="/pricing"
        className="flex items-center justify-center gap-2 rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        <ShoppingBag className="h-4 w-4" />
        Buy More Credits
      </Link>
    </div>
  );
}
