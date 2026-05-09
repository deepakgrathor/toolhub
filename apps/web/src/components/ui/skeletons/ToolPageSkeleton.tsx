function Pulse({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} style={style} />;
}

import React from "react";

export function ToolPageSkeleton() {
  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* Left panel */}
      <div className="lg:w-[45%] lg:border-r border-border p-6 space-y-5">
        {/* Tool header */}
        <div className="flex items-start gap-4">
          <Pulse className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Pulse className="h-5 w-36" />
              <Pulse className="h-5 w-16 rounded-full" />
            </div>
            <Pulse className="h-3 w-full" />
            <Pulse className="h-3 w-3/4" />
          </div>
        </div>

        {/* Field 1 */}
        <div className="space-y-2">
          <Pulse className="h-4 w-24" />
          <Pulse className="h-10 w-full rounded-lg" />
        </div>

        {/* Pills */}
        <div className="space-y-2">
          <Pulse className="h-4 w-28" />
          <div className="flex gap-2 flex-wrap">
            {[96, 80, 88, 76].map((w, i) => (
              <Pulse key={i} className={`h-9 rounded-full`} style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Pills 2 */}
        <div className="space-y-2">
          <Pulse className="h-4 w-24" />
          <div className="flex gap-2 flex-wrap">
            {[80, 96, 104].map((w, i) => (
              <Pulse key={i} className={`h-9 rounded-full`} style={{ width: w }} />
            ))}
          </div>
        </div>

        {/* Field 2 */}
        <div className="space-y-2">
          <Pulse className="h-4 w-32" />
          <Pulse className="h-10 w-full rounded-lg" />
        </div>

        {/* Button */}
        <Pulse className="h-10 w-full rounded-lg bg-accent/30" />
      </div>

      {/* Right panel */}
      <div className="lg:w-[55%] p-6">
        <div className="h-full min-h-[300px] rounded-xl border border-dashed border-border bg-surface/50 p-8 flex flex-col items-center justify-center gap-4">
          <Pulse className="h-10 w-10 rounded-xl" />
          <div className="w-full max-w-sm space-y-2 text-center">
            <Pulse className="h-4 w-40 mx-auto" />
            <Pulse className="h-3 w-56 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
