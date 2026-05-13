"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Coins, X } from "lucide-react";
import { usePaywallStore } from "@/store/paywall-store";
import { useCreditStore } from "@/store/credits-store";

export function PaywallModal() {
  const { isOpen, toolName, requiredCredits, closePaywall } = usePaywallStore();
  const balance = useCreditStore((s) => s.balance);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closePaywall()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-[#111111] p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none transition-opacity">
            <X className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7c3aed]/15">
              <Coins className="h-7 w-7 text-[#7c3aed]" />
            </div>

            <Dialog.Title className="text-lg font-semibold text-foreground">
              You need more credits
            </Dialog.Title>

            <Dialog.Description className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{toolName}</span> costs{" "}
              <span className="font-semibold text-[#7c3aed]">{requiredCredits} credits</span>.
              You have <span className="font-semibold text-foreground">{balance} credits</span>.
            </Dialog.Description>

            <div className="flex w-full gap-2 mt-1">
              <Link
                href="/checkout?type=pack"
                onClick={closePaywall}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#7c3aed] py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                <Coins className="h-4 w-4" />
                Buy Credits
              </Link>
              <Link
                href="/pricing"
                onClick={closePaywall}
                className="flex flex-1 items-center justify-center rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-white/5 transition-colors"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
