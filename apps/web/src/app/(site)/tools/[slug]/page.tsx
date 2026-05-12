import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronRight, Wrench, Sparkles, WifiOff } from "lucide-react";
import { auth } from "@/auth";
import { getToolBySlug } from "@/lib/tool-registry";
import { LoginBanner } from "@/components/tools/LoginBanner";
import { getToolIcon } from "@/lib/tool-icons";
import { ToolPageSkeleton } from "@/components/ui/skeletons";
import { ToolErrorBoundary } from "@/components/tools/ToolErrorBoundary";
import { UpgradePrompt } from "@/components/ui/UpgradePrompt";
import { getUserPlanSlug } from "@/lib/tool-guard";
import { isPlanBlocked, getUpgradeMessage, getRequiredPlan } from "@/lib/plan-access";

// ── Dynamic tool component map ────────────────────────────────────────────────
// Add new tools here as they are built. Each entry is code-split automatically.

const toolComponents: Record<string, React.ComponentType<{ creditCost?: number }>> = {
  "blog-generator": dynamic(
    () => import("@/tools/blog-generator/BlogGeneratorTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "qr-generator": dynamic(
    () => import("@/tools/qr-generator/QrGeneratorTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "gst-calculator": dynamic(
    () => import("@/tools/gst-calculator/GstCalculatorTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "hook-writer": dynamic(
    () => import("@/tools/hook-writer/HookWriterTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "caption-generator": dynamic(
    () => import("@/tools/caption-generator/CaptionGeneratorTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "yt-script": dynamic(
    () => import("@/tools/yt-script/YtScriptTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "jd-generator": dynamic(
    () => import("@/tools/jd-generator/JdGeneratorTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "linkedin-bio": dynamic(
    () => import("@/tools/linkedin-bio/LinkedinBioTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  // A15 tools
  "title-generator": dynamic(
    () => import("@/tools/title-generator/TitleGeneratorTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "email-subject": dynamic(
    () => import("@/tools/email-subject/EmailSubjectTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "whatsapp-bulk": dynamic(
    () => import("@/tools/whatsapp-bulk/WhatsappBulkTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "legal-notice": dynamic(
    () => import("@/tools/legal-notice/LegalNoticeTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "nda-generator": dynamic(
    () => import("@/tools/nda-generator/NdaGeneratorTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "legal-disclaimer": dynamic(
    () => import("@/tools/legal-disclaimer/LegalDisclaimerTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "ad-copy": dynamic(
    () => import("@/tools/ad-copy/AdCopyTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "resume-screener": dynamic(
    () => import("@/tools/resume-screener/ResumeScreenerTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  // A16 SME free tools
  "gst-invoice": dynamic(
    () => import("@/tools/gst-invoice/GstInvoiceTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "expense-tracker": dynamic(
    () => import("@/tools/expense-tracker/ExpenseTrackerTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "quotation-generator": dynamic(
    () => import("@/tools/quotation-generator/QuotationGeneratorTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "salary-slip": dynamic(
    () => import("@/tools/salary-slip/SalarySlipTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "offer-letter": dynamic(
    () => import("@/tools/offer-letter/OfferLetterTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "tds-sheet": dynamic(
    () => import("@/tools/tds-sheet/TdsSheetTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  // A17 AI tools
  "appraisal-draft": dynamic(
    () => import("@/tools/appraisal-draft/AppraisalDraftTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "policy-generator": dynamic(
    () => import("@/tools/policy-generator/PolicyGeneratorTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "website-generator": dynamic(
    () => import("@/tools/website-generator/WebsiteGeneratorTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "seo-auditor": dynamic(
    () => import("@/tools/seo-auditor/SeoAuditorTool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
  "thumbnail-ai": dynamic(
    () => import("@/tools/thumbnail-ai/ThumbnailAITool"),
    { loading: () => <ToolPageSkeleton /> }
  ),
};

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = await getToolBySlug(params.slug);
  if (!tool) return { title: "Tool Not Found — Toolspire" };
  return {
    title: `${tool.name} — Toolspire`,
    description: tool.description,
  };
}

function ToolUnavailableCard({ name }: { name: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
          <WifiOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">{name} is temporarily unavailable</h2>
        <p className="text-sm text-muted-foreground mb-6">
          This tool has been paused by the admin. Check back soon.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default async function ToolPage({ params }: Props) {
  const tool = await getToolBySlug(params.slug);
  if (!tool) notFound();

  // isVisible=false → hidden by admin, redirect to dashboard
  if (tool.config.isVisible === false) redirect("/dashboard");

  // Plan access check (server-side, only for logged-in users)
  const session = await auth();
  let planBlocked = false;
  let upgradeMessage = "";
  let requiredPlan = "";
  if (session?.user?.id) {
    const planSlug = await getUserPlanSlug(session.user.id);
    if (isPlanBlocked(planSlug, params.slug)) {
      planBlocked = true;
      upgradeMessage = getUpgradeMessage(planSlug, params.slug);
      requiredPlan = getRequiredPlan(params.slug) ?? "lite";
    }
  }

  const Icon = getToolIcon(tool.slug);
  const ToolComponent = toolComponents[params.slug];

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-6 py-3 border-b border-border text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground transition-colors">
          Tools
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{tool.name}</span>
      </div>

      {/* Tool disabled — show unavailable card */}
      {!tool.config.isActive ? (
        <ToolUnavailableCard name={tool.name} />
      ) : planBlocked ? (
        <UpgradePrompt
          toolName={tool.name}
          requiredPlan={requiredPlan}
          message={upgradeMessage}
        />
      ) : ToolComponent ? (
        <ToolErrorBoundary toolName={tool.name}>
          <ToolComponent creditCost={tool.config.creditCost} />
        </ToolErrorBoundary>
      ) : (
        <div className="flex flex-1 overflow-auto flex-col lg:flex-row">
          {/* Left panel — 45% */}
          <div className="lg:w-[45%] lg:border-r border-border p-4 md:p-6 space-y-5">
            {/* Tool header */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 shrink-0">
                <Icon className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">
                    {tool.name}
                  </h1>
                  {tool.isFree ? (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                      FREE
                    </span>
                  ) : (
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                      {tool.config.creditCost} credits
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </div>

            {/* Login banner */}
            <LoginBanner />

            {/* Tool form placeholder */}
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <Wrench className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Tool UI coming soon
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This tool is under active development
              </p>
            </div>
          </div>

          {/* Right panel — 55% */}
          <div className="lg:w-[55%] p-4 md:p-6">
            <div className="rounded-xl border border-dashed border-border bg-surface/50 h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8">
              <Sparkles className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Output will appear here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Run the tool to see your results
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
