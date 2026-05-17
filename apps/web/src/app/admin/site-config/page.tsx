import type { Metadata } from "next";
import { SiteConfigEditor } from "@/components/admin/SiteConfigEditor";

export const metadata: Metadata = { title: "Site Config — SetuLix Admin" };
export const dynamic = "force-dynamic";

export default function SiteConfigPage() {
  return (
    <div className="p-6">
      <SiteConfigEditor />
    </div>
  );
}
