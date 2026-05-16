import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB, CreditTransaction, ToolOutput, User } from "@toolhub/db";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ReferralCard } from "@/components/dashboard/ReferralCard";
import { GreetingTagline } from "@/components/dashboard/GreetingTagline";
import { CreditHealthWidget } from "@/components/dashboard/CreditHealthWidget";
import { QuickLaunchSection } from "@/components/dashboard/QuickLaunchSection";
import { StatsBarSkeleton } from "@/components/ui/skeletons";
import { getCachedDashStats, setCachedDashStats } from "@/lib/credit-cache";
import mongoose from "mongoose";

export const metadata: Metadata = {
  title: "Dashboard — SetuLix",
  description: "Your SetuLix dashboard.",
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const greeting = getGreeting();
  const planSlug = 'free';
  const kitSlug = '';

  return (
    <div className="min-h-full px-4 py-8 md:px-8 max-w-7xl mx-auto">
      {/* Greeting — renders instantly, no DB needed */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {firstName}!
        </h1>
        <GreetingTagline />
      </div>

      {/* Stats — streams in after DB query */}
      <div className="mb-6">
        <Suspense fallback={<StatsBarSkeleton />}>
          <StatsSection userId={session.user.id} />
        </Suspense>
      </div>

      {/* Credit health */}
      <div className="mb-8">
        <CreditHealthWidget planSlug={planSlug} />
      </div>

      {/* Recent activity — client component with its own loading state */}
      <div className="mb-8">
        <RecentActivity />
      </div>

      {/* Quick launch */}
      <div className="mb-8">
        <QuickLaunchSection kitSlug={kitSlug} />
      </div>

      {/* Referral section */}
      <div id="referral" className="scroll-mt-6">
        <ReferralCard />
      </div>
    </div>
  );
}
