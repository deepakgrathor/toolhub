"use client";

import Link from "next/link";
import { useCreditStore } from "@/store/credits-store";

export function GreetingTagline() {
  const { balance, isLoading } = useCreditStore();

  if (isLoading) {
    return <div className="h-4 w-56 animate-pulse rounded bg-muted/50 mt-1" />;
  }

  if (balance === 0) {
    return (
      <p className="text-sm text-muted-foreground mt-1">
        <Link href="/pricing" className="text-primary font-medium hover:underline">
          Buy credits
        </Link>{" "}
        to unlock AI tools →
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground mt-1">
      You have{" "}
      <span className="text-primary font-semibold">{balance} credits</span> — ready to create.
    </p>
  );
}
