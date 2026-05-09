import { SIDEBAR_KITS } from "@/lib/kit-config";
import { DashboardToolCard } from "./DashboardToolCard";
import type { ToolWithConfig } from "@/lib/tool-registry";

interface KitSectionProps {
  tools: ToolWithConfig[];
}

export function KitSection({ tools }: KitSectionProps) {
  const toolMap = new Map(tools.map((t) => [t.slug, t]));

  return (
    <div className="space-y-8">
      {SIDEBAR_KITS.map((kit, idx) => {
        const KitIcon = kit.icon;
        const kitTools = kit.tools
          .map((t) => toolMap.get(t.slug))
          .filter((t): t is ToolWithConfig => t !== undefined);

        if (kitTools.length === 0) return null;

        return (
          <div key={kit.id}>
            {idx > 0 && <div className="border-t border-border mb-8" />}

            {/* Kit header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <KitIcon className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">{kit.name}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {kitTools.length}
              </span>
            </div>

            {/* Tool grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {kitTools.map((tool) => (
                <DashboardToolCard
                  key={tool.slug}
                  slug={tool.slug}
                  name={tool.name}
                  description={tool.description}
                  creditCost={tool.config.creditCost}
                  isFree={tool.isFree}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
