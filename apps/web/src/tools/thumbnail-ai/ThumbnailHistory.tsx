"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Download, ImageIcon, Loader2, RefreshCw } from "lucide-react";

interface Thumbnail {
  id: string;
  imageUrl: string;
  prompt: string;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden animate-pulse">
      <div className="aspect-video w-full bg-muted/50" />
      <div className="p-2 space-y-1.5">
        <div className="h-2.5 w-3/4 rounded bg-muted/50" />
        <div className="h-2 w-1/3 rounded bg-muted/50" />
      </div>
    </div>
  );
}

interface ThumbnailHistoryProps {
  /** When provided, prepend this newly-generated thumbnail to the top */
  newThumbnail?: { imageUrl: string; prompt: string } | null;
}

export function ThumbnailHistory({ newThumbnail }: ThumbnailHistoryProps) {
  const [items, setItems] = useState<Thumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const fetchPage = useCallback(async (p: number, append = false) => {
    try {
      const res = await fetch(`/api/tools/thumbnail-ai/history?page=${p}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems((prev) => (append ? [...prev, ...data.thumbnails] : data.thumbnails));
      setHasMore(data.hasMore);
      setTotal(data.total);
      setPage(p);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPage(1).finally(() => setLoading(false));
  }, [fetchPage]);

  // Prepend newly-generated thumbnail
  useEffect(() => {
    if (newThumbnail) {
      setItems((prev) => [
        { id: `new-${Date.now()}`, imageUrl: newThumbnail.imageUrl, prompt: newThumbnail.prompt, createdAt: new Date().toISOString() },
        ...prev,
      ]);
      setTotal((t) => t + 1);
    }
  }, [newThumbnail]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchPage(page + 1, true);
    setLoadingMore(false);
  };

  const handleDownload = (url: string, prompt: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.download = `thumbnail-${prompt.slice(0, 20).replace(/\s+/g, "-")}.png`;
    a.click();
  };

  if (loading) {
    return (
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">My Thumbnails</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">My Thumbnails</h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 py-12 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No thumbnails yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Generate your first one above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground">
          My Thumbnails
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-normal">
            {total}
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.id} className="group relative rounded-xl border border-border bg-surface overflow-hidden">
            {failedImages.has(item.id) ? (
              <div className="aspect-video w-full flex items-center justify-center bg-muted/30">
                <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
              </div>
            ) : (
              <div className="relative aspect-video w-full">
                <Image
                  src={item.imageUrl}
                  alt={item.prompt || "Generated thumbnail"}
                  fill
                  className="object-cover"
                  onError={() => setFailedImages((s) => new Set([...s, item.id]))}
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleDownload(item.imageUrl, item.prompt)}
                    className="flex items-center gap-1.5 rounded-lg bg-white/15 border border-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </div>
              </div>
            )}
            <div className="p-2">
              <p className="text-xs text-foreground truncate">{item.prompt || "No prompt"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(item.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
          >
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
