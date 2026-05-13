# Handoff Note
Updated: 2026-05-13 | Account: B | Session: B7-B | Features (Tasks 11–23)

## Where We Are
Session B7-B done. **TypeScript: 0 errors.** Committed to main.

---

## What Was Done (Session B7-B)

### TASK 11 — Explore Page Scroll Overlap
- Already correct: `sticky top-14 z-20` in `explore/page.tsx` matches navbar `h-14`
- No changes needed

### TASK 12 — My Tools Pre-populated on Fresh Signup
- `packages/db/src/models/User.ts`: changed `selectedTools: [{ type: String }]` → `selectedTools: { type: [String], default: [] }`
- `apps/web/src/app/api/onboarding/complete/route.ts`: removed `selectedTools: recommendedTools` from `User.findByIdAndUpdate` call; removed unused `getRecommendedTools` import and `challenge` field from body type
- **Result**: Fresh signup → MY TOOLS section is empty; kit tools derived from professions at runtime

### TASK 13 — Remove Plan-based Tool Restrictions
- `apps/web/src/lib/plan-access.ts`: `isPlanBlocked()` always returns `false`
- `apps/web/src/lib/tool-guard.ts`: removed plan check entirely, kept only abuse protection
- `apps/web/src/app/(site)/tools/[slug]/page.tsx`: removed UpgradePrompt, plan check logic, and auth import
- `apps/web/src/components/credits/PaywallModal.tsx`: updated to show "Buy Credits" (→ /checkout?type=pack) AND "Upgrade Plan" (→ /pricing) buttons side by side

### TASK 14 — Watermark System for FREE Outputs
- `apps/web/src/lib/user-plan.ts` — NEW: `getUserPlan(userId)` with Redis cache (TTL 5min)
- `apps/web/src/lib/watermark.ts` — NEW: `applyWatermark(output, planSlug, toolSlug)` — text watermark for text tools, HTML watermark for website-generator, no watermark for thumbnail-ai
- `packages/shared/src/tool-types.ts`: added `planSlug?: string` to `ToolEngineContext`
- All 17 JSON tool engines: added `applyWatermark` import + wrapped `outputText: JSON.stringify(parsed)` with watermark
- `website-generator/engine.ts`: watermark applied to `finalHtml` before saving/returning
- All 19 tool API routes: added `getUserPlan` import + pass `planSlug` in execute context

### TASK 15 — Output History with Plan-based Limits
- `apps/web/src/app/api/user/history/route.ts`: added `getUserPlan` call; free=0 days (returns upgradeRequired:true), lite=30, pro=90, business/enterprise=365 days cutoff filter
- `apps/web/src/components/dashboard/HistoryTable.tsx`: shows upgrade prompt card (Clock icon + "Upgrade to LITE" CTA) for FREE users; shows "Showing last {days} days" badge for paid users

### TASK 16-19, 22-23 — Verified Previously Completed
- All files confirmed present and functional (credits ledger, sidebar widget, account delete, credit alerts, email system, checkout page)

### TASK 20 — Admin Dynamic Bonus Settings
- `apps/web/src/components/admin/SettingsForm.tsx`: added `SiteSettings` fields + "Bonus & Rewards" section with 3 number inputs (welcome_bonus_credits, referral_joining_bonus, referral_reward_credits)
- `apps/web/src/app/admin/settings/page.tsx`: added defaults + fetch for bonus fields
- `apps/web/src/app/api/admin/settings/route.ts`: added 3 bonus fields to Zod schema

### TASK 21 — Credit Rollover Cron System
- `apps/web/src/lib/credit-rollover.ts` — NEW: `processUserRollover(userId, planSlug)` — carries forward unused credits (max: lite=200, pro=700, business=1500), creates CreditTransaction type 'rollover', sends notification, invalidates Redis
- `apps/web/src/app/api/cron/rollover/route.ts` — NEW: secured by `Authorization: Bearer {CRON_SECRET}`, processes subscribers in batches of 50
- `vercel.json`: added cron schedule `0 18 1 * *` (1st of month 18:00 UTC = 00:00 IST)
- `packages/db/src/models/CreditTransaction.ts`: added `rollover` to type enum
- `apps/web/.env`: added `CRON_SECRET=dev-cron-secret-change-in-production`

---


---

## What Was Done (Session B7-A)

### Bug Fixes (10 tasks)

**TASK 1 — /history page**
- Added subtitle "Your recent AI generations" to `history/page.tsx`
- Updated `api/user/history/route.ts` to return `outputText` (needed by modal) + strip HTML tags from preview
- Updated `HistoryTable.tsx`: new columns (Tool Name | Output Preview | Credits | Date & Time), fixed modal to show typed content (image/HTML/text), added Copy button

