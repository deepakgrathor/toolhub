# Handoff Note
Updated: 2026-05-09 | Account: A | Session: #13 | Bug Fixes + Polish

## Where We Are
Session A13 done. All HIGH + MEDIUM bugs from analysis report fixed. Polish items added. TypeScript: 0 errors.

### What Was Built (Session A13 — Bug Fixes + Polish)

**FIX 1 — Admin Settings Key Mismatch [HIGH]**
- `packages/db/src/seed.ts`: `theme_default` → `default_theme`
- `apps/web/src/app/layout.tsx`: Now async, fetches `default_theme` from SiteConfig on every render, passes to ThemeProvider
- Admin can now change default theme and it applies to new visitors

**FIX 2 — Blog Generator Model From DB [HIGH]**
- `apps/web/src/tools/blog-generator/engine.ts`: `callAI()` now accepts `model` + `provider` params
- Routes through `LITELLM_GATEWAY_URL` first (if configured), then falls back to direct API calls per provider
- Admin switching model in `/admin/tools` now actually works

**FIX 3 — Client Credit Cost Hardcoded [MEDIUM]**
- `apps/web/src/app/(site)/tools/[slug]/page.tsx`: Passes `creditCost={tool.config.creditCost}` to tool component
- `BlogGeneratorTool.tsx`: Accepts `creditCost` prop, uses it everywhere; fallback to config.creditCost

**FIX 4 — Shared Types Out of Sync [MEDIUM]**
- `packages/shared/src/types/index.ts`: `TransactionType` now matches model (`use`, `manual_admin`), `CreditPack.isActive`, `ToolConfig.toolSlug`
- Added: `SiteConfigKey`, `AdminRole`, `JobStatus`, `JobType`

**FIX 5 — KITS Constant Stale [LOW]**
- `packages/shared/src/constants/index.ts`: KITS now has correct values (creator/sme/hr/ca-legal/marketing) + `KitKey` type

**FIX 6 — Referral Code Edge Case [LOW]**
- `packages/shared/src/referral.ts`: Now uses `crypto.randomBytes(6)` — always exactly 6 chars, cryptographically random

**POLISH 1 — Error Pages**
- `apps/web/src/app/not-found.tsx`: SearchX icon, "Page Not Found", Go Home button
- `apps/web/src/app/error.tsx`: AlertTriangle icon, Try Again + Go Home buttons
- `apps/web/src/app/loading.tsx`: Loader2 spinner, "Loading..." text

**POLISH 2 — Toast Notifications (sonner)**
- Installed `sonner`, added `<Toaster>` to root layout
- Toasts added: AuthModal (login/signup success+error), BuyCreditsButton (success/fail), admin components (tool/credits/pack/settings saved), copy actions

**POLISH 3 — Maintenance Mode**
- `apps/web/src/app/maintenance/page.tsx`: Standalone maintenance page
- `apps/web/src/middleware.ts`: Checks `site:maintenance_mode` key in Upstash Redis (60s module-level cache), redirects non-admins
- `apps/web/src/app/api/admin/settings/route.ts`: Now also writes `site:maintenance_mode` to Redis on change

**POLISH 4 — Mobile Responsiveness**
- Sidebar: closes on route change (`useEffect` on `pathname`)
- Tool page: `p-4 md:p-6` on both panels
- Pricing page: pack cards have `min-w-0`
- Dashboard: `flex-col` on mobile, grid on desktop
- TransactionHistory: table has `min-w-[600px]`
- Admin ToolsTable: wrapped in `overflow-x-auto` + `min-w-[800px]`

**POLISH 5 — Rate Limiting**
- `apps/web/src/lib/rate-limit.ts`: In-memory rate limiter utility
- Applied: signup (5/hr by IP), purchase (10/hr by userId), jobs create (50/hr by userId)

**POLISH 6 — make-admin Script**
- `packages/db/src/make-admin.ts`: CLI script to grant admin role
- `packages/db/package.json`: Added `"make-admin"` script

**PART 3 — Deployment Checklist**
- `docs/DEPLOY_CHECKLIST.md`: Full checklist for Vercel + Railway deploy

**TypeScript Fixes (pre-existing)**
- `pricing/page.tsx` + `credit-service.ts`: Fixed `FlattenMaps` lean() type errors with double-cast

### What Was Built (Session A12 — Analysis + Bug Fix)

**Critical Bug Fixed (`apps/web/src/tools/blog-generator/engine.ts`)**
- Engine now imports `ToolConfig` from `@toolhub/db`
- Reads `creditCost` from DB via `ToolConfig.findOne({ toolSlug: context.toolSlug })`
- Falls back to `3` only if config not found in DB
- Uses `context.toolSlug` for all DB writes (was hardcoded `"blog-generator"`)
- Pattern now reusable for future tool engines

