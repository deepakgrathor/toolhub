# Handoff Note
Updated: 2026-05-09 | Account: A | Session: #5 | Credit System + Pricing + Dashboard (complete)

## Where We Are
Session A5 done. Full credit system, pricing page, dashboard, and paywall modal are all built.

### What Was Built

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
Session A6: Tool Engine + First Functional Tool (Blog Generator)
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

**Optional for now:**
- Upstash Redis, Cloudflare R2, Razorpay, Resend, PostHog, LiteLLM

## Branch / PR Status
- Branch `claude/dreamy-newton-748082` (current worktree)
- Previous branch `claude/distracted-ishizaka-117a9d` was pushed in session A4
- User should push this branch and open a new PR

## Issues
None — code is clean, types reviewed manually (tsc not runnable without npm install in worktree).
