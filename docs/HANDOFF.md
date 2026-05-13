# Handoff Note
Updated: 2026-05-13 | Account: B | Session: B7 | Bug Fixes + Credit Ledger + Sidebar Plan Widget + Email System + Checkout

## Where We Are
Session B7 done. **TypeScript: 0 errors.** Committed to main (a7d1aad).

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
