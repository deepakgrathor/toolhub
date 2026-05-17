"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, ExternalLink, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PublishedWebsite {
  _id: string;
  siteSlug: string;
  siteUrl: string;
  businessName: string;
  pageTitle: string;
  pages: number;
  creditsUsed: number;
  publishedAt: string;
  updatedAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-3 animate-pulse">
      <div className="h-5 w-2/3 rounded bg-muted/40" />
      <div className="h-4 w-full rounded bg-muted/30" />
      <div className="h-4 w-1/3 rounded bg-muted/20" />
      <div className="flex gap-2 pt-2">
        <div className="h-8 w-20 rounded-lg bg-muted/30" />
        <div className="h-8 w-24 rounded-lg bg-muted/30" />
      </div>
    </div>
  );
}

export function MyWebsitesList() {
  const [websites, setWebsites] = useState<PublishedWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [unpublishingId, setUnpublishingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/websites")
      .then((r) => (r.ok ? r.json() : { websites: [] }))
      .then((d) => setWebsites(d.websites ?? []))
      .catch(() => setWebsites([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleUnpublish(site: PublishedWebsite) {
    setUnpublishingId(site._id);
    try {
      const res = await fetch(
        `/api/tools/website-generator/publish/${site._id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        toast.error("Failed to unpublish. Try again.");
        return;
      }
      setWebsites((prev) => prev.filter((w) => w._id !== site._id));
      toast.success(`${site.businessName || site.siteSlug} unpublished`);
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setUnpublishingId(null);
      setConfirmingId(null);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (websites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Globe className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground">
          No websites published yet
        </h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Generate a website and click Publish to launch it on setulix.site
        </p>
        <Link
          href="/tools/website-generator"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <FileText className="h-4 w-4" /> Create a Website
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {websites.map((site) => {
        const isConfirming = confirmingId === site._id;
        const isUnpublishing = unpublishingId === site._id;
        const updatedDiffers =
          site.updatedAt &&
          formatDate(site.updatedAt) !== formatDate(site.publishedAt);

        return (
          <div
            key={site._id}
            className={cn(
              "rounded-xl border border-border bg-surface p-5 space-y-3 transition-all",
              isUnpublishing && "opacity-50 pointer-events-none"
            )}
          >
            <div>
              <h3 className="font-semibold text-foreground truncate">
                {site.businessName || site.siteSlug}
              </h3>
              <a
                href={site.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-full"
              >
                {site.siteUrl}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
                {site.pages} {site.pages === 1 ? "page" : "pages"}
              </span>
              <span>Published {formatDate(site.publishedAt)}</span>
              {updatedDiffers && (
                <span>&middot; Updated {formatDate(site.updatedAt)}</span>
              )}
            </div>

            {isConfirming ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                <p className="text-xs text-foreground">
                  Are you sure? This will take your site offline.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnpublish(site)}
                    className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  >
                    Confirm Unpublish
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <a
                  href={site.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open
                </a>
                <button
                  type="button"
                  onClick={() => setConfirmingId(site._id)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Unpublish
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
