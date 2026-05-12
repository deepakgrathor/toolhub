# Handoff Note
Updated: 2026-05-13 | Account: B | Session: B5-B | Notification Center + Admin Push

## Where We Are
Session B5-B done. **TypeScript: 0 errors.** Committed to master.

---

## What Was Done (Session B5-A)

### Refer & Earn System (B5-A)

**New DB Models:**
- `packages/db/src/models/Referral.ts` — `referrals` collection: referrerId, referredId, refCode, status (pending/completed/suspicious), referrerCredit, referredCredit, signupIP, completedAt
- `packages/db/src/models/Notification.ts` — `notifications` collection: userId, type, title, message, isRead, meta; max 10 per user (oldest pruned)

**User model** (`packages/db/src/models/User.ts`):
- Added `welcomeCreditGiven: Boolean default false`

**CreditTransaction** enum extended with: `referral_reward`, `welcome_bonus`

**Signup flow** (`apps/web/src/app/api/auth/signup/route.ts`):
- New users start with 0 credits (credits given at onboarding complete)
- If `ref` cookie present: creates Referral doc with status=pending instead of immediately crediting
- Self-referral block (referrer._id === newUserId → silently ignored)
- Anti-spam: 5+ signups from same IP with same refCode in 1 hour → status='suspicious'

**Onboarding complete** (`apps/web/src/app/api/onboarding/complete/route.ts`):
- If pending Referral exists: credits both referred user (+10) and referrer (+10), marks referral completed, sends notifications to both
- If no referral: gives welcome bonus (+10) once (welcomeCreditGiven guard)
- Invalidates `balance:{userId}` Redis cache for both users

**Notification helper** (`apps/web/src/lib/notifications.ts`):
- `createNotification({ userId, type, title, message, meta? })`
- Prunes to max 10 notifications per user after each insert

**Referral cookie capture** (`apps/web/src/app/api/referral/capture/route.ts`):
- GET /api/referral/capture?ref=CODE → sets `ref` httpOnly cookie, 30-day TTL
- Middleware also sets this cookie directly for ?ref= URLs

**Refer page** (`apps/web/src/app/(site)/refer/page.tsx`):
- Shows refLink (setulix.com?ref=CODE), copy button
- Stats: Total Referrals | Successful | Credits Earned
- Recent referrals list with partial names + status badge
- Data from GET /api/user/referrals

**Admin referrals panel** (`apps/web/src/app/admin/referrals/page.tsx`):
- Table: Referrer | Referred User | Status | Date | Actions
- Filter by: all / pending / completed / suspicious
- Suspicious rows highlighted in amber
- Approve action: releases credits to both + marks completed
- Reject action: deletes referral doc
- APIs: GET /api/admin/referrals, POST /api/admin/referrals/[id]/approve, POST /api/admin/referrals/[id]/reject

**Admin sidebar** updated with Referrals link (Gift icon)

**App sidebar** Refer & Earn button now navigates to `/refer` page

**Middleware** updated: `/refer` added to APP_ROUTES, `/api/referral` added to always-public prefixes

---

---

## What Was Done (Session B5-B)

### Notification Center + Admin Push System

**Notifications API (User):**
- `GET /api/user/notifications` — fetch 10 newest, returns `{ notifications, unreadCount }`
- `PATCH /api/user/notifications` — mark all as read
- `PATCH /api/user/notifications/[id]` — mark single as read

**Zustand Notification Store** (`apps/web/src/store/notification-store.ts`):
- `useNotificationStore` — `notifications`, `unreadCount`, `setNotifications`, `markRead`, `markAllRead`, `addNotification`

**NotificationBell Component** (`apps/web/src/components/ui/NotificationBell.tsx`):
- Polls `GET /api/user/notifications` on mount + every 30s
- Bell icon with purple badge (count ≤9 shows number, >9 shows "9+")
- Framer Motion animated dropdown (320px wide, max-h 400px scrollable)
- Header: "Notifications" + "Mark all read" (visible when unread > 0)
- Each item: type icon + title + message (2-line clamp) + relative time
- Unread: `bg-accent/5 border-l-2 border-primary` highlight
- Icon map: `referral_joined`→UserPlus(green), `credit_added`→Coins(purple), `purchase_success`→ShoppingBag(blue), `admin_push`→Megaphone(orange)
- Empty state: BellOff icon + "No notifications yet"
- Click outside closes dropdown

