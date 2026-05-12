"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Plus, Check, Loader2, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToolIcon, getKitIcon } from "@/lib/tool-icons";
import type { ToolWithConfig } from "@/lib/tool-registry";

const KIT_FILTERS = [
  { id: "all",       label: "All Tools",  icon: "LayoutGrid" },
  { id: "creator",   label: "Creator",    icon: "Sparkles" },
  { id: "sme",       label: "SME",        icon: "Building2" },
  { id: "hr",        label: "HR",         icon: "Users" },
  { id: "ca-legal",  label: "Legal",      icon: "Scale" },
  { id: "marketing", label: "Marketing",  icon: "Megaphone" },
];

interface ExploreData {
  tools: ToolWithConfig[];
  userAddedSlugs: string[];
}

function ToolCard({
  tool,
  isAdded,
  onToggle,
  toggling,
}: {
  tool: ToolWithConfig;
  isAdded: boolean;
  onToggle: () => void;
  toggling: boolean;
}) {
  const Icon = getToolIcon(tool.slug);
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Icon className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground leading-tight">{tool.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {tool.config.creditCost === 0 ? "Free" : `${tool.config.creditCost} cr`}
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{tool.description}</p>
      <button
        onClick={onToggle}
        disabled={toggling}
        className={cn(
          "flex items-center justify-center gap-1.5 w-full rounded-lg py-1.5 text-xs font-medium transition-all",
          isAdded
            ? "bg-primary/10 text-primary border border-primary/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
            : "bg-primary text-white hover:opacity-90"
        )}
      >
        {toggling ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isAdded ? (
          <><Check className="h-3.5 w-3.5" /> Added</>
        ) : (
          <><Plus className="h-3.5 w-3.5" /> Add to Workspace</>
        )}
      </button>
    </div>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const { status } = useSession();
  const [data, setData] = useState<ExploreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kitFilter, setKitFilter] = useState("all");
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [status, router]);

  const loadTools = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/explore/tools");
      const d = await res.json() as ExploreData;
      setData(d);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadTools();
  }, [status, loadTools]);

  async function toggleTool(slug: string) {
    if (!data) return;
    const isAdded = data.userAddedSlugs.includes(slug);
    setToggling((s) => new Set(s).add(slug));

    try {
      if (isAdded) {
        await fetch("/api/explore/remove", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        setData((d) => d ? { ...d, userAddedSlugs: d.userAddedSlugs.filter((s) => s !== slug) } : d);
      } else {
        await fetch("/api/explore/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        setData((d) => d ? { ...d, userAddedSlugs: [...d.userAddedSlugs, slug] } : d);
      }
    } catch {
      //
    } finally {
      setToggling((s) => { const n = new Set(s); n.delete(slug); return n; });
    }
  }

  const filteredTools = (data?.tools ?? []).filter((t) => {
    const matchKit = kitFilter === "all" || t.kits.includes(kitFilter);
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchKit && matchSearch;
  });

  if (status === "loading" || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Explore Tools</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover all AI tools and add them to your workspace.
        </p>
      </div>

      {/* Sticky search + filter bar */}
      <div className="sticky top-14 z-20 bg-background/80 backdrop-blur-md pb-4 -mx-4 px-4 border-b border-border mb-4">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {KIT_FILTERS.map(({ id, label }) => {
            const KitIcon = id === "all" ? LayoutGrid : getKitIcon(id);
            return (
              <button
                key={id}
                onClick={() => setKitFilter(id)}
                className={cn(
                  "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  kitFilter === id
                    ? "bg-primary text-white"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                )}
              >
                <KitIcon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool count */}
      <p className="text-xs text-muted-foreground mb-4">
        {filteredTools.length} tools · {data?.userAddedSlugs.length ?? 0} added to workspace
      </p>

      {/* Tool grid */}
      {filteredTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <Search className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No tools found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.slug}
              tool={tool}
              isAdded={data?.userAddedSlugs.includes(tool.slug) ?? false}
              onToggle={() => toggleTool(tool.slug)}
              toggling={toggling.has(tool.slug)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