**TASK 2 — Onboarding credit logic**
- `api/onboarding/complete/route.ts`: reads credit amounts from SiteConfig (with fallback to 10)
- Added `note` field to all CreditTransaction.create calls
- Added `status !== 'suspicious'` check before awarding referral credits
- Fixed Redis invalidation: now invalidates both `balance:{userId}` AND `balance:{referrerId}`
- No user can ever get double credits (welcomeCreditGiven guard)

**TASK 3 — Profile photo in navbar**
- `auth.ts`: JWT `update` trigger now also handles `image` field (was only handling `onboardingCompleted`)
- Profile page already calls `await update({ image: url })` after upload — now works correctly

**TASK 4 — Remove "free tool" text**
- Removed "— free tool." from descriptions: quotation-generator, expense-tracker, offer-letter, tds-sheet, salary-slip config files
- Removed "Login to save your expenses permanently." banner from `ExpenseTrackerTool.tsx`
- Removed unused `Info` import

**TASK 5 — Pricing page plans (already done in B7)**
- `api/public/plans/route.ts` stale empty-cache fix was already in place

**TASK 6 — /register → 404**
- `PricingPage.tsx`: removed all `/register` hrefs; added `useSession`, `useRouter`, `useAuthStore`
- Logged-in users → redirect to `/dashboard` (free) or `/checkout?type=plan&slug=X` (paid)
- Logged-out users → opens auth modal (signup tab) + stores `pending_plan` in localStorage

**TASK 7 — Marketing tools: logged-in users see login modal**
- `(marketing)/tools/page.tsx`: added `useSession` + `useRouter`
- Tool card click: logged-in → `/tools/{slug}`, logged-out → auth modal
- "Try all 27 tools" CTA: logged-in → `/dashboard`, logged-out → auth modal

**TASK 8 — Homepage redirect for logged-in users (already done in B7)**
- Middleware never redirected `/` → confirmed no redirect block present

**TASK 9 — About page "Built With" section**
- Removed entire "Built With" `<section>` + `TECH_STACK` array from `about/page.tsx`

**TASK 10 — History eye icon empty modal**
- Fixed by Tasks 1 + API change: modal now shows text / iframe / image based on toolSlug/content
- Copy button copies output to clipboard

---

## What Was Done (Session B7)

### Bug Fixes

**BUG FIX 1 — /history 404 Error**
- Created `apps/web/src/app/(site)/history/page.tsx`
- The route was already in middleware `APP_ROUTES` but the page only existed at `dashboard/history`
- New page reuses `<HistoryTable />` component

**BUG FIX 2 — Onboarding Credit Notifications**
- `apps/web/src/app/api/onboarding/complete/route.ts`
- Updated notification messages to match spec exactly:
  - Referred user: title='Joining Bonus!', message='You got 10 credits for joining via referral link.'
  - Referrer: message='Your referral joined SetuLix. You got 10 credits!'
  - Direct user: title='Welcome to SetuLix!', message='You got 10 free credits to get started.'

**BUG FIX 3 — Profile Photo Not Updating in Navbar**
- `apps/web/src/app/(site)/profile/page.tsx`
- Added `const { update } = useSession()` to `AvatarUploader` component
- After successful upload: calls `await update({ image: data.url })` to sync NextAuth session
- Navbar reads from `session.user.image` and now updates instantly
- Fixed avatar priority: `avatarUrl || data?.user.avatar || session.user.image`

**BUG FIX 4 — Remove "Free tool" Text**
- Removed `Free tool — no login required. Login to save your work.` info banner from 5 tools:
  - `tools/gst-invoice/GstInvoiceTool.tsx`
  - `tools/tds-sheet/TdsSheetTool.tsx`
  - `tools/quotation-generator/QuotationGeneratorTool.tsx`
  - `tools/offer-letter/OfferLetterTool.tsx`
  - `tools/salary-slip/SalarySlipTool.tsx`
- Removed unused `Info` import from lucide-react in each file
- Updated `tools/gst-invoice/config.ts` description (removed "— free, no login required")

**BUG FIX 5 — Plans API Stale Empty Cache**
- `apps/web/src/app/api/public/plans/route.ts`
- If Redis cached an empty array (from before seed was run), now invalidates cache key and falls through to DB
- Prevents stale `[]` from being served when plans exist in DB

---

### New DB Models

**`packages/db/src/models/BillingProfile.ts`** — NEW
- Fields: userId (unique), accountType (individual/business), fullName, phone, address fields, gstin, businessName, gstState, contactPerson
- Exported from `packages/db/src/index.ts`

**`packages/db/src/models/User.ts`** — UPDATED
- Added: `isDeleted: boolean` (default false), `deletedAt: Date | null`, `status: 'active' | 'deleted' | 'banned'` (default 'active')

**`packages/db/src/models/CreditTransaction.ts`** — UPDATED
- Added: `note?: string` field
- Added types: `plan_upgrade`, `credit_purchase` (alongside existing types)
- Exported `CreditTransactionType` type

