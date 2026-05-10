# Handoff Note
Updated: 2026-05-10 | Account: A | Session: #23 | Bug Fixes: Admin Login + Post-Login Redirect

## Where We Are
Session A23 done. **TypeScript: 0 errors.**
BUG-01 and BUG-02 from the test suite fixed. Committed and pushed — Vercel deploying.

---

## What Was Built (Session A23)

### BUG-02 Fix — Admin Login Page (CRITICAL)
- `apps/web/src/middleware.ts` — **fixed**: `/admin/*` now redirects to `/admin/login` (not `/`). `/admin/login` is allowed through without auth. Admins already logged in are auto-redirected from login → `/admin`.
- `apps/web/src/app/api/admin/auth/send-otp/route.ts` — **new**: Verifies email+password, checks `role === "admin"`, sends OTP email via Resend. Generic error to prevent user enumeration.
- `apps/web/src/app/api/admin/auth/verify-otp/route.ts` — **new**: Verifies OTP from DB, deletes it, generates a one-time `adminToken` UUID stored in Redis (`setulix:admin:login:{token}`, TTL 5 min). Returns `{ adminToken }`.
- `apps/web/src/auth.ts` — **updated**: Credentials `authorize` now handles `adminToken` path: looks up Redis key, gets email, fetches admin user, returns user. One-time use token deleted from Redis immediately.
- `apps/web/src/app/admin/layout.tsx` — **updated**: Pathname `/admin/login` gets a minimal centered layout (no sidebar, no sidebar nav). All other admin routes keep the existing panel layout.
- `apps/web/src/app/admin/login/page.tsx` — **new**: Two-step admin login UI. Step 1: email+password → calls send-otp. Step 2: 6-digit OTP entry → calls verify-otp → gets adminToken → calls `signIn("credentials", { adminToken })` → redirects to `/admin`.

### BUG-01 Fix — Post-Login Redirect + Stable Selector
- `apps/web/src/components/auth/AuthModal.tsx` — **fixed**: After successful login or signup, calls `router.push("/dashboard")` so user lands on dashboard. Google OAuth `callbackUrl` changed from `window.location.href` to `/dashboard`.
- `apps/web/src/components/layout/Navbar.tsx` — **fixed**: Uses stable Zustand selectors (`useCreditStore((s) => s.balance)` and `useCreditStore((s) => s.syncFromServer)`). Effect dependency array is `[status]` only (not `[status, syncFromServer]`) to prevent any potential re-run on function reference changes.

### TC Coverage After Session A23
- TC-01 ✓ Signup → OTP → account → redirected to /dashboard
- TC-02 ✓ Login → redirected to /dashboard (no reload loop)
- TC-03 ✓ Google OAuth → callbackUrl /dashboard
- TC-05 ✓ Admin login via /admin/login with OTP
- TC-06 ✓ /admin (not logged in) → /admin/login
- TC-07 ✓ Regular user visiting /admin → /admin/login

### Known Limitations
- TC-08 (Admin/user session independence): Both admin and regular user share the same NextAuth JWT cookie. If admin and user are logged in in the same browser simultaneously (not incognito), the second login overwrites the first. This requires a completely separate session system (separate cookie name) to fully fix — out of scope for Phase 1.

---

## Where We Were (Sessions A21+A22)
Sessions A21+A22 done. **TypeScript: 0 errors.**
Product rebranded from Toolspire → **SetuLix** (by **SetuLabsAI**, Founder: **Deepak Rathor**).
All 20 implementation items complete across 3 sections: Critical Fixes, Branding, SEO+Kit Pages.

---

## What Was Built (Session A21+A22)

### SECTION 0 — Critical Fixes

#### 0A. Tool Hide/Disable — FIXED
- `apps/web/src/lib/tool-registry.ts` — **fixed**: `getAllTools()` now fetches all ToolConfig docs (not just `isActive:true`) and filters by BOTH `isActive && isVisible`. Added `isVisible` to `ToolWithConfig` interface.
- `apps/web/src/app/api/tools/active-slugs/route.ts` — **new**: Returns `{ slugs: string[] }` of all active+visible tools. Sidebar uses this to filter.
- `apps/web/src/components/layout/sidebar.tsx` — **fixed**: Fetches active slugs on mount (30s client cache), filters `SIDEBAR_KITS` dynamically. Hidden tools disappear from sidebar.
- `apps/web/src/app/(site)/tools/[slug]/page.tsx` — **fixed**: If `isVisible=false` → redirect to dashboard. If `isActive=false` → show `ToolUnavailableCard`.

