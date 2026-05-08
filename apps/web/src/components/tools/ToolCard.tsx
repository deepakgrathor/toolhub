"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getToolIcon } from "@/lib/tool-icons";

export interface ToolCardData {
  slug: string;
  name: string;
  description: string;
  kits: string[];
  icon: string;
  isFree: boolean;
  config: { creditCost: number };
}

const KIT_LABELS: Record<string, string> = {
  creator: "Creator",
  sme: "SME",
  hr: "HR",
  "ca-legal": "CA/Legal",
  marketing: "Marketing",
};

export function ToolCard({ tool }: { tool: ToolCardData }) {
  const Icon = getToolIcon(tool.slug);

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link href={`/tools/${tool.slug}`} className="block h-full">
        <div
          className={cn(
            "h-full rounded-xl border border-border bg-surface p-4",
            "hover:border-accent/40 transition-colors duration-200",
            "flex flex-col gap-3"
          )}
        >
          {/* Icon + badge row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <Icon className="h-5 w-5 text-accent" />
            </div>
            {tool.isFree ? (
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                FREE
              </span>
            ) : (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {tool.config.creditCost} credits
              </span>
            )}
          </div>

          {/* Name + description */}
          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-semibold text-foreground leading-tight">{tool.name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {tool.description}
            </p>
          </div>

          {/* Kit tags */}
          <div className="flex flex-wrap gap-1">
            {tool.kits.slice(0, 2).map((kit) => (
              <span
                key={kit}
                className="rounded-md bg-white/5 px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {KIT_LABELS[kit] ?? kit}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
