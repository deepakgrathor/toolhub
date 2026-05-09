"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);

    if (
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      typeof window !== "undefined" &&
      (window as unknown as { posthog?: { capture: (event: string, props: object) => void } }).posthog
    ) {
      const ph = (window as unknown as { posthog: { capture: (event: string, props: object) => void } }).posthog;
      ph.capture("global_error", {
        error: error.message,
        digest: error.digest,
        stack: error.stack?.slice(0, 500),
      });
    }
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background">
      <div className="max-w-md w-full space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 mx-auto">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. Your data and credits are safe.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-surface transition-colors"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
