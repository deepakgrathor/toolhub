# Handoff Note
Updated: 2026-05-13 | Account: B | Session: #4 | HKDF Fix (Real Root Cause)

## Where We Are
Session B4 done. **TypeScript: 0 errors.** Committed to main.

---

## What Was Fixed (Session B4)

### FIX 8 — Infinite Reload Loop (Real Root Cause)
**Problem:** After Google login, user still stuck in reload loop on production (`setulix.com`). Session B3 fix was incomplete.

**Root cause confirmed by reading `@auth/core/src/jwt.ts` (v5.0.0-beta.31):**
Auth.js v5 `getDerivedEncryptionKey` for `A256CBC-HS512`:
1. **Key length = 64 bytes (512 bits)** — B3 fix used 256 bits (32 bytes) ← WRONG
2. **HKDF salt = cookie name** (`"__Secure-authjs.session-token"` on prod) — B3 used empty Uint8Array ← WRONG
3. **HKDF info = `"Auth.js Generated Encryption Key (${cookieName})"`** — B3 used info string without cookie name ← WRONG

All three parameters wrong → derived key never matched → `jwtDecrypt` always threw → middleware returned `null` → redirected to `/` → marketing homepage `auth()` properly decrypted JWE → saw valid session → redirected to `/dashboard` → middleware → loop.

**Fix (`apps/web/src/middleware.ts`):**
- `deriveAuthKey(secret, cookieName)` — now takes cookie name as second arg
- HKDF salt: `te.encode(cookieName)` (cookie name string encoded as bytes)
- HKDF info: `te.encode("Auth.js Generated Encryption Key (${cookieName})")`
- `deriveBits(..., 512)` — 64 bytes for A256CBC-HS512
- `getSessionPayload` determines correct cookie name (prefers `__Secure-authjs.session-token` on HTTPS)
- `jwtDecrypt` now passes explicit `keyManagementAlgorithms: ["dir"]` + `contentEncryptionAlgorithms: ["A256CBC-HS512", "A256GCM"]`

---

---

## What Was Fixed (Session B2)

### FIX 1 — Marketing Pages Routing
**Problem:** Navbar links (Tools, Pricing, About, Kits) routed into `(site)` layout with sidebar — wrong for unauthenticated visitors.

**Fix:** Moved all public pages from `(site)` to `(marketing)` route group (no sidebar):
- Deleted: `(site)/about`, `(site)/pricing`, `(site)/tools`, `(site)/kits/*` (5 individual pages)
- Created: `(marketing)/pricing/page.tsx` — client component, fetches from `/api/public/plans`
- Created: `(marketing)/about/page.tsx` + `AboutCTA.tsx` client component
- Created: `(marketing)/tools/page.tsx` — tools showcase with kit filter + search, auth modal on click
- Created: `(marketing)/kits/[slug]/page.tsx` — dynamic kit page (all 5 kits in one route) + `KitCTAButtons.tsx`

**Marketing Navbar hrefs were already correct** (`/tools`, `/pricing`, `/about`) — just needed pages in right route group.

### FIX 2 — "Start Free" Button
**Problem:** Hero CTA used `<Link href="/api/auth/signin">` — opened Google OAuth directly.

**Fix:** Created `components/marketing/HeroCTA.tsx` with `HeroCTA`, `FinalCTA`, `ToolCardClick` client components. All use `useAuthStore.openAuthModal("signup")`. Marketing homepage tool cards also open auth modal instead of linking to `/tools/[slug]`.

### FIX 3 — Onboarding After Google Signup
**Problem:** JWT cookie retained `onboardingCompleted: false` even after onboarding complete — caused redirect loop. `window.location.href` reload didn't refresh JWT.

**Fix:**
- `auth.ts`: Added `trigger === 'update'` handling in JWT callback — session can be updated without re-login
- `onboarding/page.tsx`: Uses `const { update } = useSession()` → calls `await update({ onboardingCompleted: true })` before `router.push('/dashboard')` — JWT cookie updated in-place

### FIX 4 — Sidebar Personalization
**Problem:** Sidebar showed all 5 kits hardcoded, not personalized.

**Fix:**
- Created `GET /api/user/workspace` — returns user's `kitName`, `profession`, `kitTools` (from their kit), `addedTools` (from selectedTools not in kit). Redis-cached 5min.
- `Sidebar.tsx`: Fetches workspace on mount, shows personalized view with "My Kit" section + "My Added Tools" section. Falls back to full kits view while loading or if fetch fails.
- Cache invalidated on onboarding complete.

### FIX 5 — Dashboard Accessible Without Login
**Problem:** Middleware didn't protect `/dashboard`, `/profile`, `/explore`, `/history` from unauthenticated access.

**Fix:** Replaced `middleware.ts` with clean version:
- APP_ROUTES check: no session → redirect to `/`
- Onboarding gate: only for app routes (not public pages)
- `/about`, `/pricing`, `/tools`, `/kits` added to always-public list
- Admin routes unchanged (separate `setulix_admin` cookie)

### FIX 6 — Auth Modal in Light Theme
**Problem:** `AuthModal.tsx` used `bg-[#111111]` hardcoded dark background.

**Fix:** 
- `bg-[#111111]` → `bg-card`
- Password strength bar `bg-white/10` → `bg-muted`
- Mode tab container `bg-background` → `bg-muted`

### Additional
- Created `GET /api/public/plans` — returns active credit packs, Redis-cached 10min
- Created `GET /api/public/tools` — returns visible tools, Redis-cached 5min
- Fixed `(site)/layout.tsx` sidebar import casing (`sidebar` → `Sidebar`)
- `api/onboarding/complete`: now returns `{ success: true, updateSession: true }`

---

## Architecture Notes (Updated)

### Route Groups (final)
```
app/
  (marketing)/          ← public pages (no sidebar, MarketingNavbar)
    layout.tsx          ← MarketingNavbar only
    page.tsx            ← marketing homepage (redirects logged-in to /dashboard)
    pricing/            ← public pricing (client component, fetches /api/public/plans)
    about/              ← public about page
    tools/              ← public tools showcase (client, auth modal on click)
    kits/[slug]/        ← dynamic kit landing pages (creator/sme/hr/legal/marketing)
  
  (site)/               ← app pages (Sidebar + Navbar)
    layout.tsx          ← Sidebar + Navbar + AnnouncementBanner
    dashboard/          ← auth protected (middleware + server component)
    tools/[slug]/       ← tool pages (preview without auth, paywall in-page)
    profile/            ← auth protected
    explore/            ← auth protected
  
  admin/                ← setulix_admin cookie auth (jose)
  onboarding/           ← no sidebar, excluded from onboarding gate
```

### Middleware Auth Flow
```
/dashboard, /profile, /explore, /history:
  → Read authjs.session-token cookie → jwtVerify
  → No payload → redirect to /
  → payload.onboardingCompleted === false → redirect to /onboarding
  → else → proceed

/about, /pricing, /tools, /kits, /onboarding, /api/public, /api/auth, /:
  → Always public, no checks
```

---

## Issues
None. TypeScript: 0 errors. Reload loop resolved.
