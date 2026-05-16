"use client";

import { useState } from "react";
import {
  FileText, Video, Image, Heading, Zap, MessageSquare,
  Receipt, Wallet, ClipboardList, Globe, QrCode, MessageCircle,
  Banknote, FileSearch, Briefcase, Mail, TrendingUp, Shield,
  Calculator, Table2, Gavel, Lock, AlertCircle, AtSign,
  Linkedin, BarChart2, BadgeDollarSign, Wrench, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AdminToolRow } from "@/app/admin/tools/page";

const KIT_OPTIONS = [
  { value: "creator",   label: "Creator Kit" },
  { value: "sme",       label: "SME Kit" },
  { value: "hr",        label: "HR Kit" },
  { value: "ca-legal",  label: "CA / Legal" },
  { value: "marketing", label: "Marketing Kit" },
] as const;

const ICON_MAP: Record<string, React.ElementType> = {
  FileText, Video, Image, Heading, Zap, MessageSquare,
  Receipt, Wallet, ClipboardList, Globe, QrCode, MessageCircle,
  Banknote, FileSearch, Briefcase, Mail, TrendingUp, Shield,
  Calculator, Table2, Gavel, Lock, AlertCircle, AtSign,
  Linkedin, BarChart2, BadgeDollarSign, Wrench,
};

