import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/admin-auth";
import { redirect, notFound } from "next/navigation";
import { connectDB, CreditTransaction, User, ToolConfig } from "@toolhub/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CopyButton } from "@/components/admin/CopyButton";
import mongoose from "mongoose";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Transaction Detail — Admin" };
export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  welcome_bonus:   "Welcome Bonus",
  referral_bonus:  "Referral Bonus",
  referral_reward: "Referral Reward",
  purchase:        "Purchase",
  credit_purchase: "Credit Purchase",
  use:             "Tool Use",
  refund:          "Refund",
  plan_upgrade:    "Plan Upgrade",
  rollover:        "Rollover",
  manual_admin:    "Manual Admin",
};

const TYPE_COLORS: Record<string, string> = {
  welcome_bonus:   "bg-blue-500/15 text-blue-400 border-blue-500/20",
  referral_bonus:  "bg-purple-500/15 text-purple-400 border-purple-500/20",
  referral_reward: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  purchase:        "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  credit_purchase: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  use:             "bg-red-500/15 text-red-400 border-red-500/20",
  refund:          "bg-orange-500/15 text-orange-400 border-orange-500/20",
  plan_upgrade:    "bg-teal-500/15 text-teal-400 border-teal-500/20",
  rollover:        "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  manual_admin:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

const PLAN_COLORS: Record<string, string> = {
  free:       "bg-zinc-500/15 text-zinc-400",
  lite:       "bg-blue-500/15 text-blue-400",
  pro:        "bg-purple-500/15 text-purple-400",
  business:   "bg-orange-500/15 text-orange-400",
  enterprise: "bg-yellow-500/15 text-yellow-400",
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground shrink-0 w-32">{label}</span>
      <span className="text-sm text-foreground text-right">{children}</span>
    </div>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TransactionDetailPage({ params }: Props) {
  const cookieStore = await cookies();
  const token = cookieStore.get("setulix_admin")?.value;
  const admin = token ? await verifyAdminToken(token) : null;
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) notFound();

  await connectDB();

  const txn = await CreditTransaction.findById(id).lean();
  if (!txn) notFound();

  const user = await User.findById(txn.userId)
    .select("email name plan credits createdAt referredBy")
    .lean();

  let tool: { toolSlug: string; creditCost: number; aiModel: string; aiProvider: string } | null = null;
  if (txn.type === "use" && txn.toolSlug) {
    const tc = await ToolConfig.findOne({ toolSlug: txn.toolSlug })
      .select("toolSlug creditCost aiModel aiProvider")
      .lean();
    if (tc) {
      tool = {
        toolSlug: tc.toolSlug,
        creditCost: tc.creditCost,
        aiModel: tc.aiModel,
        aiProvider: tc.aiProvider,
      };
    }
  }

  const txnId = (txn._id as mongoose.Types.ObjectId).toString();
  const dateStr = new Date(txn.createdAt).toLocaleString("en-IN", {
    weekday: "short", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });

  return (
    <div className="p-6 max-w-4xl">
      {/* Back */}
      <Link
        href="/admin/transactions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Transaction History
      </Link>

      <h1 className="text-xl font-bold text-foreground mb-6">Transaction Detail</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT — Transaction */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Transaction</h2>

          <DetailRow label="Transaction ID">
            <span className="font-mono text-xs flex items-center gap-1.5">
              {txnId}
              <CopyButton value={txnId} />
            </span>
          </DetailRow>

          <DetailRow label="Type">
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
              TYPE_COLORS[txn.type] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"
            )}>
              {TYPE_LABELS[txn.type] ?? txn.type}
            </span>
          </DetailRow>

          <DetailRow label="Amount">
            <span className={cn(
              "text-lg font-bold",
              txn.amount > 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {txn.amount > 0 ? `+${txn.amount}` : txn.amount} credits
            </span>
          </DetailRow>

          <DetailRow label="Balance After">
            <span className="font-semibold">{txn.balanceAfter.toLocaleString("en-IN")} credits</span>
          </DetailRow>

          <DetailRow label="Date & Time">
            <span className="text-xs">{dateStr}</span>
          </DetailRow>

          {txn.note && (
            <DetailRow label="Note">
              <span className="text-xs">{txn.note}</span>
            </DetailRow>
          )}

          {txn.meta && Object.keys(txn.meta).length > 0 && (
            <div className="py-3">
              <p className="text-xs text-muted-foreground mb-2">Meta</p>
              <pre className="text-[11px] bg-[#0a0a0a] border border-border rounded-lg p-3 overflow-auto text-muted-foreground whitespace-pre-wrap">
                {JSON.stringify(txn.meta, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* RIGHT — User */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">User</h2>

          {user ? (
            <>
              <DetailRow label="Email">
                <Link
                  href={`/admin/users?q=${encodeURIComponent(user.email)}`}
                  className="text-[#7c3aed] hover:underline text-xs"
                >
                  {user.email}
                </Link>
              </DetailRow>

              <DetailRow label="Name">
                <span>{user.name}</span>
              </DetailRow>

              <DetailRow label="Current Plan">
                <span className={cn(
                  "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                  PLAN_COLORS[user.plan] ?? "bg-zinc-500/15 text-zinc-400"
                )}>
                  {user.plan.toUpperCase()}
                </span>
              </DetailRow>

              <DetailRow label="Current Credits">
                <span className="font-semibold">{user.credits.toLocaleString("en-IN")}</span>
              </DetailRow>

              <DetailRow label="Member Since">
                <span className="text-xs">
                  {new Date(user.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </span>
              </DetailRow>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              User not found — ID: <span className="font-mono">{txn.userId.toString()}</span>
            </p>
          )}
        </div>
      </div>

      {/* Tool card — only for type=use */}
      {txn.type === "use" && (
        <div className="rounded-xl border border-border bg-card p-5 mt-4">
          <h2 className="text-sm font-semibold text-foreground mb-4">Tool</h2>

          {tool ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tool Slug</p>
                <p className="text-sm font-mono text-foreground">{tool.toolSlug}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Credit Cost</p>
                <p className="text-sm font-semibold text-foreground">{tool.creditCost} credits</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">AI Model</p>
                <p className="text-sm text-foreground">{tool.aiModel || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">AI Provider</p>
                <p className="text-sm text-foreground">{tool.aiProvider || "—"}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Tool config not found for slug: <span className="font-mono">{txn.toolSlug}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

