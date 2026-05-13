"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { ToolBuilder, KitOption } from "@/components/admin/ToolBuilder";
import { ToolsTable } from "@/components/admin/ToolsTable";
import type { AdminToolRow } from "@/app/admin/tools/page";

export function AdminToolsClient({ initialTools }: { initialTools: AdminToolRow[] }) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [kits, setKits] = useState<KitOption[]>([]);

  useEffect(() => {
    fetch("/api/admin/kits")
      .then(r => r.json())
      .then((d: { kits?: Array<{ slug: string; name: string }> }) => {
        setKits((d.kits ?? []).map(k => ({ slug: k.slug, name: k.name })));
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tools</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {initialTools.length} tools — edit inline, changes save automatically
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Add New Tool
        </button>
      </div>

      <ToolsTable initialTools={initialTools} />

      {showBuilder && (
        <ToolBuilder
          kits={kits}
          onClose={() => setShowBuilder(false)}
          onSave={() => {
            setShowBuilder(false);
            // Reload page to show new tool
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