**`packages/db/src/credit-service.ts`** — UPDATED
- `addCredits()` now accepts `plan_upgrade` and `credit_purchase` as valid types

---

### Feature 1 — Credit Ledger

**`apps/web/src/app/(site)/credits/page.tsx`** — NEW
- Balance card (large display)
- 4 summary stat cards: Total Earned, Total Spent, This Month, Transaction Count
- Transaction table with: type badge, description, +/- amount (green/red), balance after, date
- Type badges: Welcome (purple), Referral (green), Tool Used (blue), Purchase (teal), Plan Upgrade (orange), Admin (gray)
- Filter tabs: All | Earned | Spent
- Load More pagination (20 per page)
- Empty state with Coins icon

**`apps/web/src/app/api/user/credits/ledger/route.ts`** — NEW
- `GET /api/user/credits/ledger?filter=all|earned|spent&page=1`
- Returns: `{ transactions, totalCount, totalPages, page, summary: { balance, earned, spent, thisMonth, transactionCount } }`
- Summary aggregated from all transactions (not affected by filter)

**Middleware** — Updated: added `/credits` and `/checkout` to APP_ROUTES

---

### Feature 2 — Sidebar Plan Widget

**`apps/web/src/components/layout/Sidebar.tsx`** — UPDATED
- New `PlanWidget` component at bottom of sidebar (above CreditsWidget)
- Expanded: plan badge + upgrade button + progress bar + credits used/total + tagline
- Collapsed: animated SVG donut ring with color-coded fill (green/amber/red)
- Progress bar colors: green <60%, amber 60-80%, red >80%
- Upgrade button: FREE/LITE → "Upgrade", PRO → "Go Business", BUSINESS/ENTERPRISE → hidden
- Added Credits link (`/credits`) and History link (`/history`) to sidebar nav

**`apps/web/src/app/api/user/sidebar-stats/route.ts`** — NEW
- `GET /api/user/sidebar-stats`
- Returns: `{ planSlug, planName, currentCredits, planCredits, creditsUsed }`
- Redis cached 2-minute TTL (`sidebar:{userId}`)

---

### Feature 3 — Account Delete (Soft)

**`apps/web/src/app/api/user/delete-account/route.ts`** — NEW
- `POST /api/user/delete-account`
- Sets `isDeleted=true`, `deletedAt=now`, `status='deleted'`
- Invalidates Redis keys: balance, workspace, sidebar, autofill, user cache
- Sends account deletion email (fire-and-forget)

**`apps/web/src/app/api/admin/users/[userId]/restore/route.ts`** — NEW
- `POST /api/admin/users/[id]/restore` (admin auth required)
- Sets `isDeleted=false`, `deletedAt=null`, `status='active'`

**`apps/web/src/app/(site)/profile/page.tsx`** — UPDATED
- Danger Zone section at bottom: red border card, AlertTriangle icon, description
- "Delete My Account" button → opens confirmation modal
- Modal: warning text + type "DELETE" input + disabled Delete button until text matches
- On confirm: POST /api/user/delete-account → signOut → redirect to `/?deleted=true`

**`apps/web/src/auth.ts`** — UPDATED
- Credentials `authorize`: throws error if `user.isDeleted === true`
- Google OAuth jwt callback: if `dbUser.isDeleted`, sets `token.isDeleted=true` and returns early

**`apps/web/src/middleware.ts`** — UPDATED
- If `payload.isDeleted === true` or `!payload.id` → redirect to `/`

**`apps/web/src/components/marketing/DeletedAccountToast.tsx`** — NEW
- Client component that checks `?deleted=true` on URL and shows toast
- Imported in marketing home page

---

### Feature 4 — Credit Low Alert

**`apps/web/src/lib/credit-alerts.ts`** — NEW
- `checkAndSendCreditAlert(userId, currentBalance, planSlug)`
- Threshold: 20% of plan credits (free=2, lite=40, pro=140, business=300)
- Redis key: `credit_alert_sent:{userId}:{YYYY-MM}` — one alert per user per month
- TTL = seconds until end of month
- On trigger: creates in-app notification, sets Redis sentinel
- Never throws — fully wrapped in try-catch

**`apps/web/src/app/api/user/credits/deduct/route.ts`** — UPDATED
- After successful deduction: `void checkAndSendCreditAlert(userId, newBalance, planSlug)`
- Fire-and-forget (never delays response)

---

### Feature 5 — Email System

**`apps/web/src/lib/email/sender.ts`** — NEW
- `sendEmail({ to, subject, html, replyTo? })`
- Uses Resend API (`RESEND_API_KEY` env var)
- Falls back to console.log if key not set (dev mode)
- Never throws — all errors caught and logged