**Analysis Report (`docs/ANALYSIS_REPORT.md`)**
- Complete file-by-file audit of all 100+ files
- Compliance checklist against CLAUDE.md architecture rules
- Security audit — all clear
- 27 tools seeded (plan said 30, HANDOFF.md credit table is the accurate source)
- Full bug report: 1 CRITICAL (fixed), 3 HIGH, 4 MEDIUM, 3 LOW

---

## Where We Were (Session A11) Referral system is fully wired — referral codes generated on every signup, cookie-based referral tracking, atomic credit bonuses, referral info API, and a ReferralCard on the dashboard. Output history page added at `/dashboard/history` with pagination and an output viewer dialog.

### What Was Built (Session A11 — Referral System + Output History)

**User Model Update (packages/db/src/models/User.ts)**
- Added: `referralCode` (String, unique, sparse), `referredBy` (ObjectId ref User, default null), `referralCount` (Number, default 0)

**Referral Code Generator (packages/shared/src/referral.ts)**
- `generateReferralCode()` — 6-char alphanumeric uppercase; pure function, no DB deps
- Exported via `packages/shared/src/index.ts`

**Atomic Referral Service (packages/db/src/referral-service.ts)**
- `applyReferral(newUserId, referralCode)` — finds referrer by code; single MongoDB session/transaction:
  - New user: +15 credits, sets `referredBy`
  - Referrer: +10 credits, `referralCount += 1`
  - Two `CreditTransaction` records (type: `referral_bonus`) created atomically
  - Silent fail — never throws; logs error only
- Exported via `packages/db/src/index.ts`

**Note on package placement**: `generateReferralCode` is in `@toolhub/shared` (pure), `applyReferral` is in `@toolhub/db` (needs mongoose). This avoids circular deps since `@toolhub/db` depends on `@toolhub/shared` but not vice versa.

**Referral Cookie Middleware (apps/web/src/middleware.ts)**
- Expanded matcher to all pages (excluding `api`, `_next/static`, `_next/image`, `favicon.ico`)
- Cookie set FIRST (step 1), BEFORE auth redirect checks (step 2)
- `?ref=XXXXXX` → `httpOnly` cookie `ref`, `maxAge=604800` (7 days), `sameSite=lax`
- Only sets if code matches `^[A-Z0-9]{6}$`

**Email Signup Update (apps/web/src/app/api/auth/signup/route.ts)**
- `generateReferralCode()` called on every new user — stored in `referralCode` field
- After user created: reads `req.cookies.get("ref")?.value` → calls `applyReferral()` if present

**Google OAuth Update (apps/web/src/auth.ts)**
- First Google login: generates `referralCode`, saves to user
- Reads `cookies()` from `next/headers` → calls `applyReferral()` if ref cookie present
- Wrapped in try/catch — silent fail if `cookies()` unavailable in context
- `FREE_CREDITS_ON_SIGNUP` constant used instead of hardcoded `10`

**Referral Info API (apps/web/src/app/api/referral/info/route.ts)**
- `GET /api/referral/info` — auth required
- Returns: `{ referralCode, referralLink, referralCount, creditsEarned }`
- `referralLink = NEXTAUTH_URL + "?ref=" + code`
- `creditsEarned` via `CreditTransaction.aggregate` (type: referral_bonus, amount > 0)

**ReferralCard Component (apps/web/src/components/dashboard/ReferralCard.tsx)**
- Client component; fetches `/api/referral/info` on mount
- Gift icon header, referral link input (readonly), Copy button (shows "Copied!" 2s with Check icon)
- Stats: "X friends joined • Y credits earned"
- WhatsApp share button (green, MessageCircle icon)
- Loading skeleton while fetching

**Output History API (apps/web/src/app/api/user/history/route.ts)**
- `GET /api/user/history?page=1&limit=10` — auth required
- `ToolOutput.find({ userId }).sort({ createdAt: -1 }).skip().limit()` + `countDocuments`
- Returns: `{ outputs, total, page, totalPages }`

**HistoryTable Component (apps/web/src/components/dashboard/HistoryTable.tsx)**
- Client component; fetches paginated history
- Columns: Date, Tool (slug → display name map), Credits Used (purple badge), Actions
- Eye icon → opens inline dialog showing raw `outputText` (pre-wrap, scrollable)
- ExternalLink icon → links to `/tools/[slug]`
- Previous/Next pagination with disabled states
- Empty state: History icon + "No history yet" message
- 5-row skeleton while loading

**History Page (apps/web/src/app/(site)/dashboard/history/page.tsx)**
- Server component shell; renders `<HistoryTable />`

