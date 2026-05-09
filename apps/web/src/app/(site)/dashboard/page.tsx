import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB, CreditTransaction, ToolOutput, User } from "@toolhub/db";
import { getAllTools } from "@/lib/tool-registry";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { KitSection } from "@/components/dashboard/KitSection";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ReferralCard } from "@/components/dashboard/ReferralCard";
import { GreetingTagline } from "@/components/dashboard/GreetingTagline";
import { StatsBarSkeleton, KitSectionSkeleton } from "@/components/ui/skeletons";
import { getCachedDashStats, setCachedDashStats } from "@/lib/credit-cache";
import mongoose from "mongoose";

export const metadata: Metadata = {
  title: "Dashboard — Toolspire",
  description: "Your Toolspire dashboard.",
};

export const dynamic = "force-dynamic";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Good night";
}

function formatMemberSince(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

// ── Async server components for Suspense streaming ───────────────────────────

async function StatsSection({ userId }: { userId: string }) {
  // Try Redis cache (2-min TTL) before hitting MongoDB
  const cached = await getCachedDashStats(userId);
  if (cached) {
    return (
      <StatsBar
        toolsUsed={cached.toolsUsed}
        creditsUsed={cached.creditsUsed}
        memberSince={cached.memberSince}
      />
    );
  }

  let toolsUsed = 0;
  let creditsUsed = 0;
  let memberSince = "—";

  try {
    await connectDB();
    const uid = new mongoose.Types.ObjectId(userId);
    const [historyCount, debitAgg, userDoc] = await Promise.all([
      ToolOutput.countDocuments({ userId: uid }),
      CreditTransaction.aggregate([
        { $match: { userId: uid, amount: { $lt: 0 } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.findById(uid).select("createdAt").lean(),
    ]);
    toolsUsed = historyCount;
    creditsUsed = Math.abs(debitAgg[0]?.total ?? 0);
    if (userDoc?.createdAt) memberSince = formatMemberSince(userDoc.createdAt);

    // Cache for 2 minutes
    await setCachedDashStats(userId, { toolsUsed, creditsUsed, memberSince });
  } catch {
    // DB unavailable — show zeros
  }

  return (
    <StatsBar
      toolsUsed={toolsUsed}
      creditsUsed={creditsUsed}
      memberSince={memberSince}
    />
  );
}

async function ToolsSection() {
  let allTools: Awaited<ReturnType<typeof getAllTools>> = [];
  try {
    allTools = await getAllTools();
  } catch {
    // DB unavailable
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-4">All Tools</h2>
      <KitSection tools={allTools} />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const greeting = getGreeting();

  return (
    <div className="min-h-full px-4 py-8 md:px-8 max-w-6xl mx-auto">
      {/* Greeting — renders instantly, no DB needed */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {firstName}!
        </h1>
        <GreetingTagline />
      </div>

      {/* Stats — streams in after DB query */}
      <div className="mb-10">
        <Suspense fallback={<StatsBarSkeleton />}>
          <StatsSection userId={session.user.id} />
        </Suspense>
      </div>

      {/* Recent activity — client component with its own loading state */}
      <div className="mb-10">
        <RecentActivity />
      </div>

      {/* Tools — streams in after DB + Redis query */}
      <div className="mb-10">
        <Suspense
          fallback={
            <div>
              <div className="h-5 w-24 mb-4 animate-pulse rounded-lg bg-muted" />
              <KitSectionSkeleton />
            </div>
          }
        >
          <ToolsSection />
        </Suspense>
      </div>

      {/* Referral section */}
      <div id="referral" className="scroll-mt-6">
        <ReferralCard />
      </div>
    </div>
  );
}