**`apps/web/src/lib/email/base-template.ts`** — NEW
- `baseEmailTemplate(content: string): string`
- Full HTML shell: purple header, content area, footer with SetuLabsAI branding
- Mobile-responsive with inline styles (email client compatible)

**`apps/web/src/lib/email/templates.ts`** — NEW
- `welcomeEmail({ name })` — subject: "Welcome to SetuLix, {name}!"
- `accountDeletionEmail({ name })` — subject: "Your SetuLix account has been deactivated"
- `creditPurchaseEmail({ name, credits, amount, invoiceNumber, transactionId })`
- `planUpgradeEmail({ name, planName, credits, amount, invoiceNumber })`
- `creditLowEmail({ name, balance })`

**`apps/web/src/lib/email/invoice.ts`** — NEW
- `generateInvoiceHTML(data: InvoiceData): string`
- Full GST invoice: seller/buyer boxes, items table, CGST/SGST breakdown, payment info
- Premium inline-styled HTML (email + browser compatible)

**`apps/web/src/lib/email/invoice-number.ts`** — NEW
- `generateInvoiceNumber(): Promise<string>`
- Format: `SLX-2026-XXXXX` (atomic increment via MongoDB `$inc`)
- Stored in SiteConfig collection: key=`last_invoice_number`

**Email triggers wired:**
- Welcome email → `onboarding/complete/route.ts` (fire-and-forget)
- Deletion email → `user/delete-account/route.ts` (fire-and-forget)
- TODO(B8): Purchase email → Cashfree webhook handler (not yet built)

---

### Feature 6 — Checkout Page

**`apps/web/src/app/(site)/checkout/page.tsx`** — NEW
- Query: `?type=plan&slug=pro&cycle=monthly` or `?type=pack&id=PACK_ID`
- Left: billing form with Individual/Business toggle (pill)
  - Individual: name, phone, address, city, state, PIN, optional GSTIN
  - Business: business name, GSTIN (validated regex), GST state, contact person, phone, address, PIN
  - Zod validation with per-field error display
  - "Save billing details" checkbox (checked by default)
  - Pre-fills from saved billing profile on mount
- Right (sticky): order summary card
  - Item name + credits + billing cycle
  - Subtotal / GST 18% / Total breakdown
  - "Proceed to Pay" button (disabled, tooltip: "coming soon — Cashfree")
  - Trust indicators: Shield/Lock/CheckCircle

**`apps/web/src/app/api/user/billing-profile/route.ts`** — NEW
- `GET /api/user/billing-profile` — returns saved profile or null
- `POST /api/user/billing-profile` — upsert (one per user)

**`apps/web/src/app/api/checkout/item-details/route.ts`** — NEW
- `GET /api/checkout/item-details?type=plan&slug=pro&cycle=monthly`
- `GET /api/checkout/item-details?type=pack&id=PACK_ID`
- Returns: `{ type, name, credits, cycle, subtotal, gstAmount, total }`
- GST rate: 18% (CGST 9% + SGST 9%)

---

## Architecture Notes

### New Redis Keys (B7)
```
sidebar:{userId}                    TTL 2min — sidebar stats (plan + credits)
credit_alert_sent:{userId}:{YYYY-MM} TTL = seconds until month end
```

### Deleted User Flow
```
User clicks "Delete My Account"
  → types "DELETE" in modal
  → POST /api/user/delete-account
      → User.isDeleted=true, deletedAt=now, status='deleted'
      → Redis invalidated
      → accountDeletionEmail (fire-and-forget)
  → signOut() → redirect to /?deleted=true
  → DeletedAccountToast shows "Account deleted. Sorry to see you go."

Deleted user tries to login:
  Credentials → authorize() throws error → shown in AuthModal
  Google → jwt() returns early with isDeleted=true → middleware blocks at next request

Admin restore:
  POST /api/admin/users/[id]/restore → isDeleted=false, status='active'
```

### Email System Architecture
```
sendEmail() ← never throws, always try-catch
  ↓
templates.ts ← { subject, html } per event
  ↓
base-template.ts ← consistent branded wrapper
  ↓
invoice.ts ← standalone HTML invoice (for attachment trigger in B8)
  ↓
invoice-number.ts ← atomic SLX-YYYY-XXXXX via MongoDB $inc
```

### Checkout Flow (current state)
```
/checkout?type=plan&slug=pro&cycle=monthly
  → GET /api/checkout/item-details → { name, credits, cycle, gst breakdown }
  → GET /api/user/billing-profile → pre-fill form
  → User fills billing form
  → POST /api/user/billing-profile → save details
  → "Proceed to Pay" → disabled (TODO B8: trigger Cashfree)
```

---

## What Was Done (Session B6)
[See previous HANDOFF for B6 details — Production Pricing + Abuse Protection]

---

## Issues
None. TypeScript: 0 errors.
