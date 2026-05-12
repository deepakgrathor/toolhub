# Handoff Note
Updated: 2026-05-13 | Account: B | Session: B6 | Production Pricing + Abuse Protection

## Where We Are
Session B6 done. **TypeScript: 0 errors.** Committed to master.

---

## What Was Done (Session B6)

### Production Pricing System + Abuse Protection

**DB Models Updated:**
- `packages/db/src/models/Plan.ts`
  - `IPlanFeature.highlight`: `boolean` → `string` (empty = no tag, non-empty = tag label e.g. "Coming Soon")
  - Added `usageExamples: string[]` field
  - Added `PlanSlug` type export: `"free" | "lite" | "pro" | "business" | "enterprise"`
  - `slug` enum updated to match new 5-plan set
- `packages/db/src/models/User.ts`
  - `plan` enum extended: added `"lite"` and `"business"` alongside existing free/pro/enterprise

**Seed Scripts:**
- `apps/web/src/scripts/seed-plans.ts` — fully rewritten with B6 plans
  - Plans: FREE (₹0), LITE (₹399/mo, 200cr), PRO (₹999/mo, 700cr, isPopular), BUSINESS (₹2999/mo, 1500cr), ENTERPRISE (custom)
  - Yearly prices: LITE ₹319, PRO ₹799, BUSINESS ₹2399 (all ~20% off monthly)
  - Removes stale `starter` plan
  - Credit packs: Starter 50cr/₹149, Growth 150cr/₹349, Pro Pack 400cr/₹799 (isPopular), Power 1000cr/₹1799
  - Removes old 3-pack set
- `apps/web/src/scripts/seed-tools.ts` — NEW; upserts creditCost for all 27 tools
  - 0cr: client-side tools (qr, gst-calc, gst-invoice, expense-tracker, quotation, salary-slip, offer-letter, tds-sheet)
  - 1cr: hook-writer, caption-generator, title-generator, email-subject, whatsapp-bulk
  - 2cr: jd-generator
  - 3cr: blog-generator, resume-screener, appraisal-draft, policy-generator, ad-copy, linkedin-bio, legal-disclaimer
  - 4cr: yt-script
  - 8cr: seo-auditor, legal-notice
  - 10cr: thumbnail-ai, nda-generator
  - 25cr: website-generator

**Both seeds were run and confirmed successful.**

**Plan Access Control:**
- `apps/web/src/lib/plan-access.ts` — NEW
  - `PLAN_TOOL_ACCESS`: blocked tool lists per plan slug
  - Free: blocks all heavy AI tools (blog, yt-script, thumbnail-ai, jd, resume, appraisal, policy, legal, nda, disclaimer, ad-copy, linkedin, seo, website, whatsapp)
  - Lite: blocks website-generator, legal-notice, nda-generator, thumbnail-ai, seo-auditor
  - Pro/Business/Enterprise: nothing blocked
  - `isPlanBlocked(planSlug, toolSlug): boolean`
  - `getUpgradeMessage(planSlug, toolSlug): string` → "Website Generator requires Pro plan. Upgrade to unlock."
  - `getRequiredPlan(toolSlug): PlanSlug | null`

**Abuse Protection:**
- `apps/web/src/lib/abuse-protection.ts` — NEW
  - Daily caps via Redis key `abuse:daily:{userId}:{toolSlug}:{YYYY-MM-DD}`
    - website-generator: LITE→3/day, PRO+→10/day
    - thumbnail-ai: 5/day all plans
  - 30-second cooldown via `abuse:cooldown:{userId}:{toolSlug}` for heavy tools (website-generator, legal-notice, nda-generator, seo-auditor, thumbnail-ai)
  - Fails open on Redis unavailable (never blocks users due to infra issues)
  - `checkAbuseLimit({ userId, toolSlug, planSlug }): Promise<{ allowed, reason?, retryAfter? }>`

**Tool Guard (shared helper):**
- `apps/web/src/lib/tool-guard.ts` — NEW
  - `runToolGuard(userId, toolSlug)` — connectDB + user plan lookup + isPlanBlocked + checkAbuseLimit
  - Returns `NextResponse` error on fail, `null` on pass
  - `getUserPlanSlug(userId)` — used by both the guard and the API route
  - HTTP 403 on plan-blocked, 429 on abuse with `Retry-After` header

**All 20 AI Tool Routes Updated** (added guard after auth check):
  blog-generator, blog-generator/stream, caption-generator, hook-writer, title-generator,
  email-subject, whatsapp-bulk, yt-script, jd-generator, linkedin-bio, legal-notice,
  nda-generator, legal-disclaimer, ad-copy, resume-screener, appraisal-draft,
  policy-generator, website-generator, seo-auditor, thumbnail-ai