**Dashboard Page Update (apps/web/src/app/(site)/dashboard/page.tsx)**
- `<ReferralCard />` added beside `<CreditOverview />` in a 3-col grid (CreditOverview: 1 col, ReferralCard: 2 cols)
- "View Full History →" link with History icon below TransactionHistory → `/dashboard/history`

**Sidebar Update (apps/web/src/components/layout/sidebar.tsx)**
- Added "Dashboard" (`LayoutDashboard`) and "History" (`History`) nav links
- Visible only when logged in (`session?.user`)
- Collapses to icon-only when sidebar is collapsed

### What Was Built (Session A10 — LiteLLM + Bull MQ Worker)

**LiteLLM Config**
- `apps/worker/litellm-config.yaml` — 6 models (gpt-4o-mini, gpt-4o, claude-haiku-3-5, claude-sonnet-4-5, gemini-flash-2.0, dall-e-3); router: 3 retries, fallbacks (gpt-4o-mini→gemini-flash-2.0, claude-haiku→gpt-4o-mini); master_key from env

**Bull MQ Worker (apps/worker/src/)**
- `queue.ts` — `aiQueue` (Bull MQ Queue) + `redisConnection` (ioredis) using `REDIS_URL`; `maxRetriesPerRequest: null` required by Bull MQ
- `worker.ts` — Worker with concurrency=5; on complete → `redis.set("job:<id>:result", JSON.stringify(result), { ex: 3600 })`; on fail → `redis.set("job:<id>:error", msg, { ex: 3600 })` via Upstash REST client
- `jobs/text-generation.ts` — fetch `${LITELLM_GATEWAY_URL}/chat/completions`; returns `{ content, tokensUsed }`
- `jobs/image-generation.ts` — fetch `${LITELLM_GATEWAY_URL}/images/generations` → download image → upload to Cloudflare R2 via `@aws-sdk/client-s3`; returns permanent `{ imageUrl }`
- `index.ts` — imports worker + queue; graceful SIGTERM/SIGINT shutdown (worker.close + queue.close)

**Job API Routes (apps/web/src/app/api/jobs/)**
- `create/route.ts` — POST; auth required; Zod validates `{ jobType, payload }`; adds job with `userId` merged into payload; returns `{ jobId }`
- `[jobId]/status/route.ts` — GET; auth required; checks Upstash Redis for `job:<id>:result` / `job:<id>:error` first (fast path); falls back to Bull MQ `queue.getJob()` for live state

**Frontend Hook**
- `apps/web/src/hooks/useJobStatus.ts` — polls `/api/jobs/[jobId]/status` every 2s; stops on `done`/`failed`/`null jobId`

### What Was Built (Session A9 — Blog Generator)

**ToolOutput DB Model**
- `packages/db/src/models/ToolOutput.ts` — userId, toolSlug, inputSnapshot, outputText, creditsUsed, timestamps

**Blog Generator**
- `apps/web/src/tools/blog-generator/` — config, schema, engine, page, api
- `apps/web/src/tools/blog-generator/BlogGeneratorTool.tsx` — Client component, 2-col layout
- `apps/web/src/app/(site)/tools/[slug]/page.tsx` — dynamic tool shell

## Next Task (Session A14)
1. Build zero-credit tools: QR Generator (client-side), GST Calculator (client-side), Hook Writer, Caption Generator
2. Build AI tools via Bull MQ pattern: YT Script (4cr), JD Generator (3cr), LinkedIn Bio (3cr)
3. Upgrade tool-registry cache to Upstash Redis (critical for production serverless)

## How to Seed
```bash
cd packages/db && MONGODB_URI=... npm run seed
```

## Credit Cost Reference
| Credits | Tools |
|---------|-------|
| 0 | hook-writer, caption-generator, gst-invoice, expense-tracker, quotation-generator, qr-generator, salary-slip, offer-letter, gst-calculator, tds-sheet |
| 1 | title-generator, email-subject, whatsapp-bulk |
| 3 | blog-generator, resume-screener, jd-generator, appraisal-draft, policy-generator, linkedin-bio, ad-copy, legal-disclaimer |
| 4 | yt-script |
| 7 | thumbnail-ai |
| 8 | seo-auditor |
| 10 | website-generator |
| 12 | legal-notice, nda-generator |

## Architecture: Two Redis Connection Types
```
REDIS_URL (rediss://...)        → Bull MQ / ioredis (TCP protocol)
UPSTASH_REDIS_URL + TOKEN       → @upstash/redis (HTTP REST) — job results, cache
```

## Env Vars (apps/web/.env)
All set except:
- `REDIS_URL` — needs Upstash ioredis TCP URL
- `LITELLM_GATEWAY_URL` / `LITELLM_MASTER_KEY` — needs Railway deployment
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_AI_API_KEY` — for LiteLLM
- `R2_SECRET_ACCESS_KEY` — fill from Cloudflare dashboard

## Issues
None.
