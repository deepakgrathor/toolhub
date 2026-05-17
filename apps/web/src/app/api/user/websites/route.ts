import { requireAuth } from "@/lib/require-auth";
import { ApiResponse } from "@/lib/api-response";
import { connectDB, PublishedSite } from "@toolhub/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.response;
    const { userId } = authResult;

    await connectDB();

    const websites = await PublishedSite.find({ userId, isActive: true })
      .select(
        "siteSlug siteUrl businessName pageTitle pages creditsUsed publishedAt updatedAt"
      )
      .sort({ publishedAt: -1 })
      .lean();

    return ApiResponse.ok({ websites });
  } catch (err) {
    console.error("[GET /api/user/websites]", err);
    return ApiResponse.error("Server error");
  }
}
