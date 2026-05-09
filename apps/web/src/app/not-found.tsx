import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background">
      <SearchX className="w-16 h-16 text-muted-foreground mb-6" />
      <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-8">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
