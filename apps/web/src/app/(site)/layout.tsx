import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { connectDB, SiteConfig } from "@toolhub/db";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let announcementText = "";
  let announcementVisible = false;

  try {
    await connectDB();
    const [bannerRecord, visibleRecord] = await Promise.all([
      SiteConfig.findOne({ key: "announcement_banner" }).lean(),
      SiteConfig.findOne({ key: "announcement_visible" }).lean(),
    ]);
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
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Navbar />
          <main className="flex-1 overflow-auto animate-in fade-in duration-200">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
