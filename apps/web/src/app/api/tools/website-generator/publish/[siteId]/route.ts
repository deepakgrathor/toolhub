import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { ApiResponse } from "@/lib/api-response";
import { connectDB, PublishedSite } from "@toolhub/db";
import { deleteSiteHtml } from "@/lib/r2-sites";
import { getRedis } from "@toolhub/shared";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.response;
    const { userId } = authResult;

    const { siteId } = await params;
    if (!siteId) return ApiResponse.badRequest("Site ID is required");

    await connectDB();

    const site = await PublishedSite.findOne({ _id: siteId, userId }).lean();
    if (!site) return ApiResponse.notFound("Published site");

    try {
      await deleteSiteHtml(site.siteSlug);
    } catch (r2Err) {
      console.error("[unpublish] R2 delete failed (continuing):", r2Err);
    }

    await PublishedSite.findByIdAndUpdate(siteId, { isActive: false });

    try {
      const redis = getRedis();
      await redis.del(`slug-check:${site.siteSlug}`);
    } catch {
      // non-critical
    }

    return ApiResponse.ok({ success: true });
  } catch (err) {
    console.error("[DELETE /api/tools/website-generator/publish/[siteId]]", err);
    return ApiResponse.error("Server error");
  }
}