#### 0B. Google Profile Pic — FIXED
- `apps/web/src/auth.ts` — **fixed**: JWT callback now sets `token.image = user.image` for both Google and credentials providers. Session callback sets `session.user.image = token.image`.
- `apps/web/src/types/next-auth.d.ts` — **updated**: Added `image?: string | null` to JWT interface.

#### 0C. Admin Tool Kit Change — ADDED
- `apps/web/src/app/api/admin/tools/[slug]/route.ts` — **updated**: PATCH now accepts `kit` field, updates `Tool.kits = [kit]` in DB (alongside ToolConfig changes).
- `apps/web/src/components/admin/ToolsTable.tsx` — **updated**: Kit column changed from read-only text to editable `<select>` dropdown. `RowState` includes `kits`. Optimistic UI update.

### SECTION 1 — SetuLix Branding

#### 1A. Brand Constants
- `packages/shared/src/brand.ts` — **new**: `BRAND` object with name, tagline, company, founder, domain, emails.
- `packages/shared/src/index.ts` — **updated**: Exports `brand`.

#### 1B. Toolspire → SetuLix Replace
- Global find+replace across 70+ files in `apps/web/src/**`:
  - "Toolspire" → "SetuLix", "toolspire.io" → "setulix.com", "Gobeens Technology" → "SetuLabsAI"
- `@toolhub/db` and `@toolhub/shared` package names **unchanged** (internal monorepo names).

#### 1C. Logo Component
- `apps/web/src/components/brand/Logo.tsx` — **new**: SetuLix wordmark with geometric S SVG icon. Sizes: sm/md/lg. Optional `showSubtext` for "by SetuLabsAI".
- Sidebar and admin layout updated to use Logo component.

#### 1D. Footer
- `apps/web/src/components/brand/Footer.tsx` — **new**: Full footer with Logo+tagline, Pages+Kits links, contact emails, copyright, "Designed by SetuLabsAI" bar.

#### 1E. /about Page
- `apps/web/src/app/(site)/about/page.tsx` — **new**: About SetuLix, About SetuLabsAI, Team (Deepak Rathor), Tech Stack, CTA.

#### 1F. OTP Email Branding
- `apps/web/src/app/api/auth/send-otp/route.ts` — **updated**: HTML email template redesigned with SetuLix header, purple branding, monospace OTP display, SetuLabsAI footer.

### SECTION 2 — Light Theme Fixes

#### 2A. Navbar
- Glassmorphism: `bg-background/80 backdrop-blur-md sticky top-0 z-30`.

#### 2B-2F. Component Fixes
- `apps/web/src/components/admin/ToolsTable.tsx` — hardcoded `bg-[#111111]`/`bg-[#1a1a1a]` → semantic tokens.
- `apps/web/src/app/admin/layout.tsx` — `bg-[#0a0a0a]`/`bg-[#0d0d0d]` → `bg-background`/`bg-card`. `hover:bg-white/5` → `hover:bg-muted/50`.

#### 2C. Dashboard Count-Up
- `apps/web/src/hooks/useCountUp.ts` — **new**: `useCountUp(target, duration)` hook. easeOut cubic animation.
- `apps/web/src/components/dashboard/StatsBar.tsx` — **updated**: `<StatValue>` component animates numbers 0→actual on mount.

#### 2G. Final Polish
- `apps/web/src/app/globals.css` — **updated**: Global focus ring (`*:focus-visible`), thin scrollbar (`scrollbar-width: thin`), webkit scrollbar 4px, sidebar custom scrollbar.
- `apps/web/src/app/not-found.tsx` — **rewritten**: SetuLix logo + icon + "404 Page Not Found" + Dashboard + Home buttons.
- `apps/web/src/app/maintenance/page.tsx` — **rewritten**: SetuLix logo + Wrench icon + "Back Shortly" message. All semantic tokens.

### SECTION 3 — Kit Landing Pages + SEO

#### 3C. robots.ts + sitemap.ts
- `apps/web/src/app/robots.ts` — **new**: Allow all, disallow `/admin /api /dashboard`. Sitemap URL: `https://setulix.com/sitemap.xml`.
- `apps/web/src/app/sitemap.ts` — **new**: Static routes + 27 tool routes. Domain: `https://setulix.com`.

