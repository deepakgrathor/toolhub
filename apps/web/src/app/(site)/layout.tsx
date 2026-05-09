import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { getKitList } from "@/lib/tool-registry";
import { connectDB, SiteConfig } from "@toolhub/db";

/**
 * Site layout — wraps all public/user-facing routes with the collapsible
 * sidebar, top navbar, and announcement banner.
 * Admin routes (/admin/*) are excluded via the route-group split.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let kits: { kit: string; toolCount: number }[] = [];
  let announcementText = "";
  let announcementVisible = false;

  try {
    await connectDB();
    const [kitsResult, bannerRecord, visibleRecord] = await Promise.all([
      getKitList(),
      SiteConfig.findOne({ key: "announcement_banner" }).lean(),
      SiteConfig.findOne({ key: "announcement_visible" }).lean(),
    ]);
    kits = kitsResult;
    announcementText = (bannerRecord?.value as string) ?? "";
    announcementVisible = (visibleRecord?.value as boolean) ?? false;
  } catch {
    // DB unavailable in dev — silent fallback
  }

  return (
    <>
      {announcementVisible && announcementText && (
        <AnnouncementBanner text={announcementText} />
      )}
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar kits={kits} />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Navbar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </>
  );
}
