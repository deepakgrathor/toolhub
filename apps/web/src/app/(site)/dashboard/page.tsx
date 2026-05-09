import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB, CreditTransaction, ToolOutput, User } from "@toolhub/db";
import { getAllTools } from "@/lib/tool-registry";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { KitSection } from "@/components/dashboard/KitSection";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { ReferralCard } from "@/components/dashboard/ReferralCard";
import mongoose from "mongoose";

export const metadata: Metadata = {
  title: "Dashboard — Toolspire",
  description: "Your Toolspire dashboard.",
};

export const dynamic = "force-dynamic";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6  && hour < 12) return "Good morning";
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

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const greeting = getGreeting();

  // Fetch stats + all tools in parallel
  let toolsUsed = 0;
  let creditsUsed = 0;
  let memberSince = "";

  try {
    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id as string);

    const [historyCount, debitAgg, userDoc] = await Promise.all([
      ToolOutput.countDocuments({ userId }),
      CreditTransaction.aggregate([
        { $match: { userId, amount: { $lt: 0 } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.findById(userId).select("createdAt").lean(),
    ]);

    toolsUsed = historyCount;
    creditsUsed = Math.abs(debitAgg[0]?.total ?? 0);
    if (userDoc?.createdAt) memberSince = formatMemberSince(userDoc.createdAt);
  } catch {
    // DB unavailable
  }

  // Load all tools for kit sections
  let allTools: Awaited<ReturnType<typeof getAllTools>> = [];
  try {
    allTools = await getAllTools();
  } catch {
    // DB unavailable
  }

  return (
    <div className="min-h-full px-4 py-8 md:px-8 max-w-6xl mx-auto">
      {/* Greeting header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {firstName}!
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          What would you like to create today?
        </p>
      </div>

      {/* Stats bar */}
      <div className="mb-10">
        <StatsBar
          toolsUsed={toolsUsed}
          creditsUsed={creditsUsed}
          memberSince={memberSince || "—"}
        />
      </div>

      {/* Recent activity */}
      <div className="mb-10">
        <RecentActivity />
      </div>

      {/* All tools — kit wise */}
      <div className="mb-10">
        <h2 className="text-base font-semibold text-foreground mb-4">All Tools</h2>
        <KitSection tools={allTools} />
      </div>

      {/* Referral section */}
      <div id="referral" className="scroll-mt-6">
        <ReferralCard />
      </div>
    </div>
  );
}
