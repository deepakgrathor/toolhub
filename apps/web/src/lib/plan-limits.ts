import { getUserPlanLimits } from "@/lib/user-plan";

export async function hasWatermark(userId: string): Promise<boolean> {
  const limits = await getUserPlanLimits(userId);
  return limits.watermark;
}

export async function getPdfType(
  userId: string
): Promise<"none" | "branded" | "whitelabel"> {
  const limits = await getUserPlanLimits(userId);
  return limits.pdfDownload;
}

export async function getHistoryDays(userId: string): Promise<number> {
  const limits = await getUserPlanLimits(userId);
  return limits.historyDays;
}

export async function getBusinessProfileLimit(userId: string): Promise<number> {
  const limits = await getUserPlanLimits(userId);
  return limits.businessProfiles;
}

export async function getSavedPresetLimit(userId: string): Promise<number> {
  const limits = await getUserPlanLimits(userId);
  return limits.savedPresets;
}

export async function getCreditRolloverMonths(userId: string): Promise<number> {
  const limits = await getUserPlanLimits(userId);
  return limits.creditRolloverMonths;
}

export async function checkBusinessProfileLimit(
  userId: string,
  currentCount: number
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const limit = await getBusinessProfileLimit(userId);
  if (limit === -1) return { allowed: true, limit: -1, current: currentCount };
  return {
    allowed: currentCount < limit,
    limit,
    current: currentCount,
  };
}

export async function checkSavedPresetLimit(
  userId: string,
  currentCount: number
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const limit = await getSavedPresetLimit(userId);
  if (limit === -1) return { allowed: true, limit: -1, current: currentCount };
  if (limit === 0) return { allowed: false, limit: 0, current: currentCount };
  return {
    allowed: currentCount < limit,
    limit,
    current: currentCount,
  };
}
