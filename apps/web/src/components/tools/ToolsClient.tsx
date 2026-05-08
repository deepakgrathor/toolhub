"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolCard, type ToolCardData } from "./ToolCard";

const KITS = [
  { kit: "all", emoji: "🧰", label: "All" },
  { kit: "creator", emoji: "🎨", label: "Creator" },
  { kit: "sme", emoji: "🏪", label: "SME" },
  { kit: "hr", emoji: "👥", label: "HR" },
  { kit: "ca-legal", emoji: "⚖️", label: "CA/Legal" },
  { kit: "marketing", emoji: "📣", label: "Marketing" },
];

export function ToolsClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tools, setTools] = useState<ToolCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const activeKit = searchParams.get("kit") ?? "all";

  useEffect(() => {
    fetch("/api/tools")
      .then((r) => r.json())
      .then(({ tools: t }) => setTools(t ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = tools;
    if (activeKit !== "all") {
      list = list.filter((t) => t.kits.includes(activeKit));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tools, activeKit, query]);

  const setKit = (kit: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (kit === "all") params.delete("kit");
    else params.set("kit", kit);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Tools</h1>
        <p className="text-muted-foreground text-sm mt-1">
          AI-powered tools for every professional need
        </p>
      </div>

      {/* Kit filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {KITS.map(({ kit, emoji, label }) => (
          <button
            key={kit}
            onClick={() => setKit(kit)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeKit === kit
                ? "bg-accent text-white"
                : "bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-accent/40"
            )}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tools..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-colors"
        />
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {tools.length} tools
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-surface border border-border animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-foreground font-medium">No tools found</p>
          <p className="text-muted-foreground text-sm mt-1">Try a different search or kit filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </div>
  );
}
