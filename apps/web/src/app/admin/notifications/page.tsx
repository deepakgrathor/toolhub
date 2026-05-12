"use client";

import { useEffect, useState, useCallback } from "react";
import { Megaphone, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentPush {
  _id: unknown;
  title: string;
  message: string;
  sentAt: string;
  count: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminNotificationsPage() {
  const [target, setTarget] = useState<"all" | "specific">("all");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; sent?: number; error?: string } | null>(null);

  const [recent, setRecent] = useState<RecentPush[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const res = await fetch("/api/admin/notifications/recent");
      if (res.ok) {
        const data = (await res.json()) as { notifications: RecentPush[] };
        setRecent(data.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  async function handleSend() {
    if (!title.trim() || !message.trim()) return;
    if (target === "specific" && !email.trim()) return;

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/admin/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, email: email.trim() || undefined, title, message }),
      });
      const data = (await res.json()) as { success?: boolean; sent?: number; error?: string };
      if (res.ok && data.success) {
        setSendResult({ success: true, sent: data.sent });
        setTitle("");
        setMessage("");
        setEmail("");
        void loadRecent();
      } else {
        setSendResult({ success: false, error: data.error ?? "Failed to send" });
      }
    } catch {
      setSendResult({ success: false, error: "Network error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Megaphone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Push Notifications</h1>
          <p className="text-sm text-muted-foreground">Send notifications to users</p>
        </div>
      </div>

      {/* Section 1 — Send notification */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-foreground">Send Notification</h2>

        {/* Target selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Target
          </label>
          <div className="flex gap-4">
            {(["all", "specific"] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="target"
                  value={t}
                  checked={target === t}
                  onChange={() => setTarget(t)}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground capitalize">
                  {t === "all" ? "All Users" : "Specific User"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Email input (specific only) */}
        {target === "specific" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">User Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className={cn(
                "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              )}
            />
          </div>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Title <span className="text-muted-foreground/60">({title.length}/60)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            placeholder="Notification title"
            className={cn(
              "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            )}
          />
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Message <span className="text-muted-foreground/60">({message.length}/200)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            placeholder="Notification message"
            rows={3}
            className={cn(
              "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            )}
          />
        </div>

        {/* Result feedback */}
        {sendResult && (
          <p
            className={cn(
              "text-sm",
              sendResult.success ? "text-green-600 dark:text-green-400" : "text-destructive"
            )}
          >
            {sendResult.success
              ? `Sent to ${sendResult.sent} user${(sendResult.sent ?? 0) !== 1 ? "s" : ""}`
              : sendResult.error}
          </p>
        )}

        {/* Send button */}
        <button
          onClick={() => void handleSend()}
          disabled={
            sending ||
            !title.trim() ||
            !message.trim() ||
            (target === "specific" && !email.trim())
          }
          className={cn(
            "flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white",
            "hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <Send className="h-4 w-4" />
          {sending ? "Sending…" : "Send Notification"}
        </button>
      </div>

      {/* Section 2 — Recent pushes */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Pushes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Last 20 admin push notifications</p>
        </div>

        {recentLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Megaphone className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No push notifications sent yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Recipients</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((n, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {n.count} {n.count === 1 ? "user" : "users"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[160px] truncate">{n.title}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[240px] truncate">{n.message}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(n.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
