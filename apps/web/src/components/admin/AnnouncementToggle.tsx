"use client";

import { useState } from "react";
import { Megaphone, Eye, EyeOff, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  initialText: string;
  initialVisible: boolean;
}

export function AnnouncementToggle({ initialText, initialVisible }: Props) {
  const [visible, setVisible] = useState(initialVisible);
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !visible;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcement_visible: next }),
      });
      if (res.ok) {
        setVisible(next);
        toast.success(next ? "Banner shown to users" : "Banner hidden");
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Network error");
    }
    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Announcement</h3>
        </div>
        <a
          href="/admin/settings"
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Edit in Settings"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <p className={cn(
        "text-xs mb-3 line-clamp-2 leading-relaxed",
        text ? "text-foreground" : "text-muted-foreground italic"
      )}>
        {text || "No announcement set"}
      </p>

      <button
        onClick={toggle}
        disabled={saving || !text}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors",
          visible
            ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
            : "bg-[#7c3aed]/10 text-[#7c3aed] hover:bg-[#7c3aed]/20",
          (saving || !text) && "opacity-40 cursor-not-allowed"
        )}
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : visible ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
        {visible ? "Hide Banner" : "Show Banner"}
      </button>
    </div>
  );
}
