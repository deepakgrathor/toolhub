"use client";

import { useEffect, useState } from "react";
import { Gift, Copy, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  referralCount: number;
  creditsEarned: number;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 dark:bg-white/10 ${className}`} />;
}

export function ReferralCard() {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral/info")
      .then((r) => r.json())
      .then((data) => setInfo(data))
      .finally(() => setLoading(false));
  }, []);

  function handleCopy() {
    if (!info?.referralLink) return;
    navigator.clipboard.writeText(info.referralLink).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const waText = info?.referralLink
    ? encodeURIComponent(`Join SetuLix and get 15 free credits! ${info.referralLink}`)
    : "";

  return (
    <div className="rounded-xl border border-border bg-surface p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7c3aed]/15">
          <Gift className="h-5 w-5 text-[#7c3aed]" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Refer Friends, Earn Credits</p>
          <p className="text-xs text-muted-foreground">You get 10 credits, they get 15 credits — free</p>
        </div>
      </div>

      {/* Referral link */}
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-9 w-32" />
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              readOnly
              value={info?.referralLink ?? ""}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#7c3aed]/50"
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-[#10b981]" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Stats */}
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{info?.referralCount ?? 0}</span> friends joined
            &nbsp;•&nbsp;
            <span className="font-semibold text-[#10b981]">{info?.creditsEarned ?? 0}</span> credits earned
          </p>

          {/* WhatsApp share */}
          <a
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#25d366] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="h-4 w-4" />
            Share on WhatsApp
          </a>
        </>
      )}
    </div>
  );
}
