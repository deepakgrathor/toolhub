"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background">
      <AlertTriangle className="w-16 h-16 text-destructive mb-6" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Something Went Wrong</h1>
      <p className="text-muted-foreground mb-8">
        An unexpected error occurred. Please try again.
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-surface transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
