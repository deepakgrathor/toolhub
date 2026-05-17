import { Metadata } from "next";
import { MyWebsitesList } from "@/components/dashboard/MyWebsitesList";

export const metadata: Metadata = {
  title: "My Websites — SetuLix",
  description: "Manage your published websites on setulix.site.",
};

export const dynamic = "force-dynamic";

export default function MyWebsitesPage() {
  return (
    <div className="min-h-full px-4 py-8 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Websites</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Websites you&apos;ve published on setulix.site
        </p>
      </div>
      <MyWebsitesList />
    </div>
  );
}
