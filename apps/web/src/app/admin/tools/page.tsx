import type { Metadata } from "next";
import { connectDB, Tool, ToolConfig } from "@toolhub/db";
import { ToolsTable } from "@/components/admin/ToolsTable";

export const metadata: Metadata = { title: "Admin Tools — SetuLix" };
export const dynamic = "force-dynamic";

export interface AdminToolRow {
  slug: string;
  name: string;
  kits: string[];
  icon: string;
  creditCost: number;
  aiModel: string;
  aiProvider: string;
  isActive: boolean;
  isVisible: boolean;
}

async function getAdminTools(): Promise<AdminToolRow[]> {
  try {
    await connectDB();

    const [tools, configs] = await Promise.all([
      Tool.find().sort({ name: 1 }).lean(),
      ToolConfig.find().lean(),
    ]);

    const configMap = new Map(configs.map((c) => [c.toolSlug, c]));

    return tools.map((tool) => {
      const cfg = configMap.get(tool.slug);
      return {
        slug: tool.slug,
        name: tool.name,
        kits: tool.kits,
        icon: tool.icon,
        creditCost: cfg?.creditCost ?? 0,
        aiModel: cfg?.aiModel ?? "",
        aiProvider: cfg?.aiProvider ?? "",
        isActive: cfg?.isActive ?? true,
        isVisible: cfg?.isVisible ?? true,
      };
    });
  } catch {
    return [];
  }
}

export default async function AdminToolsPage() {
  const tools = await getAdminTools();

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-foreground mb-1">Tools</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {tools.length} tools — edit inline, changes save automatically
      </p>
      <ToolsTable initialTools={tools} />
    </div>
  );
}