**New API Route:**
- `GET /api/user/plan` — returns `{ planSlug }` for logged-in user, defaults to "free" if unauthenticated

**UpgradePrompt Component:**
- `apps/web/src/components/ui/UpgradePrompt.tsx` — NEW
  - Lock icon, tool name, message, "Upgrade to {Plan}" CTA → /pricing, "View all plans" link
  - Full dark + light theme support

**Tool Page Plan Gate:**
- `apps/web/src/app/(site)/tools/[slug]/page.tsx` — updated
  - Server-side plan check: fetches session + user plan from DB
  - If logged-in user's plan blocks the tool → renders `<UpgradePrompt>` instead of tool component
  - Unauthenticated users see the tool normally (auth check fires on submit)

**Pricing Page Redesign:**
- `apps/web/src/components/pricing/PricingPage.tsx` — fully rewritten
  - Credit slider removed (plans now have fixed credits)
  - Annual toggle: shows "Save 20%" green badge + crossed monthly price on yearly
  - "Most Popular" badge on PRO card (purple gradient, elevated with scale)
  - `usageExamples` rendered as pill chips below features
  - Feature `highlight` string rendered as accent-colored tag (not bold text)
  - Active CTAs: Free→/register, Lite→/register?plan=lite, Pro→/register?plan=pro, Business→/register?plan=business, Enterprise→mailto
  - "Fair usage applies" footnote with Lock icon
  - Credit packs: 4 packs (Starter/Growth/Pro Pack/Power), "Best Value" badge on Pro Pack
  - Save 20% shown per card when yearly selected; annual total shown beneath price

**Admin Plans Table:**
- `apps/web/src/components/admin/PlansTable.tsx` — updated
  - Removed: pricePerCredit field, maxCredits slider, yearlyDiscountPercent field, dynamic price calculation
  - Kept: basePrice (monthly + yearly), baseCredits, isActive, isPopular, features management
  - Feature `highlight` is now a text input (tag label) instead of a checkbox
  - Table now shows credits/mo column
  - Admin page updated to map new PlanRow shape (removed removed fields)

**Public Plans API fix:**
- `apps/web/src/app/api/public/plans/route.ts` — yearly savings calculation fixed
  - Was: `monthly*12 - yearly` (wrong: yearly was monthly equivalent, not total)
  - Now: `(monthly - yearly) * 12` (correct: both are per-month values)

---

## What Was Done (Session B5-B)

### Notification Center + Admin Push System
[See previous HANDOFF for B5-B details]

---

## What Was Done (Session B5-A)
### Refer & Earn System (B5-A)
[See previous HANDOFF for B5-A details]

---

## What Was Done (Session B4)
### Dynamic Pricing + Subscription Plans System
[See previous HANDOFF for B4 details]

---

## What Was Done (Session B2)
### Smart Autofill System
[See previous HANDOFF for B2 details]

---

## Architecture Notes

### Plan Slugs (B6 final set)
free → lite → pro → business → enterprise

### Plan Access Flow
```
Tool page load (server component)
  → auth() → getUserPlanSlug(userId)
  → isPlanBlocked(planSlug, toolSlug)
  → YES: render <UpgradePrompt>
  → NO:  render <ToolComponent>

Tool API call (POST /api/tools/[tool])
  → auth check
  → runToolGuard(userId, toolSlug)
      → connectDB + User.findById (plan)
      → isPlanBlocked → 403 if blocked
      → checkAbuseLimit → 429 if over limit
  → existing credit check (InsufficientCreditsError)
  → AI call + credit deduction
```

### Redis Keys (B6 additions)
```
abuse:daily:{userId}:{toolSlug}:{YYYY-MM-DD}   TTL = seconds until midnight
abuse:cooldown:{userId}:{toolSlug}              TTL = 30s
```

### Pricing Data Flow (unchanged from B4)
```
Admin edits plan → PATCH /api/admin/plans/[slug]
                 → DB updated → Redis plans:public invalidated

/pricing page → GET /api/public/plans (plans + yearlySavings)
              → GET /api/public/credit-packs
              → GET /api/public/site-config/rollover
              → PricingPage client component (handles toggle)
```

### Credit Costs (B6 final)
| Tool | Credits |
|------|---------|
| Client-side tools | 0 |
| hook-writer, caption, title, email-subject, whatsapp-bulk | 1 |
| jd-generator | 2 |
| blog, resume, appraisal, policy, ad-copy, linkedin, disclaimer | 3 |
| yt-script | 4 |
| seo-auditor, legal-notice | 8 |
| thumbnail-ai, nda-generator | 10 |
| website-generator | 25 |

---

## Issues
None. TypeScript: 0 errors.