#### 3B. SEO Metadata
- `apps/web/src/app/layout.tsx` — **updated**: Full metadata object with `metadataBase`, title template, OG tags, Twitter card.

#### 3A. 5 Kit Landing Pages
- `apps/web/src/components/brand/KitPage.tsx` — **new**: Shared kit page component. Hero, Tools Grid, How It Works (3 steps), Use Cases (4), FAQ (accordion), CTA Banner + Footer.
- `/kits/creator` — Creator Kit (6 tools, content creator focus)
- `/kits/sme` — SME Kit (7 free tools, Indian business focus)
- `/kits/hr` — HR Kit (5 tools, Indian workplace)
- `/kits/legal` — CA/Legal Kit (5 tools, Indian law)
- `/kits/marketing` — Marketing Kit (6 tools, Indian brands)

#### 3D. Sidebar + Homepage + next.config
- `apps/web/src/lib/kit-config.ts` — **updated**: Added `pageSlug` field to `KitConfig`.
- Sidebar `KitItem` — **updated**: Hover shows ExternalLink icon → navigates to `/kits/[pageSlug]`.
- `apps/web/src/app/(site)/page.tsx` — **updated**: Kit cards now link to `/kits/[pageSlug]`. Section heading: "Explore Our Kits".
- `apps/web/next.config.mjs` — **updated**: `compress: true`, `images.formats: ['image/avif','image/webp']`, X-Robots-Tag noindex for `/admin/*`.

---

## New Files This Session

| File | Purpose |
|------|---------|
| `packages/shared/src/brand.ts` | BRAND constants object |
| `apps/web/src/app/api/tools/active-slugs/route.ts` | Active+visible tool slugs for sidebar |
| `apps/web/src/components/brand/Logo.tsx` | SetuLix wordmark component |
| `apps/web/src/components/brand/Footer.tsx` | Site footer with branding |
| `apps/web/src/components/brand/KitPage.tsx` | Shared kit landing page template |
| `apps/web/src/app/(site)/about/page.tsx` | About SetuLix + SetuLabsAI page |
| `apps/web/src/app/(site)/kits/creator/page.tsx` | Creator Kit landing |
| `apps/web/src/app/(site)/kits/sme/page.tsx` | SME Kit landing |
| `apps/web/src/app/(site)/kits/hr/page.tsx` | HR Kit landing |
| `apps/web/src/app/(site)/kits/legal/page.tsx` | CA/Legal Kit landing |
| `apps/web/src/app/(site)/kits/marketing/page.tsx` | Marketing Kit landing |
| `apps/web/src/hooks/useCountUp.ts` | Count-up animation hook |
| `apps/web/src/app/robots.ts` | SEO robots.txt |
| `apps/web/src/app/sitemap.ts` | SEO sitemap |

---

## Architecture Notes

### Brand
- Product: **SetuLix** | Company: **SetuLabsAI** | Founder: **Deepak Rathor**
- Domain: `setulix.com` | Email: `hello@setulix.com`
- Logo: Geometric S SVG icon + "Setu" (text-foreground) + "Lix" (text-primary purple)
- Monorepo package names stay `@toolhub/db` and `@toolhub/shared` (internal only, not user-visible)

### Tool Visibility Flow
```
Admin toggles isActive/isVisible in DB
→ clearToolCache() called
→ /api/tools/active-slugs re-fetches (30s cache)
→ Sidebar refreshes visible tools on next hover/load
→ Tool page: isVisible=false → redirect /dashboard; isActive=false → ToolUnavailableCard
```

### Kit Landing Page URLs
```
/kits/creator   → Creator Kit
/kits/sme       → SME Kit
/kits/hr        → HR Kit
/kits/legal     → CA/Legal Kit (note: kit id is "ca-legal", page slug is "legal")
/kits/marketing → Marketing Kit
```

### Redis Cache Keys (unchanged)
```
toolhub:credits:{userId}     TTL 5 min
toolhub:dashboard:{userId}   TTL 2 min
registry:all_tools           TTL 5 min
registry:tool:{slug}         TTL 5 min
```

---

## Phase 1 Status: COMPLETE ✓

## Issues
None. TypeScript: 0 errors.
