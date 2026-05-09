export function ToolLoadingSkeleton() {
  return (
    <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
      {/* Left panel skeleton */}
      <div className="lg:w-[45%] lg:border-r border-border p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-muted animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 rounded bg-muted animate-pulse" />
            <div className="h-3 w-64 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-28 rounded bg-muted animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-9 w-24 rounded-full bg-muted animate-pulse" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 w-28 rounded-full bg-muted animate-pulse" />
            ))}
          </div>
        </div>
        <div className="h-10 w-full rounded-lg bg-accent/30 animate-pulse" />
      </div>

      {/* Right panel skeleton */}
      <div className="lg:w-[55%] p-6 space-y-4">
        <div className="h-6 w-48 rounded bg-muted animate-pulse" />
        <div className="h-3 w-full rounded bg-muted animate-pulse" />
        <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
        <div className="h-3 w-4/6 rounded bg-muted animate-pulse" />
        <div className="h-4 w-32 rounded bg-muted animate-pulse mt-4" />
        <div className="h-3 w-full rounded bg-muted animate-pulse" />
        <div className="h-3 w-full rounded bg-muted animate-pulse" />
        <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}
