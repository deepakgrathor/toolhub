# Handoff Note
Updated: 2026-05-14 | Account: B | Session: B9 | Features: "Real Impact" Personas Section on marketing homepage

## Where We Are
Session B9 done. Persona Journey section built and integrated. **TypeScript: 0 errors (apps/web).**
Note: `npx turbo build` fails with pre-existing `Cannot find module for page: /_document` error (not caused by any recent changes).

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
