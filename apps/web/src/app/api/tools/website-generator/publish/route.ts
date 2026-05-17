import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/require-auth";
import { ApiResponse } from "@/lib/api-response";
import { getSiteConfigValue } from "@/lib/site-config-cache";
import { invalidateBalance } from "@/lib/credit-cache";
import { connectDB, CreditService, PublishedSite } from "@toolhub/db";
import { uploadSiteHtml, checkSlugAvailability } from "@/lib/r2-sites";
import { getRedis } from "@toolhub/shared";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

const publishSchema = z.object({
  slug: z.string().min(3).max(50).regex(SLUG_REGEX, "Invalid slug format"),
  htmlContent: z.string().min(100),
  businessName: z.string().min(1).max(200),
  pages: z.number().int().min(1).max(10).default(1),
  toolOutputId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.response;
    const { userId } = authResult;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return ApiResponse.badRequest("Invalid JSON body");
    }

    const parsed = publishSchema.safeParse(body);
    if (!parsed.success) {
      return ApiResponse.badRequest(parsed.error.errors[0]?.message ?? "Validation failed");
    }

    const { slug, htmlContent, businessName, pages, toolOutputId } = parsed.data;

    await connectDB();

    const [dbTaken, r2Available] = await Promise.all([
      PublishedSite.exists({ siteSlug: slug, isActive: true }),
      checkSlugAvailability(slug),
    ]);

    if (dbTaken || !r2Available) {
      return ApiResponse.ok({ error: "Slug already taken" }, 409);
    }

    const publishCredits = Number(
      await getSiteConfigValue("website_publish_credits", 10)
    );

    const hasBalance = await CreditService.checkBalance(userId, publishCredits);
    if (!hasBalance) {
      return ApiResponse.ok({ error: "Insufficient credits" }, 402);
    }

    const siteUrl = await uploadSiteHtml(slug, htmlContent);

    try {
      await CreditService.deductCredits(userId, publishCredits, "website-generator");
    } catch (creditErr) {
      console.error("[publish] R2 upload succeeded but credit deduction failed:", creditErr);
    }

    await invalidateBalance(userId);

    const pageTitle =
      htmlContent.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim() || businessName;

    const site = await PublishedSite.create({
      userId,
      siteSlug: slug,
      siteUrl,
      r2Key: `sites/${slug}/index.html`,
      businessName,
      pageTitle,
      pages,
      creditsUsed: publishCredits,
      publishCreditsUsed: publishCredits,
      isActive: true,
      ...(toolOutputId && { toolOutputId }),
    });

    try {
      const redis = getRedis();
      await redis.del(`slug-check:${slug}`);
    } catch {
      // non-critical
    }

    return ApiResponse.ok({
      siteUrl,
      siteSlug: slug,
      publishedSiteId: site._id,
    });
  } catch (err) {
    console.error("[POST /api/tools/website-generator/publish]", err);
    return ApiResponse.error("Server error");
  }
}
