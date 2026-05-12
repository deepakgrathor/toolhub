# Handoff Note
Updated: 2026-05-13 | Account: B | Session: B4 | Dynamic Pricing + Subscription Plans

## Where We Are
Session B4 done. **TypeScript: 0 errors.** Committed to master.

---

## What Was Done (Session B4)

### Dynamic Pricing + Subscription Plans System

**New DB Models:**
- `packages/db/src/models/Plan.ts` — `plans` collection: name, slug, tagline, isActive, isPopular, order, type (free/credit/enterprise), pricing.monthly/yearly (basePrice, pricePerCredit, baseCredits, maxCredits), features[], creditRollover, limits
- `packages/db/src/models/UserSubscription.ts` — `usersubscriptions` collection: userId, planSlug, billingCycle, creditsSelected, status, currentPeriodStart/End, cashfreeOrderId/SubId, autoRenew

**Updated DB Models:**
- `packages/db/src/models/CreditPack.ts` — renamed fields: priceInr→price, isFeatured→isPopular, sortOrder→order; added pricePerCredit field
- `packages/db/src/index.ts` — exports Plan + UserSubscription

**Updated shared types (`packages/shared/src/types/index.ts`):**
- CreditPack interface: priceInr→price, isFeatured→isPopular, sortOrder→order, added pricePerCredit

**Updated seed (`packages/db/src/seed.ts`):**
- CreditPack seed updated to use new field names (3 packs: Basic 100cr ₹149, Popular 300cr ₹399, Pro 700cr ₹899)

**New seed script:** `apps/web/src/scripts/seed-plans.ts`
- Run: `MONGODB_URI="..." npx tsx apps/web/src/scripts/seed-plans.ts`
- Upserts 4 plans (FREE, STARTER, PRO, ENTERPRISE) + 3 credit packs
- Uses upsert by slug / name so safe to re-run

**Public API Routes (no auth):**
- `GET /api/public/plans` — replaced: now queries Plan model, returns plans sorted by order, includes computed yearlySavings; Redis cache key=plans:public TTL=10min
- `GET /api/public/credit-packs` — new; returns active CreditPack docs sorted by order; Redis cache key=credit-packs:public TTL=10min
- `GET /api/public/site-config/rollover` — new; returns {enabled, maxDays}; reads SiteConfig keys credit_rollover_enabled/credit_rollover_days; Redis cache key=site-config:rollover TTL=5min

**Admin Plan APIs:**
- `PATCH /api/admin/plans/[slug]` — updates plan in DB, invalidates plans:public Redis key, writes audit_log

**Admin Credit Pack APIs (new routes, replaces old pricing routes functionally):**
- `POST /api/admin/credit-packs` — create pack
- `PATCH /api/admin/credit-packs/[id]` — update pack, invalidates credit-packs:public
- `DELETE /api/admin/credit-packs/[id]` — delete pack

**Updated existing APIs (CreditPack field name changes):**
- `apps/web/src/app/api/admin/pricing/route.ts` — field names updated
- `apps/web/src/app/api/admin/pricing/[id]/route.ts` — field names updated
- `apps/web/src/app/api/credits/packs/route.ts` — sortOrder→order
- `apps/web/src/app/api/credits/purchase/route.ts` — priceInr→price
- `apps/web/src/components/credits/BuyCreditsButton.tsx` — interface updated

**Admin Settings:**
- `PATCH /api/admin/settings` — now also accepts credit_rollover_enabled (Boolean) + credit_rollover_days (Number); invalidates site-config:rollover Redis key on change
- `apps/web/src/components/admin/SettingsForm.tsx` — added Credit Rollover section: toggle + days input (visible when enabled)
- `apps/web/src/app/admin/settings/page.tsx` — fetches and passes rollover settings to form

**Admin Pages:**
- `apps/web/src/app/admin/plans/page.tsx` — table of 4 plans with Edit modal (all pricing fields + features add/remove/toggle)
- `apps/web/src/components/admin/PlansTable.tsx` — edit modal with monthly/yearly pricing fields, features list management
- `apps/web/src/app/admin/credit-packs/page.tsx` — credit packs CRUD using updated PricingTable component
- `apps/web/src/components/admin/PricingTable.tsx` — updated field names (price, isPopular, order, pricePerCredit)
- `apps/web/src/app/admin/pricing/page.tsx` — now redirects to /admin/credit-packs

**Admin Sidebar (`apps/web/src/app/admin/layout.tsx`):**
- Removed: "Pricing" → /admin/pricing
- Added: "Plans" (CreditCard icon) → /admin/plans
- Added: "Credit Packs" (Package icon) → /admin/credit-packs

**Shared PricingPage Component (`apps/web/src/components/pricing/PricingPage.tsx`):**
- Monthly/Yearly toggle pill
- Yearly savings banner (shown when yearly selected)
- 4 plan cards: FREE (₹0/forever), STARTER (slider), PRO (slider, Best Value badge), ENTERPRISE (contact sales mailto)
- Credit slider for STARTER + PRO: min=baseCredits, max=maxCredits, step=50; real-time price calculation
- Crossed-out monthly price + green Save badge when yearly selected
- Feature list per plan (included: Check/X icon; highlight: bold accent text)
- Credit rollover info line (shown only when rollover.enabled)
- Credit packs section (3 pack cards with "Coming Soon" buy buttons)
- All subscription buttons disabled with tooltip "Payments coming soon"
- Both dark + light theme supported

**Pricing Pages:**
- `apps/web/src/app/(marketing)/pricing/page.tsx` — server component, fetches from public APIs, passes to PricingPage component (replaces old hardcoded page)
- `apps/web/src/app/(site)/pricing/page.tsx` — new; same server component pattern for app users with sidebar

---

## What Was Done (Session B5-B)

### Notification Center + Admin Push System

[See previous HANDOFF for B5-B details]

---

## What Was Done (Session B5-A)

### Refer & Earn System (B5-A)

[See previous HANDOFF for B5-A details]

---

## What Was Done (Session B2)

### Smart Autofill System

[See previous HANDOFF for B2 details]

---

## Architecture Notes

### Pricing Data Flow
```
Admin edits plan → PATCH /api/admin/plans/[slug]
                 → DB updated
                 → Redis key plans:public deleted
                 → Next fetch from /api/public/plans hits DB, re-caches

Marketing /pricing → GET /api/public/plans (server)
                   → GET /api/public/credit-packs (server)
                   → GET /api/public/site-config/rollover (server)
                   → PricingPage component (client, handles toggle/slider)

App /pricing → same 3 API calls → same PricingPage component
```

### Credit Rollover
- Stored in SiteConfig as two keys: `credit_rollover_enabled` and `credit_rollover_days`
- Shown on /pricing page only when enabled
- Admin controls via /admin/settings → Credit Rollover section

### CreditPack Field Mapping (OLD → NEW)
- priceInr → price
- isFeatured → isPopular
- sortOrder → order
- razorpayPlanId → (removed)
- (new) pricePerCredit

### Payments
- No Cashfree checkout in B4. All subscription + pack buy buttons show "Coming Soon".
- Cashfree integration planned for B6/B7.

---

## Issues
None. TypeScript: 0 errors.
