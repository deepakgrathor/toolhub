# Handoff Note
Updated: 2026-05-14 | Account: B | Session: B8-B | Features: Dynamic Kit/Tool System

## Where We Are
Session B8-B done. **TypeScript: 0 errors. Build: passing.** Committed to main.

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
