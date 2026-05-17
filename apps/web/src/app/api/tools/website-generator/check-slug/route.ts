import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { ApiResponse } from "@/lib/api-response";
import { connectDB, PublishedSite } from "@toolhub/db";
import { checkSlugAvailability } from "@/lib/r2-sites";
import { getRedis } from "@toolhub/shared";

export const dynamic = "force-dynamic";

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
const CONSECUTIVE_HYPHENS = /--/;
const SLUG_CACHE_TTL = 30;

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authenticated) return authResult.response;

    const slug = req.nextUrl.searchParams.get("slug")?.trim().toLowerCase();
    if (!slug) return ApiResponse.badRequest("Slug is required");

    if (slug.length < 3 || slug.length > 50) {
      return ApiResponse.badRequest("Slug must be 3-50 characters");
    }
    if (!SLUG_REGEX.test(slug)) {
      return ApiResponse.badRequest(
        "Slug must contain only lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen."
      );
    }
    if (CONSECUTIVE_HYPHENS.test(slug)) {
      return ApiResponse.badRequest("Slug cannot contain consecutive hyphens");
    }

    const cacheKey = `slug-check:${slug}`;
    try {
      const redis = getRedis();
      const cached = await redis.get<boolean>(cacheKey);
      if (cached !== null) {
        return ApiResponse.ok({ available: cached, slug });
      }
    } catch {
      // Redis miss — continue
    }

    await connectDB();

    const [dbTaken, r2Available] = await Promise.all([
      PublishedSite.exists({ siteSlug: slug, isActive: true }),
      checkSlugAvailability(slug),
    ]);

    const available = !dbTaken && r2Available;

    try {
      const redis = getRedis();
      await redis.set(cacheKey, available, { ex: SLUG_CACHE_TTL });
    } catch {
      // Cache write failed — not critical
    }

    return ApiResponse.ok({ available, slug });
  } catch (err) {
    console.error("[GET /api/tools/website-generator/check-slug]", err);
    return ApiResponse.error("Server error");
  }
}
