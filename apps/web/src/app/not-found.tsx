import Link from "next/link";
import { SearchX } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background">
      <div className="mb-8">
        <Logo size="md" href="/" />
      </div>
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-6">
        <SearchX className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2">404 — Page Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
