// Use plain object types to avoid Mongoose FlattenMaps conflicts with .lean()
interface UserLike {
  name?: string | null;
  mobile?: string | null;
  profession?: string | null;
  address?: string | null;
  avatar?: string | null;
}

interface BusinessLike {
  businessName?: string | null;
  industry?: string | null;
  gstState?: string | null;
  teamSize?: string | null;
  logo?: string | null;
}

export function calculateProfileScore(
  user: UserLike,
  business: BusinessLike | null
): number {
  let score = 0;

  // Personal (50 pts)
  if (user?.name)       score += 10;
  if (user?.mobile)     score += 10;
  if (user?.profession) score += 10;
  if (user?.address)    score += 10;
  if (user?.avatar)     score += 10;

  // Business (50 pts)
  if (business?.businessName) score += 15;
  if (business?.industry)     score += 10;
  if (business?.gstState)     score += 10;
  if (business?.teamSize)     score += 10;
  if (business?.logo)         score +=  5;

  return Math.min(100, score);
}
