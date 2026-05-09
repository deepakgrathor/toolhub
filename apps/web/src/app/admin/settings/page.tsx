import type { Metadata } from "next";
import { connectDB, SiteConfig } from "@toolhub/db";
import { SettingsForm, type SiteSettings } from "@/components/admin/SettingsForm";

export const metadata: Metadata = { title: "Admin Settings — SetuLix" };
export const dynamic = "force-dynamic";

const DEFAULTS: SiteSettings = {
  default_theme: "dark",
  announcement_banner: "",
  announcement_visible: false,
  maintenance_mode: false,
};

async function getSiteSettings(): Promise<SiteSettings> {
  try {
    await connectDB();
    const keys = Object.keys(DEFAULTS) as (keyof SiteSettings)[];
    const records = await SiteConfig.find({ key: { $in: keys } }).lean();
    const map = new Map(records.map((r) => [r.key, r.value]));

    return {
      default_theme:
        (map.get("default_theme") as SiteSettings["default_theme"]) ??
        DEFAULTS.default_theme,
      announcement_banner:
        (map.get("announcement_banner") as string) ??
        DEFAULTS.announcement_banner,
      announcement_visible:
        (map.get("announcement_visible") as boolean) ??
        DEFAULTS.announcement_visible,
      maintenance_mode:
        (map.get("maintenance_mode") as boolean) ?? DEFAULTS.maintenance_mode,
    };
  } catch {
    return DEFAULTS;
  }
}

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-foreground mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Global site configuration. Changes take effect immediately after saving.
      </p>
      <SettingsForm initial={settings} />
    </div>
  );
}
