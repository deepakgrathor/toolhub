import Link from "next/link";
import { getToolIcon } from "@/lib/tool-icons";

interface DashboardToolCardProps {
  slug: string;
  name: string;
  description: string;
  creditCost: number;
  isFree: boolean;
}

export function DashboardToolCard({
  slug,
  name,
  description,
  creditCost,
  isFree,
}: DashboardToolCardProps) {
  const Icon = getToolIcon(slug);

  return (
    <Link href={`/tools/${slug}`}>
      <div className="tool-card group flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5 transition-all duration-150 hover:scale-[1.02] hover:border-primary/40 hover:shadow-md cursor-pointer">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-foreground truncate">{name}</span>
            {isFree ? (
              <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500">
                FREE
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {creditCost}cr
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>
    </Link>
  );
}
