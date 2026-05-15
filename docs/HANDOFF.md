# Handoff Note
Updated: 2026-05-15 | Account: B | Session: BFix-2 | Features: hardcoded values fix — kit pricing, welcome credits, ThemeProvider audit

## Where We Are
Session BFix-2 done. **TypeScript: 0 errors (all packages). Build: passing.**
Note: pre-existing prisma/opentelemetry warning and verify-payment static render note in build output — both existed before this session.

---

## What Was Done (Session BFix-2)

### Task 1 — Kit Page Hardcoded Credit Costs Removed

- `apps/web/src/app/(marketing)/kits/[slug]/page.tsx` — fully rewritten
  - Removed hardcoded `KITS` object (had baked-in `creditCost` values, violating arch rule #9 + #16)
  - Added `MARKETING_CONTENT` — pure copy per kit (name, tagline, steps, useCases, faqs) — no creditCost
  - Added `KIT_ICONS` map: URL slug → lucide-react component
  - Added `KIT_DB_SLUG` map: `legal → ca-legal` (URL slug differs from DB kit slug in tools `kits[]` array)
  - Tool list now fetched at render via `getToolsByKit(dbSlug)` — uses tool-registry (Redis + DB)
  - Tool cards: show FREE badge (emerald) or AI badge (purple) — NO credit cost displayed
  - Tools section hidden if DB returns empty (graceful fallback for unseeded envs)
  - Added `export const revalidate = 3600` — ISR, marketing page does not need real-time data

### Task 2 — ThemeProvider (already done — no changes needed)

- Root `apps/web/src/app/layout.tsx` already had `getDefaultTheme()` reading SiteConfig key `"default_theme"` with fallback to `"dark"`
- Seed already had `{ key: "default_theme", value: "dark" }` entry
- Verified and confirmed — nothing to change

### Task 3 — Welcome Credits Migrated to SiteConfig

- `apps/web/src/auth.ts`
  - Removed `FREE_CREDITS_ON_SIGNUP` import from `@toolhub/shared`
  - Added `SiteConfig` import from `@toolhub/db`
  - On first Google OAuth login (user creation): replaced `credits: FREE_CREDITS_ON_SIGNUP` with a `SiteConfig.findOne({ key: "welcome_bonus_credits" })` read (fallback: 10)
  - Admin can now change welcome credits from DB without a code deploy
- `packages/db/src/seed.ts`
  - Added `{ key: "welcome_bonus_credits", value: 10 }` to `SITE_CONFIGS` array
- `packages/shared/src/constants/index.ts`
  - Marked `FREE_CREDITS_ON_SIGNUP` as `@deprecated` with comment pointing to SiteConfig key
  - Kept the export (not deleted) — may still be referenced in docs/tooling

#### Modified Files (BFix-2)
```
apps/web/src/app/(marketing)/kits/[slug]/page.tsx  — hardcoded KITS → DB fetch + MARKETING_CONTENT
apps/web/src/auth.ts                               — FREE_CREDITS_ON_SIGNUP → SiteConfig read
packages/db/src/seed.ts                            — added welcome_bonus_credits entry
packages/shared/src/constants/index.ts            — deprecated FREE_CREDITS_ON_SIGNUP
```

#### Rules Verified
- TypeScript: 0 errors (apps/web + packages/db + packages/shared)
- Build: passing (75/75 static pages)
- No credit costs shown on marketing pages
- No hardcoded credit values in runtime code paths
- Tool credit costs, welcome bonus all fetched from DB/SiteConfig

---

## Next Session: B10-C
- FAQ section redesign (premium accordion with animations)
- Final CTA redesign (premium gradient)
- Any remaining polish items

---

## What Was Done (Session BFix-1)

### Task 1 — Missing DB Indexes added

- `packages/db/src/models/CreditTransaction.ts`
  - Added `index: true` to `toolSlug` field (speeds per-tool history queries)
- `packages/db/src/models/User.ts`
  - Added `index: true` to `referredBy` field (speeds referral chain lookups)
- `packages/db/src/models/Payment.ts`
  - Added compound index `PaymentSchema.index({ userId: 1, status: 1 })` (speeds admin payment filter queries)

### Task 2 — Tool Registry N+1 Query Fixed

- `apps/web/src/lib/tool-registry.ts` — fully rewritten
  - **Before**: `getAllTools()` did `Promise.all([Tool.find().lean(), ToolConfig.find().lean()])` — two DB round trips, merged in memory
  - **Before**: `getToolBySlug()` did same with two findOne calls
  - **After**: both use a single `$lookup` aggregation pipeline (`toolconfigs` collection, keyed on `slug`/`toolSlug`) — one DB round trip
  - New `RawAggregatedTool` interface + `fromAggregated()` helper replace old `mergeToolWithConfig()`
  - Shared `LOOKUP_STAGES` constant reused between `getAllTools()` (no match) and `getToolBySlug()` (prepends `$match: { slug }`)
  - Redis/mem cache logic, `getToolsByKit()`, `getKitList()`, `clearToolCache()` — all unchanged

### Task 3 — Blog Engine LiteLLM Removed

- `apps/web/src/tools/blog-generator/engine.ts`
  - Removed LiteLLM gateway block (`LITELLM_GATEWAY_URL` / `LITELLM_MASTER_KEY` env vars) — was Phase 2+ only, dead in Phase 1
  - Removed `MODEL_PROVIDER` and `ANTHROPIC_MODEL_IDS` lookup tables (no longer needed)
  - `callAI()` now routes directly: `provider === "anthropic"` → Anthropic API, `provider === "google"` → Gemini API, default → OpenAI
  - Provider comes from `toolConfigDoc.aiProvider` (DB/Redis), not hardcoded
  - Credit deduction logic unchanged — still happens only after successful AI response

#### Modified Files (BFix-1)
```
packages/db/src/models/CreditTransaction.ts   — index on toolSlug
packages/db/src/models/User.ts                — index on referredBy
packages/db/src/models/Payment.ts             — compound index {userId, status}
apps/web/src/lib/tool-registry.ts             — $lookup aggregation replaces N+1
apps/web/src/tools/blog-generator/engine.ts   — LiteLLM removed, direct providers only
```

#### Rules Verified
- TypeScript: 0 errors (apps/web + packages/db + packages/shared)
- Build: passing (75/75 static pages)
- No hardcoded credit costs or models
- Credit deduction still happens after successful AI response only

---

## Next Session: B10-C
- FAQ section redesign (premium accordion with animations)
- Final CTA redesign (premium gradient)
- Any remaining polish items

---

## What Was Done (Session B10-FIX)

### Issues resolved (all 11)

#### Issue 1 — /tools page synced with homepage
- Created `apps/web/src/data/tools-data.ts` — shared `TOOLS` (27 entries with slug/name/Icon/category/outcome/isFree) and `CATEGORIES` (6 entries with id/label/count/Icon)
- `HeroCTA.tsx` now imports TOOLS + CATEGORIES from tools-data.ts (removed local declarations)
- `apps/web/src/app/(marketing)/tools/page.tsx` fully rewritten:
  - Uses shared TOOLS + CATEGORIES (no more credit costs)
  - Shows outcome line + Free badge or AI Tool badge (no credit amounts)
  - onClick → `router.push(/tools/[slug])` (public browsing page, no auth modal)
  - Category tabs: same CATEGORIES array, centered flex-wrap layout

#### Issue 2 — /pricing page synced with homepage
- Homepage `page.tsx` now fetches plans/packs/rollover from DB (same logic as /pricing/page.tsx)
- Homepage SECTION 8 replaced with `<PricingPage plans={...} packs={...} rollover={...} />`
- Both routes now use the same shared `PricingPage` client component — no duplication

#### Issue 3 — /about page premium redesign
- `apps/web/src/app/(marketing)/about/page.tsx` fully rewritten (6 sections):
  - Section 1: Hero with radial glow + grid overlay + "Our Story" eyebrow
  - Section 2: 3 problem cards (Globe2 / IndianRupee / Users icons)
  - Section 3: Founder block (DR avatar, blockquote, LinkedIn link)
  - Section 4: Stats row (27+ tools / 500+ professionals / 5 kits / ₹0 to start)
  - Section 5: 6-item principles grid (CheckCircle2 icons)
  - Section 6: CTA block (bg-primary, white button via AboutCTA)
- `AboutCTA.tsx` updated: white button "Start free today" → `openAuthModal("signup")`

#### Issue 4 — Hero section premium upgrade
- `HeroCTA.tsx` upgraded:
  - Eyebrow: pulsing emerald dot + Zap icon + "Live · 500+ professionals using SetuLix"
  - H1: added `xl:text-7xl`
  - CTA primary button: shimmer animation via `after:` pseudo-element + `relative overflow-hidden`
  - Social proof: colored avatar circles (per-persona teal/violet/amber/blue/pink) + updated text "Joined by 500+ Indian professionals this month"
- Hero right column (`page.tsx`) upgraded to layered 3-card depth mockup:
  - Main card: Blog Generator + fake output lines + "Output ready" dot + "Download PDF"
  - Card 2 (rotate-2, opacity-60): Legal Notice
  - Card 3 (-rotate-1, opacity-40): GST Invoice

#### Issue 5 — Features section premium redesign
- `page.tsx` Section 4 fully rewritten:
  - Eyebrow "Why it works", new H2 + subtext
  - Card 1: LayoutGrid — "Your kit. Your tools." + kit pills
  - Card 2: Cpu — "Best AI for every job." (highlighted, ring-1 ring-primary/30) + model badges
  - Card 3: Coins — "Pay for what you use." + credit example rows

#### Issue 6 — PersonaJourney tab text fix
- `PersonaJourney.tsx`: inactive tab changed from `bg-muted text-muted-foreground border-border hover:bg-muted/80` to `bg-muted/30 text-foreground border-border hover:bg-muted transition-colors`
- Active tab stays: `bg-primary text-primary-foreground border-primary`

#### Issue 7 — CTA buttons fixed
- Created `apps/web/src/components/marketing/AuthModalOpener.tsx` ("use client"):
  - Reads `?auth=signup|login` query param via `useSearchParams`
  - Calls `openAuthModal("signup"|"login")` on mount
- `page.tsx`: renders `<Suspense><AuthModalOpener /></Suspense>` at top of marketing page
- `HeroCTA.tsx` hero button: changed from `<a href="/?auth=signup">` to `<button onClick={() => openAuthModal("signup")}>` — direct modal open
- All auth-modal CTAs now work (hero button, FinalCTA, ToolsShowcaseSection all explicitly call openAuthModal)

#### Issue 8 — Tools showcase header + tabs centered
- `HeroCTA.tsx` ToolsShowcaseSection:
  - Section header: `text-center mx-auto` 
  - Category tabs wrapper: `flex gap-2 flex-wrap justify-center overflow-x-auto sm:overflow-visible pb-2 mb-8`

#### Issue 9 — How It Works premium upgrade
- `page.tsx` Section 6 upgraded:
  - Outer: `relative overflow-hidden bg-background` + large blurred circle (bg-primary/5 blur-3xl)
  - Step cards: `before:` gradient top border (via-primary/40), `bg-card/80 backdrop-blur-sm`
  - Step number: `text-primary/6` (faint)
  - Time badge per step (Clock icon): "30 sec" / "1 min" / "< 1 min" / "instant"
  - Connector ChevronRight: `text-primary/30` between cards
  - Section CTA below steps: "Start free, no card needed" → `/?auth=signup`

#### Issue 10 — Comparison table premium redesign
- `page.tsx` Section 7:
  - Background: `bg-muted/20`
  - Table wrapper: `overflow-x-auto`, `min-w-[700px]`
  - SetuLix th: bg-primary + "✦ Made for India" sub-label
  - Even rows: `bg-muted/10`
  - CompareCell: uses `CheckCircle2` (highlight) / `Check` emerald / `X` muted/30 / `Minus` amber
  - Below-table: explanatory text + "Start free — no card needed" CTA → `/?auth=signup`

#### Issue 11 — Testimonials horizontal carousel
- Created `apps/web/src/components/marketing/TestimonialsCarousel.tsx` ("use client"):
  - Pure CSS scroll (no external lib) + snap-x snap-mandatory
  - Left/right gradient fade overlays
  - Card: w-[85vw] sm:w-[420px] lg:w-[380px] — avatar (per-color), stat chip, italic quote, Quote icon
  - Navigation dots: pill → `w-6` active, `w-2` inactive
  - Auto-scroll every 5s, pauses on hover (onMouseEnter/Leave)
  - activeIndex tracked via onScroll event
- `page.tsx` SECTION 9: replaced static grid with `<TestimonialsCarousel testimonials={TESTIMONIALS} />`

#### Modified Files (B10-FIX)
```
apps/web/src/data/tools-data.ts                              — NEW
apps/web/src/components/marketing/HeroCTA.tsx                — updated
apps/web/src/components/marketing/AuthModalOpener.tsx        — NEW
apps/web/src/components/marketing/TestimonialsCarousel.tsx   — NEW
apps/web/src/app/(marketing)/page.tsx                        — updated
apps/web/src/app/(marketing)/tools/page.tsx                  — updated
apps/web/src/app/(marketing)/about/page.tsx                  — updated
apps/web/src/app/(marketing)/about/AboutCTA.tsx              — updated
apps/web/src/components/marketing/PersonaJourney.tsx         — updated (tab text fix)
```

#### Rules Verified
- TypeScript: 0 errors
- No emoji in UI (lucide-react icons only)
- No hardcoded hex colors except semantic (emerald/amber/violet for AI model badges)
- No dynamic Tailwind class interpolation
- Semantic tokens throughout (bg-background, bg-card, text-foreground, etc.)
- Dark + light theme: all components use semantic tokens or dark: variants
- All "use client" components explicit at file top
- No API calls added to static marketing sections (pricing fetched server-side)

---

## Next Session: B10-C
- FAQ section redesign (premium accordion with animations)
- Final CTA redesign (premium gradient)
- Any remaining polish items

---

## What Was Done (Session B10-B)

### B10-B — Marketing Homepage: Tools + How It Works + Comparison

#### Modified Files

- `apps/web/src/components/marketing/HeroCTA.tsx`
  - `TOOLS` array: replaced `credit`/`desc` with `outcome` + `category` + `isFree` fields; 27 tools assigned to creator/sme/hr/legal/marketing categories
  - `CATEGORIES` array added: 6 entries (all/creator/sme/hr/legal/marketing) with counts
  - `ToolsShowcaseSection` fully rewritten:
    - `useState("all")` for active category filter
    - Section header: "27 AI tools" pill + H2 "Everything you need. Nothing you don't." + subtext
    - Horizontal scrollable category tabs — active: `bg-primary text-primary-foreground`, inactive: `border border-border`; tab count shown
    - Filtered tool grid: 2/3/4/5 cols by breakpoint; cards show icon + name + outcome + Free badge (emerald) or AI badge (Sparkles icon)
    - Below grid: "Can't find what you need?" text + "See the full roadmap →" link
    - No credit amounts shown (removed entirely)

- `apps/web/src/app/(marketing)/page.tsx`
  - **SECTION 5 (Tools Showcase)**: removed old `SectionHeading` + "Explore All Tools" link wrapper — now just `<section className="py-20"><ToolsShowcaseSection /></section>`
  - **SECTION 6 (How It Works)**: replaced 3-step centered layout with 4-step horizontal card grid:
    - Step 1: UserPlus — "Create your free account" — highlights "10 free credits"
    - Step 2: LayoutGrid — "Choose your kit" — highlights "personalised workspace"
    - Step 3: Wand2 — "Run any AI tool" — highlights "Claude, GPT-4o, and Gemini"
    - Step 4: Download — "Download or copy your output" — highlights "branded PDFs"
    - Decorative step numbers (text-5xl text-primary/10), `bg-muted/30` background, `border-t border-b border-border`
    - Connector `ChevronRight` icons between steps (hidden on mobile, positioned absolutely on md+)
  - **SECTION 7 (Comparison Table)**: fully redesigned:
    - New heading: "Built for India. Not adapted for it."
    - SetuLix `<th>`: `bg-primary text-primary-foreground` + "✦ Best for India" sub-label
    - Competitor columns: `bg-muted/50 text-muted-foreground`
    - SetuLix cells: `bg-primary/5`, `CheckCircle` icon `text-primary`
    - Competitor true → `Check` `text-emerald-500`, false → `X` `text-muted-foreground/40`, partial → `Minus` `text-amber-500`
    - 3 new rows added (no duplicates): "Hindi + English interface", "Indian tax tools (GST, TDS)", "Starts at ₹0" — total 12 rows
    - Below-table CTA: "Ready to switch?" `<a>` → `/?auth=signup`
  - **New imports**: `UserPlus, LayoutGrid, Wand2, Download, Minus`
  - **`CompareCell`**: updated to use `CheckCircle` (highlight=true), `Check` (emerald, highlight=false), `X`, `Minus`

#### Rules Verified
- TypeScript: 0 errors
- No Hindi text in any UI string
- No dynamic Tailwind class interpolation
- All icons: lucide-react only, no emojis
- Semantic tokens throughout
- Dark + light theme: all components tested
- Persona Journey (B9) — not touched
- `isFree` tools: qr-generator, gst-calculator, expense-tracker, gst-invoice, quotation-generator, salary-slip, offer-letter, tds-sheet

---

## Next Session: B10-C
- Testimonials section redesign (richer cards using TESTIMONIALS data with stat/color/city/featured fields)
- Pricing preview section redesign
- FAQ section redesign
- Final CTA section redesign

---

## What Was Done (Session B10-A)

### B10-A — Marketing Website Redesign (Foundation)

#### Modified Files
- `apps/web/src/app/(marketing)/page.tsx`
  - **Static data updated**: WHO_CARDS (added `outcome`, `color` fields), FEATURES (added `icon` field), STATS (new values), COMPARISON (new `values[]` array format with 5 competitors), FAQS (8 new English FAQs), TESTIMONIALS (5 detailed personas with `stat`, `color`, `city`, `featured` fields), COMPETITORS array added
  - **KIT_COLOR_MAP**: 5 color entries (violet/blue/teal/amber/pink) — all complete Tailwind strings, no interpolation
  - **Hero section**: 2-column layout (HeroCTA left + visual mockup card right), radial glow + grid overlay background
  - **Stats bar**: redesigned with `tabular-nums`, uppercase tracking labels, `md:text-4xl`
  - **TrustedByStrip**: placed between stats bar and Kit Cards section
  - **Kit Cards (WHO IS IT FOR)**: redesigned with `KIT_COLOR_MAP`, outcome chip (TrendingUp), tool pills (top 3 + overflow)
  - **Features section**: redesigned with icon + badge + card layout, `bg-muted/30` background
  - **Comparison table**: updated to use `COMPETITORS` array header, `values[]` body, improved `CompareCell` with `highlight` prop, amber "Partial" in dark mode
  - **English audit**: all Hindi text replaced — `Kaise kaam karta hai?` → `How it works`, `Kyun SetuLix?` → `Built specifically for Indian professionals.`, `Abhi shuru karo — free mein` → `Your AI workspace is ready.`, all step descriptions updated, footer copyright updated to 2026
  - **Metadata**: title + description updated (English only)
  - **Imports**: added `TrendingUp, MapPin, Quote, CheckCircle, FileText, Receipt, ChevronRight, cn`

- `apps/web/src/components/marketing/HeroCTA.tsx`
  - `HeroCTA` redesigned: left-column only, eyebrow badge, H1 "Save 10 hours / this week. / Every week.", subheadline, CTA pair (`<a>` links), social proof strip with avatar initials
  - `FinalCTA` and `ToolsShowcaseSection` unchanged
  - Auth logic preserved in `FinalCTA` and `ToolsShowcaseSection`

#### New Files
- `apps/web/src/components/marketing/TrustedByStrip.tsx` — NEW
  - Marquee strip with 10 professional avatars (doubled for seamless loop)
  - Left/right gradient fade using `from-background`
  - Uses `animate-marquee-setulix` CSS class

- `apps/web/src/app/globals.css` — updated
  - Added `@keyframes marquee-setulix` + `.animate-marquee-setulix` (30s linear infinite)

#### Rules Verified
- TypeScript: 0 errors
- No Hindi text in any UI string
- No dynamic Tailwind class interpolation (`bg-${color}` pattern — never used)
- All icons: lucide-react only, no emojis
- Semantic tokens throughout (bg-background, bg-card, text-foreground, etc.)
- Dark + light theme: all components use Tailwind dark: variants or semantic tokens
- Persona Journey (B9) — not touched

---

## Next Session: B10-B
- Tools showcase section redesign
- How It Works redesign
- Testimonials section redesign (new richer card design using TESTIMONIALS data added in B10-A)
- Final CTA redesign

---

## What Was Done (Session B9)

### B9 — "Real Impact" Personas Section (Marketing Homepage)

#### New Files
- `apps/web/src/data/personas.ts` — NEW
  - TypeScript interfaces: `PersonaTool`, `PersonaStep`, `PersonaStat`, `Persona`
  - 5 persona objects: `hr`, `creator`, `legal`, `sme`, `marketer`
  - Exported: `personas: Persona[]`
- `apps/web/src/components/marketing/PersonaJourney.tsx` — NEW
  - `'use client'` component with Framer Motion tab animations
  - Tab bar: 5 pills (horizontal-scroll on mobile), active = bg-primary
  - AnimatePresence fade+slide (0.2s) on tab switch
  - Section 1 — Hero Strip: avatar initials, name/role/city, kit badge, quote
  - Section 2 — Pain Block: red-tinted card, pain story, chip pills
  - Section 3 — Journey Steps: 4-step strip with numbered circles + chevrons
  - Section 4 — Tool Grid: 2×2 cards with DynamicIcon, stat line, Free badge
  - Section 5 — Stats Row: 2×4 metric cards with before (strikethrough) + after (accent)
  - Section 6 — CTA Block: button → /?auth=signup, note text, SME gets CheckCircle icon
  - Color system: per-persona accent (teal/violet/amber/blue/pink) across all sections
  - Full dark + light theme via Tailwind utility classes

#### Modified Files
- `apps/web/src/app/(marketing)/page.tsx`
  - Added `PersonaJourney` import
  - Placed `<PersonaJourney />` between Features section and Tools Showcase section (with border-t dividers)

---

## What Was Done (Session B8-D-2)

### BUG FIX — Credits page "Buy Credits" link missing pack ID
- `apps/web/src/app/(site)/credits/page.tsx`
  - Changed: `href="/checkout?type=pack"` → `href="/pricing#credit-packs"`
  - User is now taken to the pricing page to select a pack first, then Buy Now navigates with correct `id`
- `apps/web/src/components/pricing/PricingPage.tsx`
  - Added `id="credit-packs"` to the credit packs section div (enables `#credit-packs` hash anchor)

### BUG FIX — Checkout page blank/broken when accessed without pack id
- `apps/web/src/app/(site)/checkout/page.tsx`
  - Added redirect guard: if `type === "pack"` and `id` is missing, immediately `router.replace("/pricing#credit-packs")`
  - Added guard in item-details fetch: skips fetch if `type === "pack" && !id` (prevents 400 error toast)
  - Ensures the order summary never shows empty/broken state

---

## What Was Done (Session B8-D)

### TASK 1 — PaymentGateway Model
- `packages/db/src/models/PaymentGateway.ts` — NEW
  - Fields: slug (enum: cashfree/paygic/razorpay/payu), name, isActive, isDefault, priority, environment, config (apiKey/secretKey/merchantId/webhookSecret/token/tokenGeneratedAt/extraConfig), supports (upi/cards/netbanking/wallets/qr), description, logoUrl, timestamps
- `packages/db/src/index.ts` — added export

### TASK 2 — Seed Script
- `apps/web/src/scripts/seed-gateways.ts` — NEW
  - Seeds 2 gateways: Paygic (isDefault:true, priority:1, production) + Cashfree (isDefault:false, priority:2, sandbox)
  - Run: `MONGODB_URI="$MONGODB_URI" npx tsx apps/web/src/scripts/seed-gateways.ts`

### TASK 3 — Gateway Interface + Types
- `apps/web/src/lib/gateways/types.ts` — NEW
  - Exports: `IGateway`, `CreateOrderParams`, `OrderResult`, `VerifyResult`, `PaymentStatus`, `GatewayConfig`, `GatewayCheckoutPayload`

### TASK 4 — Paygic Gateway
- `apps/web/src/lib/gateways/paygic.ts` — NEW
  - `PaygicGateway implements IGateway`
  - `generateToken()` → POST /api/v3/createMerchantToken
  - `createOrder()` → POST /api/v2/createPaymentRequest → returns UPI intent + QR + app links
  - `verifyPayment()` → POST /api/v2/checkPaymentStatus
  - `verifyWebhook()` → always true (verify via API instead)

### TASK 5 — Cashfree Gateway Refactor
- `apps/web/src/lib/gateways/cashfree.ts` — NEW
  - `CashfreeGateway implements IGateway`
  - Wraps existing Cashfree SDK (constructor pattern: `new Cashfree(env, appId, secretKey)`)
  - `createOrder()`, `verifyPayment()`, `verifyWebhook()` (HMAC-SHA256)

### TASK 6 — Stub Gateways
- `apps/web/src/lib/gateways/razorpay.ts` — NEW (stub, throws "coming soon")
- `apps/web/src/lib/gateways/payu.ts` — NEW (stub, throws "coming soon")

### TASK 7 — Gateway Manager
- `apps/web/src/lib/gateways/manager.ts` — NEW
  - `getActiveGateway()` — fetches default+active gateway from DB, caches in Redis 5min (`SetuLix:active_gateway`)
  - `buildGateway(slug, config)` — factory for all 4 gateways
  - `buildGatewayFromDoc(doc)` — builds from DB document (used in webhook + verify)
  - `invalidateGatewayCache()` — del Redis key
  - `getActiveGatewaySlug()` — lightweight slug-only fetch
  - `getPaygicGateway()` — specific Paygic instance with doc

### TASK 8 — Paygic Token Management API
- `apps/web/src/app/api/admin/gateways/paygic/generate-token/route.ts` — NEW
  - POST, admin auth required
  - Fetches MID + password from DB (fallback: env vars PAYGIC_MID / PAYGIC_PASSWORD)
  - Calls `gateway.generateToken()` → saves to DB + invalidates cache
  - Never returns the token in response

### TASK 9 — create-order API (updated)
- `apps/web/src/app/api/payments/create-order/route.ts` — UPDATED
  - Replaced hardcoded Cashfree with `getActiveGateway()` + `getActiveGatewaySlug()`
  - Passes `callbackUrl: /api/payments/webhook/{gatewaySlug}`
  - Returns all gateway-specific fields: `gatewaySlug`, `paymentSessionId` (Cashfree), `upiIntent`/`phonePeLink`/`paytmLink`/`gpayLink`/`dynamicQR`/`expiresIn` (Paygic)
- `packages/db/src/models/Payment.ts` — UPDATED
  - Added: `gatewaySlug: String (default: 'cashfree')`, `gatewayOrderId: String (default: '')`
  - Changed: `paymentSessionId` from required to `default: ''` (Paygic has no session ID)
  - Changed: `cashfreeOrderId` from required to `default: ''`

### TASK 10 — Per-Gateway Webhook Route
- `apps/web/src/app/api/payments/webhook/[gateway]/route.ts` — NEW
  - Handles both `/webhook/paygic` and `/webhook/cashfree`
  - Paygic: `verifyWebhook` always true → double-verifies via `gateway.verifyPayment()` API
  - Cashfree: HMAC signature check → reject on invalid
  - Idempotent (already-paid orders skip)
  - Old `/api/payments/webhook/route.ts` kept for backward compat

### TASK 11 — Paygic Checkout Modal
- `apps/web/src/components/ui/PaygicCheckoutModal.tsx` — NEW
  - 5-minute countdown timer (green → amber → red)
  - Polls `/api/payments/verify` every 3s
  - Tab UI: Scan QR (shows `dynamicQR` image) | UPI Apps (PhonePe/GPay/Paytm links)
  - States: polling / success / failed / expired
  - Manual "I've completed the payment" check button
  - Blocks backdrop click (user must cancel explicitly)

### TASK 12 — Checkout Page (updated)
- `apps/web/src/app/(site)/checkout/page.tsx` — UPDATED
  - Fetches active gateway on mount: `GET /api/payments/active-gateway`
  - Cashfree JS SDK only initialized when `activeGateway === 'cashfree'`
  - Pay button: Lock icon (Cashfree) or Smartphone icon (Paygic)
  - Trust badge: "Secured by Paygic — UPI Payment" vs "Secured by Cashfree"
  - Paygic response → opens `PaygicCheckoutModal`
  - On success → redirect to `/payment/return?order_id=...`
- `apps/web/src/app/api/payments/active-gateway/route.ts` — NEW
  - GET (no auth), returns `{ gatewaySlug, supports, name }`

### TASK 13 — Verify API (updated)
- `apps/web/src/app/api/payments/verify/route.ts` — UPDATED
  - Uses `payment.gatewaySlug` to find correct gateway doc
  - Calls `buildGatewayFromDoc()` → `gateway.verifyPayment()`
  - Handles `expired` status → marks payment as failed
  - Works for both Paygic and Cashfree

### TASK 14 — Admin Payment Gateways Page
- `apps/web/src/app/api/admin/gateways/route.ts` — NEW
  - GET, admin auth — returns all gateways with masked secrets (last 4 chars visible, secretKey always "••••••••")
- `apps/web/src/app/api/admin/gateways/[slug]/route.ts` — NEW
  - PATCH, admin auth — updates env, config fields, isDefault (clears others), isActive
  - Invalidates Redis cache + logs to audit_log
- `apps/web/src/app/admin/payment-gateways/page.tsx` — NEW
  - 2×2 grid of gateway cards (Paygic, Cashfree, Razorpay stub, PayU stub)
  - Each card: name, DEFAULT badge, active dot, env badge, support tags, MID preview, token status
  - Actions: Configure modal, Set Default, Generate Token (Paygic only), Test Connection
  - Configure modal: per-gateway form fields, show/hide secrets, auto-generated callback URL
  - Coming-soon gateways shown but disabled
- `apps/web/src/app/admin/layout.tsx` — UPDATED
  - Added "Gateways" nav item (Landmark icon) after Payments

### TASK 15 — Gateway Test Connection API
- `apps/web/src/app/api/admin/gateways/[slug]/test/route.ts` — NEW
  - POST, admin auth
  - Paygic: pings `/api/v2/checkPaymentStatus` with test ID → confirms API + token reachability
  - Cashfree: checks if credentials are non-empty
  - Razorpay/PayU: returns "coming soon"

---

## Architecture Notes

### Multi-Gateway Payment Flow
```
Admin → /admin/payment-gateways
  → Configure gateway (MID + secrets) + click Save
  → For Paygic: click Generate Token → token saved to DB
  → Set as Default → Redis cache invalidated

User → /checkout
  → GET /api/payments/active-gateway → gatewaySlug
  → Fill form → click Pay
  → POST /api/payments/create-order
      → getActiveGateway() → DB + Redis cache
      → gateway.createOrder() → gateway API
      → Payment.create({ gatewaySlug, gatewayOrderId })
      → return { gatewaySlug, ...gateway-specific-fields }

  If Cashfree:
    → cashfree.checkout({ paymentSessionId }) → popup
    → Cashfree redirects to /payment/return
    → GET /api/payments/verify → buildGatewayFromDoc → PGFetchOrder

  If Paygic:
    → PaygicCheckoutModal opens (QR + app links)
    → Polls /api/payments/verify every 3s
    → gateway.verifyPayment() → checkPaymentStatus API
    → On success: redirect to /payment/return

Webhook: POST /api/payments/webhook/{gatewaySlug}
  → Paygic: verifyWebhook always true → double-verify via API
  → Cashfree: HMAC signature check
  → processCreditPackPayment OR processPlanPayment
```

### Gateway Cache (Redis)
```
Key: SetuLix:active_gateway
TTL: 300s (5 min)
Invalidated on: any PATCH to gateway config, generate-token
Contains: { slug, config } — config includes live token
```

### New Files (Session B8-D)
```
packages/db/src/models/PaymentGateway.ts
apps/web/src/scripts/seed-gateways.ts
apps/web/src/lib/gateways/types.ts
apps/web/src/lib/gateways/paygic.ts
apps/web/src/lib/gateways/cashfree.ts
apps/web/src/lib/gateways/razorpay.ts (stub)
apps/web/src/lib/gateways/payu.ts (stub)
apps/web/src/lib/gateways/manager.ts
apps/web/src/app/api/admin/gateways/route.ts
apps/web/src/app/api/admin/gateways/[slug]/route.ts
apps/web/src/app/api/admin/gateways/[slug]/test/route.ts
apps/web/src/app/api/admin/gateways/paygic/generate-token/route.ts
apps/web/src/app/api/payments/active-gateway/route.ts
apps/web/src/app/api/payments/webhook/[gateway]/route.ts
apps/web/src/components/ui/PaygicCheckoutModal.tsx
apps/web/src/app/admin/payment-gateways/page.tsx
```

### Modified Files (Session B8-D)
```
packages/db/src/index.ts — added PaymentGateway export
packages/db/src/models/Payment.ts — added gatewaySlug, gatewayOrderId; relaxed required
apps/web/src/app/api/payments/create-order/route.ts — gateway manager
apps/web/src/app/api/payments/verify/route.ts — gateway-aware verify
apps/web/src/app/(site)/checkout/page.tsx — Paygic modal + gateway detection
apps/web/src/app/admin/layout.tsx — added Gateways nav item
```

---

## What Was Done (Session B8-C-2-C)

### TASK 1 — UniversalToolRenderer wired
- `apps/web/src/components/tools/UniversalToolRenderer.tsx` — UPDATED
  - Added `useRef` import, `PresetSelector` + `usePresets` imports
  - `const { presets, isFetched, fetchPresets } = usePresets(slug)` + `defaultLoadedRef`
  - Effect to call `fetchPresets()` once session is ready
  - Effect to auto-load default preset into `formValues` on first fetch
  - `<PresetSelector>` rendered between LoginBanner and form fields (only when `config.type === 'ai'`)
  - `onPresetLoad` merges preset inputs into formValues (filtered to existing keys only)

### TASK 2 — Batch 1 (5 tools) wired
- `blog-generator`, `yt-script`, `jd-generator`, `legal-notice`, `ad-copy`
- Pattern: added `useRef`, `formValues = watch() as unknown as Record<string,string>`, `planSlug` state, `usePresets(slug)`, `defaultLoadedRef`, 3 effects, `<PresetSelector>` before form tag

### TASK 3 — Batch 2 (5 tools) wired
- `linkedin-bio`, `resume-screener`, `appraisal-draft`, `policy-generator`, `nda-generator`
- `linkedin-bio` + `resume-screener`: also added `watch, setValue` to useForm destructuring (previously missing)

### TASK 4 — Batch 3 (10 tools) wired
- `hook-writer`, `caption-generator`, `title-generator`, `email-subject`, `whatsapp-bulk`, `legal-disclaimer`, `seo-auditor`, `offer-letter`, `website-generator`, `thumbnail-ai`
- `seo-auditor`: added `watch, setValue` to useForm destructuring (previously missing)
- `offer-letter`: special useState pattern — `currentInputs` flat Record built from nested state; `onPresetLoad` sets each state individually
- `thumbnail-ai`: PresetSelector placed before the correct form (uses `handleSubmit(generate)`, not `handleSubmit(onSubmit)`)

### TASK 5 — useToolPresets hook created
- `apps/web/src/hooks/useToolPresets.ts` — NEW
  - Wraps `usePresets` with auto-fetch + auto-load default preset logic
  - Props: `toolSlug`, `onDefaultLoad?`
  - Prevents double-load via `defaultLoadedRef`
  - Re-exports full `hookResult` for drop-in use

### TASK 6 — Admin Preset Stats APIs
- `apps/web/src/app/api/admin/presets/stats/route.ts` — NEW
  - GET, admin auth required
  - Aggregates: `totalPresets`, `usersWithPresets`, `topTools` (top 5 by count), `avgPresetsPerUser`
- `apps/web/src/app/api/admin/users/[userId]/presets/route.ts` — NEW
  - GET, admin auth required
  - Returns: `{ totalPresets, byTool: [{ toolSlug, count, hasDefault }] }`

### TASK 7 — Admin Dashboard preset card
- `apps/web/src/app/admin/page.tsx` — UPDATED
  - Added `Preset` import from `@toolhub/db`, `BookOpen` from lucide-react
  - Fetches `totalPresets` in parallel with other dashboard stats
  - New "Saved Presets" stat card (pink accent, BookOpen icon, "across all PRO users" sub)
  - Grid changed from `lg:grid-cols-4` → `lg:grid-cols-5` for 5 cards

### TASK 8 — PDF FREE user fix (verified)
- `apps/web/src/app/api/tools/download-pdf/route.tsx` — No change needed
  - Already allows all plans (no 403 gate for FREE)
  - FREE → `LitePDFTemplate` with `showWatermark={true}`
  - LITE → `LitePDFTemplate` with `showWatermark={false}`
  - PRO+ → `ProPDFTemplate` (branded)
  - UniversalToolRenderer PDF button already enabled for all plans

---

## What Was Done (Session B8-C-2-B)

### TASK 1 — SavePresetModal
- `apps/web/src/components/ui/SavePresetModal.tsx` — NEW
  - Props: isOpen, onClose, onSave, currentInputs, planSlug, presetCount
  - State reset on open (name, error, saving)
  - Escape key closes modal
  - PRO at limit (≥5) → AlertCircle limit state shown instead of form
  - Inputs preview: shows filled fields (max 4 + "+N more")
  - PRO slot counter: "X slot(s) remaining"
  - Validation: empty name → error, >50 chars → error
  - Save → toast.success + onClose on success
  - Saving spinner state on button

### TASK 2 — ManagePresetsModal
- `apps/web/src/components/ui/ManagePresetsModal.tsx` — NEW
  - Props: isOpen, onClose, presets, toolSlug, planSlug, onDelete, onSetDefault, onLoad
  - Empty state: BookOpen icon + message
  - Preset cards: name, date, input preview (3 fields + "+N more")
  - Default preset: `border-primary bg-primary/5` highlight + "default" badge
  - Load button: calls onLoad(preset.inputs) + onClose + toast
  - Star toggle: filled amber when isDefault, outline when not; calls onSetDefault
  - Delete: confirm step (confirmDeleteId) → "Yes, delete" → handleDelete → removed
  - Loading spinners on delete and toggle buttons

### TASK 3 — PresetSelector
- `apps/web/src/components/ui/PresetSelector.tsx` — NEW
  - Props: toolSlug, currentInputs, onPresetLoad, planSlug
  - Uses usePresets hook; fetchPresets() on mount
  - FREE/LITE: dashed locked badge with Lock icon + "/pricing" upgrade link
  - PRO (no presets): only Save button visible
  - PRO (with presets): Load dropdown + Save button + Settings icon
  - Dropdown: opens/closes, closes on outside click (mousedown listener + ref)
  - Preset in dropdown: name + first input preview + "default" label
  - "Manage presets" option in dropdown footer → ManagePresetsModal
  - Save button → SavePresetModal
  - PRO counter: "X/5" (red when at limit)
  - Settings icon → ManagePresetsModal (standalone, when presets exist)

### TASK 4 — Exports
- All 3 components use named `export function` pattern
- Import paths:
  - `@/components/ui/PresetSelector` → `{ PresetSelector }`
  - `@/components/ui/SavePresetModal` → `{ SavePresetModal }`
  - `@/components/ui/ManagePresetsModal` → `{ ManagePresetsModal }`
- No barrel index.ts needed (consistent with existing codebase pattern)

---

---

## What Was Done (Session B8-C-2-A)

### TASK 1 — Preset Model
- `packages/db/src/models/Preset.ts` — NEW
  - Fields: userId (ObjectId ref User), toolSlug, name (max 50), inputs (Mixed), isDefault (default false), timestamps
  - Compound index: `{ userId: 1, toolSlug: 1 }` for fast per-tool lookup
- `packages/db/src/index.ts`: added `export * from "./models/Preset"`

### TASK 2 — Preset List + Create API
- `apps/web/src/app/api/tools/presets/route.ts` — NEW
  - GET: auth required, plan check (403 for free/lite), toolSlug required, returns presets sorted by createdAt desc
  - POST: auth required, plan check (403 for free/lite), validates body, PRO limit = 5 per tool (400 if exceeded), BUSINESS/ENTERPRISE unlimited
  - Creates preset with isDefault: false

### TASK 3 — Preset Update + Delete API
- `apps/web/src/app/api/tools/presets/[id]/route.ts` — NEW
  - PATCH: auth + ownership check (404 if not found/not own), handles isDefault (clears others via updateMany before setting), updates name/inputs with validation
  - DELETE: auth + ownership check, findByIdAndDelete

### TASK 4 — Preset Zustand Store
- `apps/web/src/store/preset-store.ts` — NEW
  - State: `presets: Record<toolSlug, Preset[]>`, `fetchedTools: string[]`, `loading: Record<toolSlug, boolean>`
  - Actions: setPresets, addPreset, updatePreset, removePreset, clearDefaultsForTool, getPresets, getDefaultPreset, isFetched, setLoading, markFetched
  - isFetched prevents duplicate API calls per tool

### TASK 5 — usePresets Hook
- `apps/web/src/hooks/usePresets.ts` — NEW
  - fetchPresets: skips if already fetched, handles 403 (not PRO) gracefully
  - savePreset: POST → store.addPreset on success
  - deletePreset: DELETE → store.removePreset on success
  - setDefaultPreset: PATCH → clearDefaultsForTool + updatePreset on success
  - updatePresetName: PATCH name only → store.updatePreset on success
  - Returns: presets, defaultPreset, loading, isFetched + all action functions

---

---

## What Was Done (Session B8-C-1)

### TASK 1 — PDF Library
- `apps/web/package.json`: added `@react-pdf/renderer@^4.5.1`

### TASK 2 — BusinessProfile Model Extended
- `packages/db/src/models/BusinessProfile.ts` — UPDATED
  - Added interface fields: `logoUrl`, `signatureUrl`, `letterheadColor`, `signatoryName`, `signatoryDesignation`
  - Added schema fields with defaults: `logoUrl: null`, `signatureUrl: null`, `letterheadColor: '#7c3aed'`, `signatoryName: ''`, `signatoryDesignation: ''`

### TASK 3 — Brand Assets APIs
- `apps/web/src/app/api/profile/brand-assets/route.ts` — NEW
  - GET: returns `{ logoUrl, signatureUrl, letterheadColor, signatoryName, signatoryDesignation }`
  - PATCH: updates text fields, invalidates `autofill:{userId}` Redis key
- `apps/web/src/app/api/profile/brand-assets/logo/route.ts` — NEW
  - POST: plan check (403 for free/lite), validates PNG/JPG ≤2MB, uploads to R2 `brand/{userId}/logo.{ext}`, saves `logoUrl`
  - DELETE: removes from R2 + clears `logoUrl`
- `apps/web/src/app/api/profile/brand-assets/signature/route.ts` — NEW
  - POST: plan check (403 for free/lite), validates PNG only ≤1MB, uploads to R2 `brand/{userId}/signature.png`, saves `signatureUrl`
  - DELETE: removes from R2 + clears `signatureUrl`

### TASK 4 — Brand Assets UI (Profile Page)
- `apps/web/src/app/(site)/profile/page.tsx` — UPDATED
  - Added `BrandAssets` interface
  - Fetches plan (`/api/user/plan`) and brand assets on mount in parallel with profile
  - Added Brand Assets section after business fields in Business tab
  - FREE/LITE: locked state with Lock icon + "Upgrade to PRO" button
  - PRO+: Logo upload (dashed area with preview), Signature upload (checkerboard preview), Color picker + hex input (debounced 500ms auto-save), Signatory name + designation inputs + Save button

### TASK 5 — PDF Templates
- `apps/web/src/lib/pdf/templates.tsx` — NEW (server-side only, no 'use client')
  - `LitePDFTemplate`: purple header "SetuLix", tool name, content (line-by-line), footer with page number
  - `ProPDFTemplate`: branded header (logo or biz name), biz address/phone/email, title + divider, content, signature section, branded footer
  - `LitePDFProps` and `ProPDFProps` TypeScript interfaces exported

### TASK 6 — PDF Generation API
- `apps/web/src/app/api/tools/download-pdf/route.tsx` — NEW
  - POST, auth required
  - FREE → 403 "PDF download requires LITE plan"
  - LITE → `LitePDFTemplate` (SetuLix branded)
  - PRO+ → fetches BusinessProfile + User email → `ProPDFTemplate` (business branded)
  - Returns PDF as `application/pdf` with Content-Disposition download header

### TASK 7 — Download PDF Button (UniversalToolRenderer)
- `apps/web/src/components/tools/UniversalToolRenderer.tsx` — UPDATED
  - Fetches plan on mount via `/api/user/plan`
  - PRO+: also fetches brand assets from `/api/profile/brand-assets`
  - Download PDF button in output header (text/json output only):
    - FREE: disabled with Lock icon
    - LITE: enabled, opens PDF preview modal
    - PRO+: enabled, shows "Branded" badge + tooltip

### TASK 8 — PDF Preview Modal
- `apps/web/src/components/ui/PDFPreviewModal.tsx` — NEW
  - Shows A4-like styled preview of PDF before download
  - LITE: purple SetuLix header
  - PRO+: branded header with logo/color, signature preview, signatory details
  - "Download PDF" button → actual PDF download via API → closes modal

### TASK 9 — History Modal PDF Download
- `apps/web/src/components/dashboard/HistoryTable.tsx` — UPDATED
  - Fetches plan on mount
  - History output modal footer: PDF button alongside Copy
  - FREE: disabled with Lock icon
  - LITE+: enabled → downloads PDF from history record

---

---

## What Was Done (Session B8-B)

### TASK 1 — Kit Model
- `packages/db/src/models/Kit.ts` — NEW
  - Fields: slug (unique), name, description, icon, color, order, isActive, showInOnboarding, onboardingLabel, onboardingDescription, onboardingIcon, timestamps
- `packages/db/src/index.ts`: added `export * from "./models/Kit"`

### TASK 2 — Tool Model Extended
- `packages/db/src/models/Tool.ts` — UPDATED
  - Added `IFormField` interface + `FormFieldSchema` (key, label, type, placeholder, required, options[])
  - Added: type ('ai'|'client-side'), kitSlug, kitRef (ObjectId), aiModel, systemPrompt, promptTemplate
  - Added: formFields[], outputType ('text'|'html'|'image'|'json'), outputLabel, color, tags[]
  - Added: maxOutputTokens, temperature, dailyLimit, requiredPlan

### TASK 3 — Seed Script
- `apps/web/src/scripts/seed-kits.ts` — NEW
  - Seeds 5 kits: creator, sme, hr, legal, marketing
  - Updates 20 AI tools with formFields, systemPrompt, promptTemplate, aiModel, outputType
  - Updates 7 client-side tools with type='client-side' + kitSlug
  - Run: `npx ts-node -r tsconfig-paths/register src/scripts/seed-kits.ts`

### TASK 4 — Public Kit APIs
- `apps/web/src/app/api/public/kits/route.ts` — NEW
  - GET (no auth), Redis cache `kits:public` 10 min, returns active kits sorted by order
- `apps/web/src/app/api/public/kits/[slug]/route.ts` — NEW
  - GET (no auth), returns single kit + all tools with that kitSlug

### TASK 5 — Tool Config API (safe)
- `apps/web/src/app/api/tools/[slug]/config/route.ts` — NEW
  - GET (auth required), Redis cache `tool:config:{slug}` 5 min
  - Returns safe fields only — systemPrompt and promptTemplate NEVER exposed to frontend
  - Returns: slug, name, description, icon, color, kitSlug, kitName, creditCost, isActive, type, outputType, outputLabel, formFields, aiModel, dailyLimit, requiredPlan

### TASK 6 — Universal Tool Runner
- `apps/web/src/app/api/tools/run/route.ts` — NEW
  - POST (auth required), handles all dynamically-created AI tools
  - Flow: parse → fetch tool → auth+user → credit cost → credit check → abuse check → validate required fields → build prompt ({{key}} substitution) → call AI → watermark (free users) → deduct credits → CreditTransaction → low credit alert
  - Supports Anthropic, Google Gemini, OpenAI, DALL-E image generation
  - Credits NEVER deducted if AI call fails

### TASK 7 — DynamicIcon Component
- `apps/web/src/components/ui/DynamicIcon.tsx` — NEW
  - Resolves lucide-react icon by string name at runtime
  - Fallback: `Box` icon if name not found

### TASK 8 — UniversalToolRenderer
- `apps/web/src/components/tools/UniversalToolRenderer.tsx` — NEW
  - Client component for dynamically-created AI tools (no dedicated component directory)
  - Fetches config from `/api/tools/{slug}/config` on mount
  - Renders dynamic form fields (text/textarea/select/number) from DB
  - OutputRenderer: handles text, html (iframe+tabs), image, json
  - Error handling: 402 → redirect /pricing, 429 → cooldown timer

### TASK 9 — Dynamic Tool Page Routing
- `apps/web/src/app/(site)/tools/[slug]/page.tsx` — UPDATED
  - Existing tools (27 in toolComponents map) → use their dedicated component (unchanged)
  - New DB tools not in the map → fall through to `<UniversalToolRenderer slug={params.slug} />`

### TASK 10 — DB-Driven Onboarding
- `apps/web/src/app/onboarding/page.tsx` — UPDATED
  - Step 1: fetches kits from `/api/public/kits`, shows 5 skeleton boxes while loading
  - Kit cards use `DynamicIcon` with DB-provided icon names
  - Fallback to FALLBACK_PROFESSION_OPTIONS if API fails
- `apps/web/src/lib/recommendations.ts` — UPDATED
  - Kept sync `getRecommendedTools` (client-safe)
  - Added async `getRecommendedToolsFromDB` for server/API use (scores by kitSlug, challenges, isFree, teamSize)
  - Added async `buildKitNameFromDB` for server/API use
- `apps/web/src/app/api/onboarding/recommendations/route.ts` — UPDATED
  - Now calls `getRecommendedToolsFromDB` (DB-driven, not hardcoded)

### TASK 11 — Admin Kit Management
- `apps/web/src/app/api/admin/kits/route.ts` — NEW: GET (kits + tool count), POST (create kit)
- `apps/web/src/app/api/admin/kits/[slug]/route.ts` — NEW: PATCH (update), DELETE (soft)
- `apps/web/src/app/api/admin/kits/reorder/route.ts` — NEW: PATCH bulk reorder
- `apps/web/src/app/admin/kits/page.tsx` — NEW: kit list with add/edit modal, order arrows, visibility toggle

### TASK 12 — Admin Tool Builder
- `apps/web/src/app/api/admin/tools/route.ts` — NEW: POST creates Tool + ToolConfig together
- `apps/web/src/app/api/admin/tools/[slug]/route.ts` — UPDATED: extended with 15+ new fields
- `apps/web/src/components/admin/ToolBuilder.tsx` — NEW: 4-step modal (basic info → AI config → form builder → settings)
- `apps/web/src/components/admin/AdminToolsClient.tsx` — NEW: client wrapper with "Add New Tool" button
- `apps/web/src/app/admin/tools/page.tsx` — UPDATED: uses AdminToolsClient
- `apps/web/src/app/admin/layout.tsx` — UPDATED: added "Kits" nav item

### TASK 13 — Final Cleanup
- Removed stale TODO(B5-B) comment from `apps/web/src/app/api/onboarding/complete/route.ts`
- Cache invalidation verified: kits:public (kit changes), tool:config:{slug} (tool changes), balance+sidebar (credit ops)
- TypeScript: 0 errors | Build: passing

---

---

## What Was Done (Session B8-A)

### TASK 1 — Cashfree SDK Install
- `apps/web`: installed `cashfree-pg@5.1.3` (backend) + `@cashfreepayments/cashfree-js@1.0.7` (frontend)
- Added `NEXT_PUBLIC_APP_URL=http://localhost:3000` to `apps/web/.env`

### TASK 2 — Cashfree Utility
- `apps/web/src/lib/cashfree.ts` — NEW
  - `createCashfreeOrder()` — creates Cashfree order, returns `{ order_id, payment_session_id, order_status }`
  - `verifyCashfreeOrder()` — fetches order status from Cashfree
  - `verifyCashfreeWebhook()` — HMAC-SHA256 signature verification
  - Cashfree instance: `new Cashfree(CFEnvironment.SANDBOX|PRODUCTION, appId, secretKey)`
- `apps/web/src/types/cashfree-js.d.ts` — NEW: type declarations for `@cashfreepayments/cashfree-js`

### TASK 3 — Payment Model
- `packages/db/src/models/Payment.ts` — NEW
  - Fields: userId, orderId (unique), cashfreeOrderId, type (credit_pack|plan)
  - Credit pack: packId, credits
  - Plan: planSlug, billingCycle
  - Amounts: amount (subtotal), gstAmount, totalAmount, currency (INR)
  - Status: created | paid | failed | cancelled (default: created)
  - Cashfree: paymentSessionId, cashfreePaymentId, paymentMethod
  - Invoice: invoiceNumber (generated after payment)
  - billingSnapshot (stored at time of payment)
- `packages/db/src/index.ts`: added `export * from "./models/Payment"`

### TASK 4 — Order ID Generator
- `apps/web/src/lib/order-id.ts` — NEW
  - `generateOrderId()` → format: `SLX-YYYYMMDD-XXXXXXXX` (e.g. `SLX-20260514-A3B7X9K2`)

### TASK 5 — Create Order API
- `apps/web/src/app/api/payments/create-order/route.ts` — NEW
  - POST, auth required
  - Accepts: type=credit_pack (packId) or type=plan (planSlug + billingCycle)
  - Validates billing details with Zod
  - Fetches item details from DB (CreditPack or Plan)
  - Calculates GST 18%, totalAmount
  - Optionally upserts BillingProfile
  - Creates Cashfree order → saves Payment doc
  - Returns: `{ orderId, paymentSessionId }`

### TASK 6 — Webhook Handler
- `apps/web/src/lib/payment-processor.ts` — NEW (shared logic for webhook + verify)
  - `processCreditPackPayment(payment)` — adds credits, CreditTransaction, Redis invalidate, invoice, notification, email
  - `processPlanPayment(payment)` — sets user.plan + planExpiry, UserSubscription, CreditTransaction, Redis invalidate, invoice, notification, email
- `apps/web/src/app/api/payments/webhook/route.ts` — NEW
  - POST, no auth (Cashfree webhook)
  - Reads raw body, verifies HMAC-SHA256 signature
  - Handles `PAYMENT_SUCCESS_WEBHOOK` only
  - Idempotent: already-paid orders return 200 without reprocessing
  - Never throws — returns 500 on error (Cashfree retries on non-200)

### TASK 7 — Payment Return Page + Verify API
- `apps/web/src/app/api/payments/verify/route.ts` — NEW
  - GET, auth required
  - Security: finds payment by orderId AND userId (prevents cross-user access)
  - If payment.status='created': checks Cashfree directly, processes if PAID (webhook delay fallback)
  - Returns: `{ status: paid|pending|failed|not_found, type, credits }`
- `apps/web/src/app/(site)/payment/return/page.tsx` — NEW
  - 4 states: loading (Loader2), paid (CheckCircle), pending (Clock + auto-retry every 3s, max 5), failed (XCircle), not_found (AlertCircle)
  - Pending auto-retry: max 5 retries, then shows manual "Check Status" button
- `apps/web/src/middleware.ts`: added `/payment` to APP_ROUTES

### TASK 8 — Checkout Page Live Integration
- `apps/web/src/app/(site)/checkout/page.tsx` — UPDATED
  - Imports `@cashfreepayments/cashfree-js` dynamically
  - Initializes Cashfree JS on mount: `load({ mode: 'sandbox' })`
  - `handlePayment()`: validates form → calls `/api/payments/create-order` → calls `cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' })`
  - Pay button: active when cashfree loaded + item loaded; shows loading spinner during processing
  - Error display: red text below pay button
  - Trust badges: "Secured by Cashfree" / "256-bit SSL" / "Money-back on failed payments"

### TASK 9 — Plan Expiry + Renewal Reminder Cron
- `packages/db/src/models/User.ts` — UPDATED
  - Added: `planExpiry: Date | null` (default null)
  - Added: `renewalReminderSent: boolean` (default false)
- `apps/web/src/auth.ts` — UPDATED
  - JWT callback: after every token refresh, checks if `user.planExpiry < now`
  - If expired: resets `plan → 'free'`, `planExpiry → null`, invalidates `plan:{id}` + `sidebar:{id}` Redis keys
- `apps/web/src/lib/email/templates.ts` — UPDATED
  - Added `renewalReminderEmail({ name, planName, daysLeft })` template
- `apps/web/src/app/api/cron/renewal-reminder/route.ts` — NEW
  - GET, secured by `Authorization: Bearer {CRON_SECRET}`
  - Finds users: plan !== free, planExpiry ≤ 7 days from now, > now, renewalReminderSent = false
  - Sends renewal reminder email, sets renewalReminderSent=true
- `vercel.json` — UPDATED
  - Added cron: `0 3 * * *` for `/api/cron/renewal-reminder` (daily at 03:00 UTC)

### TASK 10 — Admin Payments Page
- `apps/web/src/app/api/admin/payments/route.ts` — NEW
  - GET, admin auth required
  - Filters by status (all/paid/failed/created/cancelled), page, limit=20
  - Aggregates: totalRevenue, todayRevenue, totalTransactions, successRate
  - Populates userId with name+email
- `apps/web/src/app/admin/payments/page.tsx` — NEW
  - 4 stat cards: Total Revenue | Today's Revenue | Transactions | Success Rate
  - Filter tabs: All | Paid | Failed | Pending | Cancelled
  - Table: Order ID | User | Type | Amount | Status | Date | Invoice | Details
  - Expandable detail row: billing snapshot, CF payment ID, payment method, credits added
  - Pagination
- `apps/web/src/app/admin/layout.tsx` — UPDATED
  - Added "Payments" nav item (Receipt icon) between Referrals and Notifications

---

## Architecture Notes

### Cashfree Payment Flow
```
User fills checkout form
  → POST /api/payments/create-order
      → Fetch item (CreditPack or Plan) from DB
      → Calculate GST 18%
      → createCashfreeOrder() → Cashfree API
      → Payment.create({ status: 'created', paymentSessionId })
      → Return { orderId, paymentSessionId }
  → cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' })
      → Cashfree popup opens
      → User pays
      → Cashfree redirects to /payment/return?order_id=SLX-...
          → GET /api/payments/verify → checks DB + Cashfree
          → If paid: show success page
      → Cashfree webhook: POST /api/payments/webhook
          → verifyCashfreeWebhook() HMAC check
          → processCreditPackPayment OR processPlanPayment
          → Credits added, invoice generated, email sent
```

### Plan Expiry Flow
```
Plan purchased → User.planExpiry = now + 30/365 days
NextAuth jwt callback → every token refresh:
  if user.planExpiry < now && plan !== 'free':
    → reset plan='free', planExpiry=null
    → invalidate Redis plan:{id} + sidebar:{id}
Cron renewal-reminder (daily 03:00 UTC):
  → find expiring plans (within 7 days, not yet reminded)
  → sendEmail(renewalReminderEmail)
  → set renewalReminderSent=true
  → reset on plan renewal
```

### New Redis Keys (B8-A)
```
None new — existing keys invalidated:
  balance:{userId}    — after credit purchase
  sidebar:{userId}    — after credit purchase or plan change
  plan:{userId}       — after plan change or expiry
```

### New Collections (B8-A)
```
payments  — Payment docs (orderId unique index, userId index)
```

### Cashfree Test Credentials (Sandbox)
```
Card: 4111 1111 1111 1111
Expiry: Any future (e.g. 12/26)
CVV: Any 3 digits (e.g. 123)
OTP: 123456
```

---

## What Was Done (Session B7-B)
[See previous HANDOFF for B7-B details — Watermark, history limits, credit ledger, plan widget, account delete, rollover, email system, checkout]

---

## Issues
None. TypeScript: 0 errors.
