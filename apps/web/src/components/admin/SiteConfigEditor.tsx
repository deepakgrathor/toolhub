"use client";

import { useState, useEffect, useRef } from "react";
import {
  Database,
  Search,
  Pencil,
  Check,
  X,
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConfigEntry {
  key: string;
  value: string | number | boolean;
  updatedAt: string;
}

interface GroupedConfigs {
  label: string;
  prefix: string;
  entries: ConfigEntry[];
}

const GROUP_DEFS: { prefix: string; label: string }[] = [
  { prefix: "website_", label: "Website Generator" },
  { prefix: "thumbnail_", label: "Thumbnail AI" },
  { prefix: "referral_", label: "Referral" },
  { prefix: "welcome_", label: "Welcome Credits" },
  { prefix: "default_", label: "Defaults" },
  { prefix: "credit_", label: "Credit System" },
  { prefix: "announcement_", label: "Announcement" },
  { prefix: "maintenance_", label: "Maintenance" },
];

function groupConfigs(entries: ConfigEntry[]): GroupedConfigs[] {
  const used = new Set<string>();
  const groups: GroupedConfigs[] = [];

  for (const def of GROUP_DEFS) {
    const matching = entries.filter((e) => e.key.startsWith(def.prefix));
    if (matching.length > 0) {
      matching.forEach((e) => used.add(e.key));
      groups.push({ label: def.label, prefix: def.prefix, entries: matching });
    }
  }

  const remaining = entries.filter((e) => !used.has(e.key));
  if (remaining.length > 0) {
    groups.push({ label: "General", prefix: "", entries: remaining });
  }

  return groups;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatValue(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function parseInputValue(
  raw: string,
  original: string | number | boolean
): string | number | boolean {
  if (typeof original === "boolean") {
    const lower = raw.trim().toLowerCase();
    return lower === "true" || lower === "1" || lower === "yes";
  }
  if (typeof original === "number") {
    const num = Number(raw);
    return isNaN(num) ? raw : num;
  }
  return raw;
}

export function SiteConfigEditor() {
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (editingKey && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingKey]);

  async function fetchConfigs() {
    try {
      const res = await fetch("/api/admin/site-config");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConfigs(data.configs);
    } catch {
      toast.error("Failed to load site config");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(entry: ConfigEntry) {
    setEditingKey(entry.key);
    setEditValue(formatValue(entry.value));
  }

  function cancelEdit() {
    setEditingKey(null);
    setEditValue("");
  }

  async function saveEdit(entry: ConfigEntry) {
    const parsed = parseInputValue(editValue, entry.value);
    if (parsed === entry.value) {
      cancelEdit();
      return;
    }

    setSavingKey(entry.key);
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: entry.key, value: parsed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      setConfigs((prev) =>
        prev.map((c) =>
          c.key === entry.key
            ? { ...c, value: parsed, updatedAt: new Date().toISOString() }
            : c
        )
      );
      toast.success(`${entry.key} updated`);
      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingKey(null);
    }
  }

  async function addNewKey() {
    const key = newKey.trim();
    const raw = newValue.trim();
    if (!key || !raw) {
      toast.error("Key and value are required");
      return;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      toast.error("Key must be snake_case (e.g. my_setting)");
      return;
    }
    if (configs.some((c) => c.key === key)) {
      toast.error("Key already exists — edit it instead");
      return;
    }

    let value: string | number | boolean = raw;
    if (raw === "true") value = true;
    else if (raw === "false") value = false;
    else if (!isNaN(Number(raw)) && raw !== "") value = Number(raw);

    setAddingNew(true);
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add key");
      }
      setConfigs((prev) =>
        [...prev, { key, value, updatedAt: new Date().toISOString() }].sort(
          (a, b) => a.key.localeCompare(b.key)
        )
      );
      setNewKey("");
      setNewValue("");
      toast.success(`${key} added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Add failed");
    } finally {
      setAddingNew(false);
    }
  }

  function toggleGroup(prefix: string) {
    setCollapsed((prev) => ({ ...prev, [prefix]: !prev[prefix] }));
  }

  const filtered = search
    ? configs.filter(
        (c) =>
          c.key.toLowerCase().includes(search.toLowerCase()) ||
          formatValue(c.value).toLowerCase().includes(search.toLowerCase())
      )
    : configs;

  const groups = groupConfigs(filtered);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Database className="h-5 w-5 text-[#7c3aed]" />
          <h1 className="text-xl font-bold text-foreground">
            Site Configuration
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage global settings and credit costs. Changes apply immediately
          after saving.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search keys..."
          className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
        />
      </div>

      {/* Config groups */}
      {groups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            {search ? "No keys match your search." : "No configuration found."}
          </p>
        </div>
      )}

      {groups.map((group, groupIdx) => {
        const isCollapsed = collapsed[group.prefix] ?? groupIdx > 0;
        return (
          <div
            key={group.prefix || "__general"}
            className="rounded-xl border border-border overflow-hidden"
          >
            {/* Group header */}
            <button
              type="button"
              onClick={() => toggleGroup(group.prefix)}
              className="flex w-full items-center justify-between bg-card px-4 py-3 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-semibold text-foreground">
                  {group.label}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {group.entries.length}
                </span>
              </div>
            </button>

            {/* Rows */}
            {!isCollapsed && (
              <div className="divide-y divide-border">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_1fr_140px_80px] gap-2 px-4 py-2 bg-muted/20">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Key
                  </span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Value
                  </span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Updated
                  </span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                    Actions
                  </span>
                </div>

                {group.entries.map((entry) => {
                  const isEditing = editingKey === entry.key;
                  const isSaving = savingKey === entry.key;

                  return (
                    <div
                      key={entry.key}
                      className="grid grid-cols-[1fr_1fr_140px_80px] gap-2 px-4 py-2.5 items-center hover:bg-muted/10 transition-colors"
                    >
                      {/* Key */}
                      <span className="font-mono text-sm text-foreground truncate">
                        {entry.key}
                      </span>

                      {/* Value */}
                      {isEditing ? (
                        <input
                          ref={editInputRef}
                          type={typeof entry.value === "number" ? "number" : "text"}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(entry);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          disabled={isSaving}
                          className="rounded-md border border-[#7c3aed] bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                        />
                      ) : (
                        <span
                          className={cn(
                            "text-sm truncate",
                            typeof entry.value === "boolean"
                              ? entry.value
                                ? "text-[#10b981] font-medium"
                                : "text-muted-foreground"
                              : "text-foreground"
                          )}
                        >
                          {formatValue(entry.value)}
                        </span>
                      )}

                      {/* Updated */}
                      <span className="text-xs text-muted-foreground truncate">
                        {formatDate(entry.updatedAt)}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveEdit(entry)}
                              disabled={isSaving}
                              className="rounded-md p-1.5 text-[#10b981] hover:bg-[#10b981]/10 transition-colors disabled:opacity-50"
                              title="Save"
                            >
                              {isSaving ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={isSaving}
                              className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(entry)}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-[#7c3aed] hover:bg-[#7c3aed]/10 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Add new key */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Add New Key
        </h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">
              Key
            </label>
            <input
              type="text"
              value={newKey}
              onChange={(e) =>
                setNewKey(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, "")
                )
              }
              placeholder="my_new_setting"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">
              Value
            </label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="10"
              onKeyDown={(e) => {
                if (e.key === "Enter") addNewKey();
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7c3aed] focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
            />
          </div>
          <button
            type="button"
            onClick={addNewKey}
            disabled={addingNew || !newKey.trim() || !newValue.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {addingNew ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Key must be snake_case. Numbers, booleans (true/false), and strings
          are auto-detected.
        </p>
      </div>
    </div>
  );
}
