import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/require-auth";
import { ApiResponse } from "@/lib/api-response";
import { getSiteConfigValue } from "@/lib/site-config-cache";
import { invalidateBalance } from "@/lib/credit-cache";
import { connectDB, CreditService, PublishedSite } from "@toolhub/db";
import { uploadSiteHtml } from "@/lib/r2-sites";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const updateSchema = z.object({
  publishedSiteId: z.string().min(1),
  htmlContent: z.string().min(100),
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

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return ApiResponse.badRequest(parsed.error.errors[0]?.message ?? "Validation failed");
    }

    const { publishedSiteId, htmlContent } = parsed.data;

    await connectDB();

    const site = await PublishedSite.findOne({
      _id: publishedSiteId,
      userId,
      isActive: true,
    }).lean();

    if (!site) return ApiResponse.notFound("Published site");

    const updateCredits = Number(
      await getSiteConfigValue("website_update_credits", 5)
    );

    const hasBalance = await CreditService.checkBalance(userId, updateCredits);
    if (!hasBalance) {
      return ApiResponse.ok({ error: "Insufficient credits" }, 402);
    }

    await uploadSiteHtml(site.siteSlug, htmlContent);

    try {
      await CreditService.deductCredits(userId, updateCredits, "website-generator");
    } catch (creditErr) {
      console.error("[update-site] R2 upload succeeded but credit deduction failed:", creditErr);
    }

    await invalidateBalance(userId);

    await PublishedSite.findByIdAndUpdate(publishedSiteId, {
      updatedAt: new Date(),
    });

    return ApiResponse.ok({ siteUrl: site.siteUrl });
  } catch (err) {
    console.error("[POST /api/tools/website-generator/update-site]", err);
    return ApiResponse.error("Server error");
  }
}
