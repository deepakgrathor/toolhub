function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export function StatsBarSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3">
          <Pulse className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Pulse className="h-6 w-14" />
            <Pulse className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentActivitySkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Pulse className="h-4 w-36" />
        <Pulse className="h-3 w-14" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Pulse className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Pulse className="h-3 w-28" />
              <Pulse className="h-2.5 w-16" />
            </div>
            <Pulse className="h-6 w-14 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function KitSectionSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, kitIdx) => (
        <div key={kitIdx}>
          {kitIdx > 0 && <div className="border-t border-border mb-8" />}
          <div className="flex items-center gap-2 mb-4">
            <Pulse className="h-7 w-7 rounded-lg shrink-0" />
            <Pulse className="h-4 w-28" />
            <Pulse className="h-5 w-7 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Pulse className="h-9 w-9 rounded-lg shrink-0" />
                  <Pulse className="h-4 w-24 flex-1" />
                </div>
                <Pulse className="h-3 w-full" />
                <Pulse className="h-3 w-4/5" />
                <Pulse className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-full px-4 py-8 md:px-8 max-w-6xl mx-auto space-y-10">
      {/* Greeting */}
      <div className="space-y-2">
        <Pulse className="h-7 w-60" />
        <Pulse className="h-4 w-44" />
      </div>

      {/* Stats bar */}
      <StatsBarSkeleton />

      {/* Recent activity */}
      <RecentActivitySkeleton />

      {/* All tools */}
      <div>
        <Pulse className="h-5 w-24 mb-4" />
        <KitSectionSkeleton />
      </div>
    </div>
  );
}