const MODEL_OPTIONS = [
  { value: "", label: "—", provider: "" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai" },
  { value: "gpt-4o", label: "GPT-4o", provider: "openai" },
  { value: "claude-haiku-3-5", label: "Haiku 3.5", provider: "anthropic" },
  { value: "claude-sonnet-4-5", label: "Sonnet 4.5", provider: "anthropic" },
  { value: "gemini-flash-2.0", label: "Gemini Flash", provider: "google" },
  { value: "gpt-image-1", label: "GPT Image 1", provider: "openai" },
];

type RowState = {
  creditCost: number;
  aiModel: string;
  aiProvider: string;
  isActive: boolean;
  isVisible: boolean;
  kits: string[];
  saving: boolean;
};

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      onClick={onChange}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#7c3aed] focus:ring-offset-1 focus:ring-offset-background",
        on ? "bg-[#7c3aed]" : "bg-border"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
          on ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function ToolsTable({ initialTools }: { initialTools: AdminToolRow[] }) {
  const [rows, setRows] = useState<Map<string, RowState>>(() => {
    const m = new Map<string, RowState>();
    for (const t of initialTools) {
      m.set(t.slug, {
        creditCost: t.creditCost,
        aiModel: t.aiModel,
        aiProvider: t.aiProvider,
        isActive: t.isActive,
        isVisible: t.isVisible,
        kits: t.kits,
        saving: false,
      });
    }
    return m;
  });

  const [creditDrafts, setCreditDrafts] = useState<Map<string, number>>(() => {
    const m = new Map<string, number>();
    for (const t of initialTools) m.set(t.slug, t.creditCost);
    return m;
  });

  async function patch(slug: string, body: object) {
    setRows((prev) => {
      const m = new Map(prev);
      const row = m.get(slug);
      if (row) m.set(slug, { ...row, saving: true });
      return m;
    });

    try {
      const res = await fetch(`/api/admin/tools/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setRows((prev) => {
          const m = new Map(prev);
          const row = m.get(slug);
          if (row) {
            m.set(slug, {
              ...row,
              creditCost: data.config?.creditCost ?? row.creditCost,
              aiModel: data.config?.aiModel ?? row.aiModel,
              aiProvider: data.config?.aiProvider ?? row.aiProvider,
              isActive: data.config?.isActive ?? row.isActive,
              isVisible: data.config?.isVisible ?? row.isVisible,
              kits: data.kits ?? row.kits,
              saving: false,
            });
          }
          return m;
        });
        toast.success("Tool updated");
      } else {
        toast.error("Failed to update tool");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setRows((prev) => {
        const m = new Map(prev);
        const row = m.get(slug);
        if (row) m.set(slug, { ...row, saving: false });
        return m;
      });
    }
  }

  function handleCreditsBlur(slug: string) {
    const draft = creditDrafts.get(slug);
    const current = rows.get(slug)?.creditCost;
    if (draft !== undefined && draft !== current) {
      setRows((prev) => {
        const m = new Map(prev);
        const row = m.get(slug);
        if (row) m.set(slug, { ...row, creditCost: draft });
        return m;
      });
      patch(slug, { creditCost: draft });
    }
  }

  function handleModelChange(slug: string, model: string) {
    const provider = MODEL_OPTIONS.find((o) => o.value === model)?.provider ?? "";
    setRows((prev) => {
      const m = new Map(prev);
      const row = m.get(slug);
      if (row) m.set(slug, { ...row, aiModel: model, aiProvider: provider });
      return m;
    });
    patch(slug, { aiModel: model, aiProvider: provider });
  }

  function handleToggleActive(slug: string) {
    const next = !rows.get(slug)?.isActive;
    setRows((prev) => {
      const m = new Map(prev);
      const row = m.get(slug);
      if (row) m.set(slug, { ...row, isActive: next });
      return m;
    });
    patch(slug, { isActive: next });
  }

  function handleToggleVisible(slug: string) {
    const next = !rows.get(slug)?.isVisible;
    setRows((prev) => {
      const m = new Map(prev);
      const row = m.get(slug);
      if (row) m.set(slug, { ...row, isVisible: next });
      return m;
    });
    patch(slug, { isVisible: next });
  }

  function handleKitChange(slug: string, kit: string) {
    setRows((prev) => {
      const m = new Map(prev);
      const row = m.get(slug);
      if (row) m.set(slug, { ...row, kits: [kit] });
      return m;
    });
    patch(slug, { kit });
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <div className="min-w-[900px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 w-8" />
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tool</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Kit</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-28">Credits</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-44">Model</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground w-20">
                Enable
              </th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground w-20">
                <span className="flex items-center justify-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> Show
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {initialTools.map((tool, i) => {
              const state = rows.get(tool.slug);
              if (!state) return null;
              const Icon = ICON_MAP[tool.icon] ?? Wrench;

              return (
                <tr
                  key={tool.slug}
                  className={cn(
                    "border-b border-border last:border-0 transition-opacity",
                    i % 2 === 0 ? "bg-transparent" : "bg-muted/50/40",
                    state.saving && "opacity-50",
                    !state.isVisible && "opacity-60"
                  )}
                >
                  <td className="px-4 py-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground leading-tight">{tool.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{tool.slug}</p>
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={state.kits[0] ?? ""}
                      onChange={(e) => handleKitChange(tool.slug, e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                    >
                      {KIT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      value={creditDrafts.get(tool.slug) ?? state.creditCost}
                      onChange={(e) =>
                        setCreditDrafts((prev) => {
                          const m = new Map(prev);
                          m.set(tool.slug, Number(e.target.value));
                          return m;
                        })
                      }
                      onBlur={() => handleCreditsBlur(tool.slug)}
                      className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={state.aiModel}
                      onChange={(e) => handleModelChange(tool.slug, e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                    >
                      {MODEL_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <Toggle
                      on={state.isActive}
                      onChange={() => handleToggleActive(tool.slug)}
                      label={state.isActive ? "Disable tool" : "Enable tool"}
                    />
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleVisible(tool.slug)}
                      title={state.isVisible ? "Hide from users" : "Show to users"}
                      className={cn(
                        "rounded-lg p-1.5 transition-colors",
                        state.isVisible
                          ? "text-emerald-500 hover:bg-emerald-500/10"
                          : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {state.isVisible
                        ? <Eye className="h-4 w-4" />
                        : <EyeOff className="h-4 w-4" />
                      }
                    </button>
                  </td>
                </tr>
              );
            })}

            {initialTools.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No tools found. Run the seed script to populate tools.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
