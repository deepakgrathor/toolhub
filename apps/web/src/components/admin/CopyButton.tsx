"use client";

import { Copy } from "lucide-react";

export function CopyButton({ value }: { value: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(value)}
      className="text-muted-foreground hover:text-foreground transition-colors"
      title="Copy to clipboard"
    >
      <Copy className="h-3 w-3" />
    </button>
  );
}
