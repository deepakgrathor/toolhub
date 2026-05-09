# Handoff Note
Updated: 2026-05-09 | Account: A | Session: #9 | Blog Generator — First Functional AI Tool (complete)

## Where We Are
Session A9 done. Blog Generator is fully wired: form → API → OpenAI → credits deducted → ToolOutput saved → output displayed. The tool shell page now has a dynamic component map so future tools slot in with one line.

### What Was Built (Session A9 — Blog Generator)

**ToolOutput DB Model**
- `packages/db/src/models/ToolOutput.ts` — Mongoose model: userId, toolSlug, inputSnapshot (Mixed), outputText, creditsUsed, timestamps
- `packages/db/src/index.ts` — Uncommented/added `export * from "./models/ToolOutput"`

**Shared Types**
- `packages/shared/src/tool-types.ts` — `ToolEngineResult` (output, structured, creditsUsed, newBalance) + `ToolEngineContext` (userId, toolSlug)
- `packages/shared/src/index.ts` — Added `export * from "./tool-types"`

**Blog Generator — Tool Files**
- `apps/web/src/tools/blog-generator/config.ts` — `blogGeneratorConfig`: slug, name, description, creditCost=3, model=gpt-4o-mini, provider=openai, maxTokens=2000
- `apps/web/src/tools/blog-generator/schema.ts` — Zod schema: topic (min 3, max 200), tone (4 enums), length (3 enums), targetAudience (optional), keywords (optional); exports `BlogGeneratorInput` type
- `apps/web/src/tools/blog-generator/engine.ts` — Server-only: connectDB → checkBalance → fetch OpenAI → JSON.parse → deductCredits → ToolOutput.create → return result. Credits deducted ONLY after successful parse. OpenAI key ONLY accessed here.
- `apps/web/src/app/api/tools/blog-generator/route.ts` — POST handler: auth() check → Zod parse → execute() → 402 on InsufficientCreditsError → 500 on other errors

**Blog Generator — UI**
- `apps/web/src/tools/blog-generator/BlogGeneratorTool.tsx` — Client component; renders own 2-col layout (45/55); Left: tool header + form (topic input, tone pills, length pills, target audience, keywords, generate button with auth/paywall logic); Right: empty state / loading skeleton / blog output with copy+download actions
- `apps/web/src/components/tools/ToolLoadingSkeleton.tsx` — Animate-pulse 2-col skeleton for dynamic import loading state

**Tool Shell Page (updated)**
- `apps/web/src/app/(site)/tools/[slug]/page.tsx` — Added `toolComponents` map with `dynamic()` import for blog-generator; ToolComponent replaces placeholder panels when slug matches; placeholder shell preserved for unbuilt tools

### Credit Deduction Flow (confirmed)
1. Client submits form → POST `/api/tools/blog-generator`
2. Server: `checkBalance()` → OpenAI fetch → `JSON.parse()` → **only now** `deductCredits()` → `ToolOutput.create()`
3. Server returns `{ success, output, creditsUsed, newBalance }`
4. Client: `deductLocally(3)` for optimistic sidebar/navbar update

### OpenAI Key Security (confirmed)
- `OPENAI_API_KEY` read only inside `engine.ts` (server-only file, never bundled to client)
- API route imports `execute()` from engine — no key exposure in route.ts
- Client component calls `/api/tools/blog-generator` — zero knowledge of the key

### Adding Future Tools
1. Create `apps/web/src/tools/[tool-name]/` with config.ts, schema.ts, engine.ts, BlogGeneratorTool-style component
2. Add one entry to `toolComponents` map in `apps/web/src/app/(site)/tools/[slug]/page.tsx`
3. Add API route at `apps/web/src/app/api/tools/[tool-name]/route.ts`

### What Was Built (Session A8 — Admin Pricing + Settings)

**Pricing Management**
- `apps/web/src/app/admin/pricing/page.tsx` — server component; fetches all CreditPacks (sorted by sortOrder); passes `PackRow[]` to client component
- `apps/web/src/components/admin/PricingTable.tsx` — full client CRUD; table with Name/Credits/Price/₹per Credit/Featured/Active/Order/Actions columns; "Add New Pack" button; shared modal form for add+edit (pre-filled on edit); delete confirm dialog; HTML5 drag-to-reorder (dragstart/dragenter/dragend updates sortOrder + fires PATCH for each affected row)
- `apps/web/src/app/api/admin/pricing/route.ts` — POST; admin auth; Zod validation; creates CreditPack; AuditLog entry
- `apps/web/src/app/api/admin/pricing/[id]/route.ts` — PATCH (update fields); DELETE (remove pack); both with admin auth + AuditLog before/after snapshot

**Site Settings**
- `apps/web/src/app/admin/settings/page.tsx` — server component; fetches 4 SiteConfig keys with defaults fallback; passes `SiteSettings` to client component
- `apps/web/src/components/admin/SettingsForm.tsx` — client form; 3 sections: Default Theme (radio cards), Announcement Banner (textarea + char count + toggle + live preview), Maintenance Mode (toggle + red warning); single Save button → PATCH `/api/admin/settings`; success/error feedback with 3s auto-clear
- `apps/web/src/app/api/admin/settings/route.ts` — PATCH; admin auth; Zod validation of 4 keys; upserts each key in SiteConfig collection; AuditLog with before/after per-key diff

**Announcement Banner**
- `apps/web/src/components/layout/AnnouncementBanner.tsx` — client component; shows purple full-width banner with text + X dismiss button; dismissal stored in `sessionStorage` (reappears on new tab/session); mounts conditionally (no DOM node when hidden)
- `apps/web/src/app/layout.tsx` — updated; fetches `announcement_banner` + `announcement_visible` from SiteConfig in the same `connectDB()` call as kit list; renders `<AnnouncementBanner>` above the main layout div (SSR rendered, no flash)

### SiteConfig Keys Used
| Key | Type | Default |
|-----|------|---------|
| `default_theme` | `"dark" \| "light"` | `"dark"` |
| `announcement_banner` | `string` | `""` |
| `announcement_visible` | `boolean` | `false` |
| `maintenance_mode` | `boolean` | `false` |

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

## Next Task
Session A10: Second Tool + Tool History Page
- Build one more tool (e.g. YT Script or Title Generator) following blog-generator pattern
- Add `/dashboard/history` page: lists user's ToolOutput records (tool name, date, credits used, preview)
- Consider: tool output preview modal (click row → see full output)

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

**Required for Blog Generator:**
- `OPENAI_API_KEY` — from OpenAI dashboard (used only in engine.ts, never client-side)

**Required for Razorpay payments:**
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` — from Razorpay dashboard
- `RAZORPAY_WEBHOOK_SECRET` — set in Razorpay dashboard → Webhooks → Secret
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — same value as `RAZORPAY_KEY_ID`
- Register webhook URL: `https://<your-domain>/api/webhooks/razorpay` with event `payment.captured`

**Optional for now:**
- Upstash Redis, Cloudflare R2, Resend, PostHog, LiteLLM

## Branch / PR Status
- Working on branch `main` (direct commits)

## Issues
None — code is clean, types reviewed manually (tsc not runnable without npm install in worktree).
