"use client";

import { useState } from "react";
import { Loader2, AlertTriangle, Megaphone, RotateCcw, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface SiteSettings {
  default_theme: "dark" | "light";
  announcement_banner: string;
  announcement_visible: boolean;
  maintenance_mode: boolean;
  credit_rollover_enabled: boolean;
  credit_rollover_days: number;
  welcome_bonus_credits: number;
  referral_joining_bonus: number;
  referral_reward_credits: number;
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save settings.");
      setSaved(true);
      toast.success("Settings saved");
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* ── Theme ─────────────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-[#111] p-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">
          Default Theme
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          The theme shown to visitors who have not set a preference.
        </p>
        <div className="flex items-center gap-4">
          {(["dark", "light"] as const).map((theme) => (
            <label
              key={theme}
              className={cn(
                "flex items-center gap-2.5 cursor-pointer select-none rounded-lg border px-4 py-3 transition-colors",
                settings.default_theme === theme
                  ? "border-[#7c3aed] bg-[#7c3aed]/10 text-[#7c3aed]"
                  : "border-border text-muted-foreground hover:border-border/80"
              )}
            >
              <input
                type="radio"
                name="default_theme"
                value={theme}
                checked={settings.default_theme === theme}
                onChange={() => set("default_theme", theme)}
                className="sr-only"
              />
              <div
                className={cn(
                  "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                  settings.default_theme === theme
                    ? "border-[#7c3aed]"
                    : "border-muted-foreground"
                )}
              >
                {settings.default_theme === theme && (
                  <div className="h-2 w-2 rounded-full bg-[#7c3aed]" />
                )}
              </div>
              <span className="capitalize text-sm font-medium">{theme}</span>
            </label>
          ))}
        </div>
      </section>

      {/* ── Announcement Banner ───────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-[#111] p-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">
          Announcement Banner
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Shown at the top of every page when enabled.
        </p>

        <div className="space-y-3">
          <textarea
            value={settings.announcement_banner}
            onChange={(e) => set("announcement_banner", e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. 🚀 New tools just dropped — check out our Marketing Kit!"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {settings.announcement_banner.length}/500
            </span>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <button
                type="button"
                role="switch"
                aria-checked={settings.announcement_visible}
                onClick={() =>
                  set("announcement_visible", !settings.announcement_visible)
                }
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  settings.announcement_visible ? "bg-[#7c3aed]" : "bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                    settings.announcement_visible
                      ? "translate-x-4"
                      : "translate-x-0.5"
                  )}
                />
              </button>
              <span className="text-sm text-foreground">Show banner</span>
            </label>
          </div>
        </div>

        {settings.announcement_banner && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Preview
            </p>
            <div
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm text-white",
                settings.announcement_visible ? "bg-[#7c3aed]" : "bg-[#7c3aed]/40"
              )}
            >
              <Megaphone className="h-4 w-4 shrink-0" />
              <span className="text-center">{settings.announcement_banner}</span>
            </div>
            {!settings.announcement_visible && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Toggle "Show banner" to make this visible to users.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Credit Rollover ───────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-[#111] p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-[#7c3aed]" />
              Credit Rollover
            </h2>
            <p className="text-xs text-muted-foreground">
              When enabled, unused credits from the current billing period carry
              over to the next period for the configured number of days.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.credit_rollover_enabled}
            onClick={() =>
              set("credit_rollover_enabled", !settings.credit_rollover_enabled)
            }
            className={cn(
              "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
              settings.credit_rollover_enabled ? "bg-[#7c3aed]" : "bg-muted/40"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                settings.credit_rollover_enabled ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </button>
        </div>

        {settings.credit_rollover_enabled && (
          <div className="mt-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Max rollover days
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={settings.credit_rollover_days}
              onChange={(e) =>
                set("credit_rollover_days", Math.max(1, parseInt(e.target.value, 10) || 30))
              }
              className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Unused credits roll over for up to {settings.credit_rollover_days} days.
            </p>
          </div>
        )}
      </section>

      {/* ── Maintenance Mode ─────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-[#111] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">
              Maintenance Mode
            </h2>
            <p className="text-xs text-muted-foreground">
              When enabled, all users (except admins) will see a maintenance
              page. Admin routes remain accessible.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.maintenance_mode}
            onClick={() => set("maintenance_mode", !settings.maintenance_mode)}
            className={cn(
              "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
              settings.maintenance_mode ? "bg-red-500" : "bg-muted/40"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                settings.maintenance_mode ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </button>
        </div>

        {settings.maintenance_mode && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">
              This will show a maintenance page to all users. Save to apply.
            </p>
          </div>
        )}
      </section>

      {/* ── Bonus & Rewards ──────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-[#111] p-6">
        <h2 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <Gift className="h-4 w-4 text-[#7c3aed]" />
          Bonus &amp; Rewards
        </h2>
        <p className="text-xs text-muted-foreground mb-5">
          Credits awarded to users for signup and referrals.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Welcome Bonus (Direct Signup)
            </label>
            <p className="text-xs text-muted-foreground mb-2">Credits given to users who sign up directly</p>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.welcome_bonus_credits}
              onChange={(e) => set("welcome_bonus_credits", Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))}
              className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Joining Bonus (Referred User)
            </label>
            <p className="text-xs text-muted-foreground mb-2">Credits given to user who joins via referral link</p>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.referral_joining_bonus}
              onChange={(e) => set("referral_joining_bonus", Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))}
              className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Referrer Reward
            </label>
            <p className="text-xs text-muted-foreground mb-2">Credits given to referrer when friend completes onboarding</p>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.referral_reward_credits}
              onChange={(e) => set("referral_reward_credits", Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))}
              className="w-32 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>
        </div>
      </section>

      {/* ── Save bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-[#111] px-6 py-4">
        <div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {saved && (
            <p className="text-sm text-[#10b981]">Settings saved successfully.</p>
          )}
          {!error && !saved && (
            <p className="text-xs text-muted-foreground">
              Changes are not applied until you click Save.
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#7c3aed] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#6d28d9] disabled:opacity-60 transition-colors"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
