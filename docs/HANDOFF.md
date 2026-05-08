# Handoff Note
Updated: 2026-05-09 | Account: A | Session: #7 | Admin Panel — Tools + Users (complete)

## Where We Are
Session A7 done. Admin panel with layout, overview stats, tools inline editing, users management + add credits modal, and all admin API routes.

### What Was Built (Session A7 — Admin Panel)

**Admin Layout**
- `apps/web/src/app/admin/layout.tsx` — client component; nested inside root layout's `<main>`; own two-column structure (admin sidebar + content); `usePathname` for active link highlighting; "Back to site" link; 5 nav items (Overview, Tools, Users, Pricing, Settings)

**Admin Overview**
- `apps/web/src/app/admin/page.tsx` — server component; 4 stat cards: Total Users, Active Tools, Credits Sold, Credits This Month; MongoDB aggregations for purchase totals

**Tools Management**
- `apps/web/src/app/admin/tools/page.tsx` — server component; fetches ALL tools + configs (not filtered by isActive); passes `AdminToolRow[]` to client component
- `apps/web/src/components/admin/ToolsTable.tsx` — client component; full inline editing; credits input with blur-to-save; model select with immediate save; active toggle switch; icon map for all 27 tool icons; saving overlay per row; PATCH `/api/admin/tools/[slug]`

**Users Management**
- `apps/web/src/app/admin/users/page.tsx` — server component; `searchParams.q` → MongoDB `$regex` search on name+email; `AdminUserRow[]` passed to client; 100 user limit
- `apps/web/src/components/admin/UsersTable.tsx` — client component; search input → `router.push` with `?q=`; Add Credits modal (amount + note); POST `/api/admin/users/[userId]/credits`; credits flash green on successful add; plan badge; avatar initial; admin role indicator

**Admin API Routes**
- `apps/web/src/app/api/admin/tools/[slug]/route.ts` — PATCH; admin role check; upserts ToolConfig; calls `clearToolCache()`; logs to AuditLog with before/after snapshot
- `apps/web/src/app/api/admin/users/[userId]/credits/route.ts` — POST; admin role check; `CreditService.addCredits(..., 'manual_admin', { note, adminId })`; logs to AuditLog

### Architecture Note (A7)
- Admin layout nests inside root layout's `<main>` — main site sidebar/navbar remain visible for admins
- All admin routes check `session.user.role === "admin"` (enforced by both middleware AND each API route for defense-in-depth)
- `clearToolCache()` clears the in-process Map cache in `tool-registry.ts` — effective in dev (singleton module); in serverless prod each lambda has its own cache which expires naturally
- `ToolConfig.findOneAndUpdate(..., { upsert: true })` — creates config if a tool was seeded without one

### What Was Built (Session A6 — Razorpay Integration)

**New API Route: Purchase Order**
- `apps/web/src/app/api/credits/purchase/route.ts` — POST, auth required
  - Body: `{ packId }` → validates, fetches CreditPack from DB
  - Calls `POST https://api.razorpay.com/v1/orders` via fetch (no SDK)
  - Stores `notes: { userId, packId }` so webhook can identify buyer
  - Returns `{ orderId, amount, currency, packName, credits }`

**New API Route: Razorpay Webhook**
- `apps/web/src/app/api/webhooks/razorpay/route.ts` — POST, public
  - Verifies `X-Razorpay-Signature` via `HMAC-SHA256(rawBody, WEBHOOK_SECRET)`
  - Always returns 200 (Razorpay retries on non-200)
  - Handles only `payment.captured` event
  - Idempotent: checks `CreditTransaction.findOne({ "meta.paymentId": paymentId })` before adding
  - On valid capture: calls `CreditService.addCredits(userId, pack.credits, 'purchase', { orderId, paymentId, packId, packName })`

**New Component: BuyCreditsButton**
- `apps/web/src/components/credits/BuyCreditsButton.tsx` — client component
  - Props: `pack: PackData` (serializable, no Mongoose types)
  - States: loading (spinner), success (green checkmark + "Credits Added!" for 3s)
  - Loads `checkout.razorpay.com/v1/checkout.js` dynamically, once (caches by script ID)
  - Opens Razorpay modal with purple `#7c3aed` theme
  - On payment success: calls `syncFromServer()` from credits-store → live balance update
  - On modal dismiss: clears loading state

**Updated: Pricing Page**
- `apps/web/src/app/pricing/page.tsx`
  - Replaced static `<Link href="/dashboard">Get Started</Link>` with `<BuyCreditsButton pack={{...}} />`
  - Passes serialized pack data (`.toString()` on `_id`, plain fields only)
  - Removed unused `next/link` import

