"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/store/search-store";

const KIT_LABELS: Record<string, string> = {
  creator: "Creator",
  sme: "SME",
  hr: "HR",
  "ca-legal": "CA/Legal",
  marketing: "Marketing",
};

export function CommandSearch() {
  const router = useRouter();
  const { isOpen, tools, setOpen, setTools } = useSearchStore();

  // Fetch tools once and cache in store
  useEffect(() => {
    if (tools.length > 0) return;
    fetch("/api/tools")
      .then((r) => r.json())
      .then(({ tools: t }) => setTools(t ?? []))
      .catch(() => {});
  }, [tools.length, setTools]);

  // Global Cmd+K / Ctrl+K listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
    },
    [isOpen, setOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const navigate = (slug: string) => {
    router.push(`/tools/${slug}`);
    setOpen(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2",
            "rounded-xl border border-border bg-surface shadow-2xl overflow-hidden",
            "focus:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Search tools</Dialog.Title>
          <Command className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Command.Input
                placeholder="Search tools..."
                className="flex-1 bg-transparent py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <kbd className="hidden sm:flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground font-mono">
                ESC
              </kbd>
            </div>

            <Command.List className="max-h-[360px] overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                No tools found.
              </Command.Empty>

              <Command.Group
                heading="Tools"
                className="[&>[cmdk-group-heading]]:px-2 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:text-xs [&>[cmdk-group-heading]]:font-medium [&>[cmdk-group-heading]]:text-muted-foreground"
              >
                {tools.map((tool) => (
                  <Command.Item
                    key={tool.slug}
                    value={tool.name}
                    onSelect={() => navigate(tool.slug)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer",
                      "text-foreground transition-colors",
                      "aria-selected:bg-accent/10 aria-selected:text-accent"
                    )}
                  >
                    <span className="text-base shrink-0">{tool.icon}</span>
                    <span className="flex-1 font-medium">{tool.name}</span>
                    <div className="flex items-center gap-2">
                      {tool.kits[0] && (
                        <span className="text-xs text-muted-foreground">
                          {KIT_LABELS[tool.kits[0]] ?? tool.kits[0]}
                        </span>
                      )}
                      {tool.isFree ? (
                        <span className="text-xs font-semibold text-success">FREE</span>
                      ) : (
                        <span className="text-xs font-semibold text-accent">
                          {tool.config.creditCost}cr
                        </span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
