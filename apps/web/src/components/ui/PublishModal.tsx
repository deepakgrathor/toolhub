"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Globe,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreditStore } from "@/store/credits-store";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  businessName: string;
  pages: number;
  onPublishSuccess: (siteUrl: string) => void;
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function PublishModal({
  isOpen,
  onClose,
  htmlContent,
  businessName,
  pages,
  onPublishSuccess,
}: PublishModalProps) {
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugError, setSlugError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishCredits, setPublishCredits] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { balance, deductLocally } = useCreditStore();

  useEffect(() => {
    if (isOpen) {
      setSlug("");
      setSlugStatus("idle");
      setSlugError("");
      setIsPublishing(false);
      setPublishedUrl(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/public/website-credits")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.publish != null) setPublishCredits(d.publish);
        else setPublishCredits(10);
      })
      .catch(() => setPublishCredits(10));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPublishing) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isPublishing, onClose]);

  const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

  const checkSlug = useCallback(async (value: string) => {
    if (value.length < 3) {
      setSlugStatus("invalid");
      setSlugError("Minimum 3 characters");
      return;
    }
    if (value.length > 50) {
      setSlugStatus("invalid");
      setSlugError("Maximum 50 characters");
      return;
    }
    if (/--/.test(value)) {
      setSlugStatus("invalid");
      setSlugError("No consecutive hyphens");
      return;
    }
    if (!SLUG_REGEX.test(value)) {
      setSlugStatus("invalid");
      setSlugError("Lowercase letters, numbers, hyphens only");
      return;
    }

    setSlugStatus("checking");
    try {
      const res = await fetch(
        `/api/tools/website-generator/check-slug?slug=${encodeURIComponent(value)}`
      );
      const data = await res.json();
      if (data.available) {
        setSlugStatus("available");
        setSlugError("");
      } else {
        setSlugStatus("taken");
        setSlugError("");
      }
    } catch {
      setSlugStatus("invalid");
      setSlugError("Could not check availability");
    }
  }, []);

  function handleSlugChange(raw: string) {
    const cleaned = raw
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setSlug(cleaned);
    setSlugStatus("idle");
    setSlugError("");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!cleaned) return;

    debounceRef.current = setTimeout(() => checkSlug(cleaned), 600);
  }

  async function handlePublish() {
    if (slugStatus !== "available" || isPublishing) return;
    setIsPublishing(true);

    try {
      const res = await fetch("/api/tools/website-generator/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, htmlContent, businessName, pages }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setSlugStatus("taken");
        setIsPublishing(false);
        return;
      }
      if (res.status === 402) {
        toast.error("Not enough credits");
        setIsPublishing(false);
        return;
      }
      if (!res.ok) {
        toast.error("Something went wrong. Please try again.");
        setIsPublishing(false);
        return;
      }

      if (publishCredits) deductLocally(publishCredits);
      setPublishedUrl(data.siteUrl);
      onPublishSuccess(data.siteUrl);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm",
          isPublishing ? "cursor-not-allowed" : "cursor-pointer"
        )}
        onClick={isPublishing ? undefined : onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-2xl mx-4">
        {!isPublishing && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {publishedUrl ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Globe className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Your website is live!
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Anyone with the link can visit your site.
              </p>
            </div>

            <div className="w-full rounded-lg border border-border bg-surface px-3 py-2.5">
              <p className="break-all text-sm font-medium text-foreground">
                {publishedUrl}
              </p>
            </div>

            <div className="flex w-full gap-2">
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="h-4 w-4" /> Open Website
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(publishedUrl);
                  toast.success("Link copied!");
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors"
              >
                <Copy className="h-4 w-4" /> Copy Link
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Launch Your Website
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a URL for your site
              </p>
            </div>

            <div>
              <div className="flex items-center rounded-lg border border-border bg-surface overflow-hidden">
                <span className="shrink-0 px-3 text-xs text-muted-foreground select-none">
                  https://
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="your-site-name"
                  className="flex-1 bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                  disabled={isPublishing}
                  autoFocus
                />
                <span className="shrink-0 px-3 text-xs text-muted-foreground select-none">
                  .setulix.site
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1.5 min-h-[20px]">
                {slugStatus === "checking" && (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Checking availability...
                    </span>
                  </>
                )}
                {slugStatus === "available" && (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-xs text-green-500">Available!</span>
                  </>
                )}
                {slugStatus === "taken" && (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-xs text-destructive">
                      Already taken
                    </span>
                  </>
                )}
                {slugStatus === "invalid" && slugError && (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs text-amber-500">{slugError}</span>
                  </>
                )}
              </div>

              {slugStatus === "available" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  https://{slug}.setulix.site
                </p>
              )}

              <p className="mt-2 text-[11px] text-muted-foreground/70">
                3-50 characters &middot; lowercase letters, numbers, hyphens only
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-surface/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                Publishing costs{" "}
                <span className="font-medium text-foreground">
                  {publishCredits ?? "..."}cr
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                You have{" "}
                <span className="font-medium text-foreground">{balance}cr</span>
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPublishing}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={slugStatus !== "available" || isPublishing}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  <>
                    Launch
                    {publishCredits != null && (
                      <span className="ml-0.5">
                        &mdash; {publishCredits}cr
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