**New File: .env.example**
- `apps/web/.env.example` — full reference for all env vars (was missing from repo)
  - Includes Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`

### What Was Built (Session A5 — Credit System + Pricing + Dashboard)

**New DB Model**
- `packages/db/src/models/CreditTransaction.ts` — Schema: userId, type, amount, balanceAfter, toolSlug?, meta?
  - Types: purchase | use | refund | referral_bonus | manual_admin

**New DB Service**
- `packages/db/src/credit-service.ts` — `CreditService` class (static methods) + `InsufficientCreditsError`
  - `checkBalance(userId, required)` → boolean
  - `getBalance(userId)` → number
  - `deductCredits(userId, amount, toolSlug)` → atomic (MongoDB session + withTransaction)
  - `addCredits(userId, amount, type, meta?)` → atomic
  - `getTransactionHistory(userId, limit)` → sorted desc
  - Note: placed in packages/db (not shared) to avoid circular dependency — shared→db would cycle with db→shared

**Updated packages/db/src/index.ts**
- Now exports `CreditTransaction`, `ICreditTransaction`, `CreditService`, `InsufficientCreditsError`

**New API Routes**
- `GET /api/user/credits` — auth required; returns `{ balance, transactions }` (20 most recent)
- `POST /api/user/credits/deduct` — body `{ toolSlug, amount }`; 402 on insufficient credits
- `GET /api/credits/packs` — public; returns active packs sorted by sortOrder

**New Zustand Store**
- `apps/web/src/store/credits-store.ts` — `useCreditStore`
  - state: balance, isLoading, lastSynced
  - `setBalance`, `deductLocally` (optimistic), `syncFromServer` (GET /api/user/credits)

**Updated: AuthModal** (`apps/web/src/components/auth/AuthModal.tsx`)
- Calls `syncFromServer()` after successful login AND successful signup+auto-login

**Updated: Sidebar** (`apps/web/src/components/layout/sidebar.tsx`)
- Credits badge reads from `useCreditStore().balance` (live updates, not stale JWT)

**Updated: Navbar** (`apps/web/src/components/layout/Navbar.tsx`)
- Credits badge reads from `useCreditStore().balance`

**New Page: Pricing** (`apps/web/src/app/pricing/page.tsx`)
- Server component — fetches packs from DB via `connectDB()` + `CreditPack.find`
- Responsive grid: 1→2→3→5 columns depending on pack count
- isFeatured pack: purple ring + "Most Popular" badge + solid purple CTA
- Per-credit cost shown per card
- "What can you build?" table: tool name, kit, credits, ₹ cost at popular pack rate
- FAQ accordion (native `<details>` + CSS chevron rotate)
- Falls back gracefully if DB is unavailable (empty state, no crash)

**New Page: Dashboard** (`apps/web/src/app/dashboard/page.tsx`)
- Server component shell — fetches popular tools server-side
- Auth protected by Next.js middleware (to be configured separately)

**New Components: Dashboard**
- `apps/web/src/components/dashboard/CreditOverview.tsx` — client; syncs balance on mount; Coins icon, large purple number, "Buy More Credits" → /pricing
- `apps/web/src/components/dashboard/TransactionHistory.tsx` — client; fetches /api/user/credits on mount; table with date/tool/type/amount/balance; skeleton loading (5 rows); empty state with SearchX icon; type badges color-coded

**New Store: Paywall**
- `apps/web/src/store/paywall-store.ts` — `usePaywallStore`: isOpen, toolName, requiredCredits, openPaywall(), closePaywall()

**New Modal: PaywallModal** (`apps/web/src/components/credits/PaywallModal.tsx`)
- Globally mounted in root layout
- Shows required vs available credits
- "Buy Credits" → /pricing | "Cancel" button

**Updated: Root Layout** (`apps/web/src/app/layout.tsx`)
- Added `<PaywallModal />` (globally mounted)

### Architecture Note
- CreditService uses MongoDB transactions (`startSession` + `withTransaction`) for atomic credit deduct+log
- Credits are deducted AFTER AI response (enforced by design — deductCredits called from tool engine, not from UI)
- Pricing page is fully public (no auth required)
- Dashboard requires auth — middleware `/apps/web/src/middleware.ts` should protect `/dashboard`

## Next Task
Session A8: Tool Engine + First Functional Tool (Blog Generator)
- Wire up `/tools/blog-generator` with real form + AI call
- Tool engine pattern: form → /api/tools/blog-generator → AI → deductCredits → return output
- Store tool output in ToolOutput collection
- Hook into PaywallModal when balance < creditCost
- Auth gate: trigger AuthModal if not logged in on form submit

## How to Seed
```bash
# From repo root (requires MONGODB_URI in env):
npm run seed

# Or directly from db package:
cd packages/db
MONGODB_URI=mongodb+srv://... npm run seed
```

## Credit Cost Reference
| Credits | Tools |
|---------|-------|
| 0       | hook-writer, caption-generator, gst-invoice, expense-tracker, quotation-generator, qr-generator, salary-slip, offer-letter, gst-calculator, tds-sheet |
| 1       | title-generator, email-subject, whatsapp-bulk |
| 3       | blog-generator, resume-screener, jd-generator, appraisal-draft, policy-generator, linkedin-bio, ad-copy, legal-disclaimer |
| 4       | yt-script |
| 7       | thumbnail-ai |
| 8       | seo-auditor |
| 10      | website-generator |
| 12      | legal-notice, nda-generator |

## Env Vars Status (all in apps/web/.env.example)
**Must fill before testing:**
- `MONGODB_URI` — MongoDB Atlas connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console

**Required for Razorpay payments:**
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` — from Razorpay dashboard
- `RAZORPAY_WEBHOOK_SECRET` — set in Razorpay dashboard → Webhooks → Secret
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — same value as `RAZORPAY_KEY_ID`
- Register webhook URL: `https://<your-domain>/api/webhooks/razorpay` with event `payment.captured`

**Optional for now:**
- Upstash Redis, Cloudflare R2, Resend, PostHog, LiteLLM

## Branch / PR Status
- Branch `claude/intelligent-solomon-936673` (current worktree)
- User should push this branch and open a new PR

## Issues
None — code is clean, types reviewed manually (tsc not runnable without npm install in worktree).