**Navbar** (`apps/web/src/components/layout/Navbar.tsx`):
- `<NotificationBell />` added between credits badge and theme toggle (authenticated users only)

**Purchase notification TODO:**
- Payment webhook doesn't exist yet — TODO comment added in `api/onboarding/complete/route.ts`
- When Razorpay/Cashfree webhook is built at `apps/web/src/app/api/payments/webhook/route.ts`, call `createNotification({ type: 'purchase_success', ... })` on successful payment

**Admin Push Notification APIs:**
- `POST /api/admin/notifications/push` — admin auth required
  - `target: 'all'` → batch `insertMany` all user docs (best-effort, ordered:false)
  - `target: 'specific'` → lookup by email, create single notification
  - Returns `{ success: true, sent: number }`
- `GET /api/admin/notifications/recent` — last 20 `admin_push` notifications

**Admin Notifications Page** (`apps/web/src/app/admin/notifications/page.tsx`):
- Section 1: Send form — target radio (All Users / Specific User), email input (conditional), title (max 60), message textarea (max 200), send button with loading state + success/error feedback
- Section 2: Recent Pushes table — Target (userId suffix), Title, Message, Sent At columns

**Admin Sidebar** (`apps/web/src/app/admin/layout.tsx`):
- Added "Notifications" link (Megaphone icon) between Referrals and Audit Log

---

## What Was Done (Session B2)

### Smart Autofill System

**New file** `apps/web/src/lib/autofill.ts`:
- `AutofillData` type: `businessName, email, phone, address, gstNumber, gstState, ownerName` (all nullable strings).

**New API** `apps/web/src/app/api/user/autofill/route.ts`:
- GET, auth required.
- Fetches User (name, email) + BusinessProfile for current user.
- Merges into `AutofillData` shape (businessAddress → address).
- Redis cache: key `autofill:{userId}`, TTL 30 minutes.
- Returns `{ data: AutofillData }`.

**New hook** `apps/web/src/hooks/useAutofill.ts`:
- Module-level cache (`_cache`, `_fetching`, `_callbacks`) prevents multiple API calls per page.
- Per-user cache invalidation when session userId changes.
- Returns `{ data: AutofillData | null, isLoading: boolean }`.
- If unauthenticated: returns `{ data: null, isLoading: false }` immediately.

**New component** `apps/web/src/components/ui/SmartInput.tsx`:
- `field: keyof AutofillData` — which autofill field to suggest.
- On focus: if profile value exists → shows animated dropdown (Framer Motion).
- Dropdown: Row 1 = profile suggestion (Building2 icon + click to fill), Row 2 = "Use a different value" (Plus icon), Row 3 = temp input with CheckCheck confirm.
- Temp value is session-only, never written to DB.
- Close on: outside click, Escape key, after selection.
- No dropdown if no profile value (normal input behavior).

**Cache invalidation** in profile PATCH routes:
- `apps/web/src/app/api/profile/personal/route.ts` → deletes `autofill:{userId}` from Redis after update.
- `apps/web/src/app/api/profile/business/route.ts` → same.

**Applied SmartInput to 8 tools:**

| Tool | Fields |
|------|--------|
| gst-invoice | seller.name→businessName, seller.gstin→gstNumber, seller.state→gstState, seller.address→address |
| quotation-generator | from.company→businessName, from.address→address, from.phone→phone, from.email→email |
| legal-notice | senderName→businessName, senderAddress→address (via Controller) |
| nda-generator | partyAName→businessName, partyAAddress→address (via Controller) |
| offer-letter | company.name→businessName, company.address→address |
| salary-slip | company.name→businessName, company.address→address |
| policy-generator | companyName→businessName (via Controller) |
| linkedin-bio | name→ownerName (via Controller) |

Notes:
- appraisal-draft, whatsapp-bulk, jd-generator: no matching form fields for the specified autofill fields — skipped, forms unchanged.
- RHF tools use `Controller` from react-hook-form for proper field registration + validation.
- gst-invoice: gstState was a `<select>` — replaced with SmartInput text input.
- address fields (was `<textarea>`) → SmartInput (text input). Form logic and submission unaffected.

---

---

## What Was Done (Session B5)

### FIX 1 — Onboarding Step 4 Redirect
**Problem:** After clicking Launch, API returned success but page reloaded back to step 4 because `router.push('/dashboard')` issued a client-side navigation while the JWE cookie update from `await update()` hadn't propagated to the browser cookie store yet.

