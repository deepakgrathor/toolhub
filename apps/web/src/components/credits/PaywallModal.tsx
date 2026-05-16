"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Zap, X, TrendingUp } from "lucide-react";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";

export function PaywallModal() {
  const { isOpen, toolName, requiredCredits, closePaywall } = usePaywallStore();
  const balance = useCreditStore((s) => s.balance);
  const shortfall = Math.max(0, (requiredCredits ?? 0) - balance);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closePaywall()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">

          {/* Close */}
          <Dialog.Close className="absolute right-4 top-4 rounded-md p-1 opacity-60 hover:opacity-100 hover:bg-muted transition-all focus:outline-none">
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          <div className="flex flex-col items-center gap-5 text-center">

            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Zap className="h-7 w-7 text-primary" />
            </div>

            {/* Heading */}
            <div className="space-y-1">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Not enough credits
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{toolName}</span> needs{" "}
                <span className="font-semibold text-primary">{requiredCredits} credits</span>
              </Dialog.Description>
            </div>

            {/* Credit status pill row */}
            <div className="flex w-full gap-2">
              <div className="flex-1 rounded-xl border border-border bg-muted/40 px-4 py-3">
                <p className="text-[11px] text-muted-foreground mb-0.5">You have</p>
                <p className="text-lg font-bold text-foreground">{balance}</p>
              </div>
              <div className="flex-1 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                <p className="text-[11px] text-muted-foreground mb-0.5">Need more</p>
                <p className="text-lg font-bold text-red-400">+{shortfall}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-full flex-col gap-2.5">
              <Link
                href="/pricing"
                onClick={closePaywall}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                <Zap className="h-4 w-4" />
                Buy Credits
              </Link>
              <Link
                href="/pricing"
                onClick={closePaywall}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-transparent py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Upgrade Plan
              </Link>
            </div>

          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