**Fix:** Replaced `router.push('/dashboard')` with `window.location.href = '/dashboard'`. The full page reload guarantees the browser sends the updated JWE cookie with the navigation request, so middleware sees `onboardingCompleted: true`.

---

### IMPLEMENT 3 — Multi-select Profession

**User model** (`packages/db/src/models/User.ts`):
- Added `professions: [String]` field (enum, default `[]`).
- Legacy `profession: String` kept for backwards compat.

**Onboarding page** (`apps/web/src/app/onboarding/page.tsx`):
- Step 1 now multi-select: clicking a card toggles it in/out of `professions[]` array.
- Selected cards show purple border + checkmark (same visual style, now toggles).
- Kit name auto-generated via `buildKitName()` from `recommendations.ts`.
- Minimum 1 profession required to Continue.

**API** (`api/onboarding/complete`):
- Accepts `professions: string[]` (falls back to `[profession]` for legacy clients).
- Saves both `professions` (array) and `profession` (first item) to user.

---

### IMPLEMENT 4 — Smart Recommendation Engine

**New file** `apps/web/src/lib/recommendations.ts`:
- `getRecommendedTools({ professions, teamSize, challenge })` — scores all 27 tools.
  - +30 if tool kit matches any selected profession kit
  - +20 if tool tags match challenge keyword
  - +15 if tool is free (lower barrier)
- `buildKitName(firstName, professions)` — generates kit name:
  - 1 profession → "Deepak Creator Pro Kit"
  - 2 professions → "Deepak Creator & Business Kit"
  - 3+ → "Deepak All-In-One Kit"

**API** (`api/onboarding/recommendations` — GET):
- Query params: `professions` (repeatable), `teamSize`, `challenge`.
- Returns scored tool list.

**Onboarding complete API** uses recommendation engine instead of hardcoded `PROFESSION_TOOLS`.

---

### IMPLEMENT 5 — Workspace Zustand Store + Instant Explore Sync

**New file** `apps/web/src/store/workspace-store.ts`:
- `useWorkspaceStore` — Zustand store: `kitName`, `professions`, `kitTools`, `addedTools`, `initialized`.
- `setWorkspace(data)` — populate on mount.
- `addTool(tool)` / `removeTool(slug)` — called from explore page on add/remove.

**Explore page** (`apps/web/src/app/(site)/explore/page.tsx`):
- On add: calls `addTool({ slug, name })` → sidebar updates instantly (no refresh).
- On remove: calls `removeTool(slug)` → sidebar updates instantly.

**Sidebar** loads workspace once via `useWorkspaceInit()` hook and reads reactively from `useWorkspaceStore`.

---

### IMPLEMENT 6 — Sidebar Redesign

New visual hierarchy in `Sidebar.tsx`:

```
Dashboard
Explore Tools
────────────
MY KIT               ← section label (10px uppercase)
┌─ Deepak Creator Pro Kit ─┐  ← kit header (bg-accent/5, border-accent/20)
└──────────────────────────┘
  pl-6 indented tools with border-l-2

MY TOOLS             ← section label
┌─ My Added Tools ──────────┐  ← added header (bg-muted/50, border-border)
└──────────────────────────┘
  pl-6 indented added tools
```

- Active tool: `text-primary font-medium border-l-primary` + left indicator bar.
- Loading skeleton (4 pulse bars) while `initialized = false`.
- Collapsed mode: icons only, no section headers.

---

## Architecture Notes (Updated)

### Workspace Data Flow
```
Mount → useWorkspaceInit() → GET /api/user/workspace
                           → setWorkspace(data) → store initialized

Explore Add → POST /api/explore/add
           → addTool({ slug, name }) → sidebar re-renders instantly

Explore Remove → DELETE /api/explore/remove
              → removeTool(slug) → sidebar re-renders instantly
```

### Profession → Kit → Tools mapping
- `professions[]` on user (new, multi-value)
- `profession` on user (legacy, = professions[0])
- Workspace API merges kit tools from ALL selected professions (de-duped)

---

## Previous Sessions

### Session B4 — HKDF Fix (Real Root Cause)
Fixed Auth.js v5 JWE key derivation: 64-byte HKDF key, salt = cookie name, info = "Auth.js Generated Encryption Key (${cookieName})". Eliminated infinite reload loop on production.

### Session B2 — Marketing Pages + Auth
Moved public pages to `(marketing)` route group, fixed Start Free button, fixed sidebar personalization, fixed dashboard auth gate, fixed auth modal light theme.

---

## Issues
None. TypeScript: 0 errors.
