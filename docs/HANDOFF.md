# Handoff Note
Updated: 2026-05-12 | Account: B | Session: #1 | Onboarding + Profile + Marketing + Nav fixes

## Where We Are
Session B1 done. **TypeScript: 0 errors.** Committed and pushed to main.

**NEW ENV VARS REQUIRED (add to Vercel):**
```
CLOUDFLARE_ACCOUNT_ID=<your-cloudflare-account-id>
R2_ACCESS_KEY_ID=<your-r2-access-key>
R2_SECRET_ACCESS_KEY=<your-r2-secret-key>
R2_BUCKET_NAME=<your-bucket-name>
R2_PUBLIC_URL=<your-r2-public-url>   # e.g. https://pub-xxxxx.r2.dev
```
Without these, avatar/logo uploads will fail (profile still works, just no photos).

**ONE-TIME SETUP — Seed OnboardingConfig:**
```
MONGODB_URI="mongodb+srv://..." npx tsx apps/web/src/scripts/seed-onboarding.ts
```

---

## What Was Built (Session B1)

### SECTION 1 — DB Schemas
- **`packages/db/src/models/User.ts`** — added: `onboardingCompleted`, `onboardingStep`, `avatar`, `address`, `profession`, `kitName`, `selectedTools[]`, `profileScore`
- **`packages/db/src/models/BusinessProfile.ts`** — NEW: business profile collection (userId, businessName, industry, gstState, teamSize, logo, phone, website, gstNumber, etc.)
- **`packages/db/src/models/OnboardingConfig.ts`** — NEW: DB-driven onboarding steps (admin can update questions/options without code change)
- **`packages/db/src/index.ts`** — exports BusinessProfile + OnboardingConfig

### SECTION 2 — Auth + Middleware
- **`apps/web/src/auth.ts`** — `onboardingCompleted` added to JWT + session for Google + credentials providers
- **`apps/web/src/types/next-auth.d.ts`** — `onboardingCompleted: boolean` added to Session + JWT
- **`apps/web/src/middleware.ts`** — onboarding gate: reads `authjs.session-token` cookie → if `onboardingCompleted === false` → redirect to `/onboarding` (excludes /api/auth, /api/onboarding, /admin, /onboarding)

### SECTION 3 — Onboarding API
- `GET /api/onboarding/config` — returns active steps (Redis-cached, 1hr TTL)
- `POST /api/onboarding/save-step` — saves progress (so user can resume)
- `POST /api/onboarding/complete` — writes profession, kitName, selectedTools (recommended per profession), sets `onboardingCompleted: true`, creates BusinessProfile

**Recommended tools per profession:**
```
creator  → blog-generator, yt-script, hook-writer, caption-generator, thumbnail-ai, title-generator
sme      → gst-invoice, expense-tracker, quotation-generator, qr-generator, website-generator, gst-calculator
hr       → jd-generator, resume-screener, appraisal-draft, policy-generator, offer-letter, salary-slip
legal    → legal-notice, nda-generator, legal-disclaimer, gst-calculator, tds-sheet, whatsapp-bulk
marketer → ad-copy, caption-generator, email-subject, linkedin-bio, hook-writer, seo-auditor
```

### SECTION 4 — Onboarding UI
- **`apps/web/src/app/onboarding/layout.tsx`** — no sidebar, no navbar, SetuLix logo + progress bar only
- **`apps/web/src/app/onboarding/page.tsx`** — 4-step client flow:
  - Step 1: Profession (6 cards with lucide icons)
  - Step 2: Team Size (4 cards)
  - Step 3: Biggest Challenge (4 cards)
  - Step 4: Kit name (editable) + recommended tools chips + Launch button

### SECTION 5 — Profile API + Score
- `GET /api/profile` — user + business + score
- `PATCH /api/profile/personal` — name, mobile, address, profession
- `PATCH /api/profile/business` — businessName, industry, gstState, teamSize, phone, website, businessAddress, gstNumber
- `POST /api/profile/avatar` — upload image to R2, update user.avatar
- `POST /api/profile/logo` — upload image to R2, update businessProfile.logo
- **`apps/web/src/lib/profile-score.ts`** — score 0-100 (personal 50pts, business 50pts)
- **`apps/web/src/lib/r2-upload.ts`** — Cloudflare R2 upload via @aws-sdk/client-s3

### SECTION 6 — Profile Page
- **`apps/web/src/app/(site)/profile/page.tsx`** — two tabs: Personal + Business
  - Avatar/logo upload with hover overlay
  - All 28 Indian states + 8 UTs in dropdown
  - 15 industry options
  - Profile score ring (SVG) in header

### SECTION 7 — Navbar Profile Ring
- **`apps/web/src/components/layout/UserDropdown.tsx`** — SVG circular progress ring replaces plain avatar
  - Score badge (purple circle, bottom-right of avatar)
  - Profile link added to dropdown
- **`apps/web/src/hooks/useProfileScore.ts`** — fetches /api/profile on session load

### SECTION 8 — Layout Restructuring
- **`apps/web/src/app/(marketing)/layout.tsx`** — NEW route group: no sidebar, uses MarketingNavbar
- **`apps/web/src/components/layout/MarketingNavbar.tsx`** — sticky glassmorphism navbar (Features, Tools, Pricing, About links + Login/Get Started)
- **`apps/web/src/app/(site)/page.tsx`** — DELETED (replaced by marketing homepage)
- Old (site)/ layout still serves: /dashboard, /tools, /about, /kits, /pricing, /profile, /explore

### SECTION 9 — NProgress Loading Bar
- Installed: `nprogress` + `@types/nprogress`
- **`apps/web/src/components/providers/ProgressBar.tsx`** — Suspense-wrapped, completes on pathname change
- **`apps/web/src/components/ui/LoadingLink.tsx`** — Link wrapper that starts NProgress on click
- `globals.css` — `#nprogress .bar { background: #7c3aed }` override
- `layout.tsx` — ProgressBar added to root providers

### SECTION 10 — Explore Page
- `GET /api/explore/tools` — all tools + user's `selectedTools` slugs
- `POST /api/explore/add` — `$addToSet` to selectedTools
- `DELETE /api/explore/remove` — `$pull` from selectedTools
- **`apps/web/src/app/(site)/explore/page.tsx`** — search + kit filter tabs + add/remove buttons
- Sidebar: `Compass` icon + `/explore` link above Kits section

### SECTION 11 — Marketing Website
- **`apps/web/src/app/(marketing)/page.tsx`** — full 12-section marketing homepage:
  - Hero: badge + H1 + CTA + social proof
  - Stats bar: 27+ tools, 5 kits, Free, 10hr+
  - Who is it for: 5 kit cards
  - Features: 3-column grid
  - Tools showcase: all 27 tools in grid
  - How it works: 3 steps
  - Comparison table: SetuLix vs ChatGPT vs Jasper vs Copy.ai
  - Pricing preview: 3 plans
  - Testimonials: 3 cards
  - FAQ accordion (6 questions)
  - Final CTA (purple gradient banner)
  - Footer with links + "Made in India"

### SECTION 12 — Seed Script
- **`apps/web/src/scripts/seed-onboarding.ts`** — run once to seed 4 OnboardingConfig docs

---

## Architecture Notes

### Route Groups (updated)
```
app/
  (marketing)/          ← public marketing pages (no sidebar)
    layout.tsx          ← MarketingNavbar only
    page.tsx            ← full marketing homepage
  
  (site)/               ← app pages (sidebar + navbar)
    layout.tsx          ← Sidebar + Navbar + AnnouncementBanner
    dashboard/          ← auth protected (server component check)
    tools/[slug]/       ← preview without auth, paywall in-page
    profile/            ← auth protected (client-side redirect)
    explore/            ← auth protected (client-side redirect)
    about/              ← public
    kits/               ← public
    pricing/            ← public
  
  admin/                ← setulix_admin cookie auth (jose)
  onboarding/           ← no sidebar, no navbar, onboarding gate excluded
```

### Onboarding Gate Flow
```
User logs in (Google/credentials)
→ JWT token has onboardingCompleted=false
→ middleware reads authjs.session-token cookie
→ if !onboardingCompleted AND route not excluded → redirect /onboarding
→ User completes 4 steps
→ POST /api/onboarding/complete
→ window.location.href="/dashboard" (forces cookie refresh)
→ New JWT has onboardingCompleted=true
→ No more redirect
```

### Profile Score Calculation (0-100)
```
Personal (50 pts):  name=10, mobile=10, profession=10, address=10, avatar=10
Business (50 pts):  businessName=15, industry=10, gstState=10, teamSize=10, logo=5
```

### Redis Cache Keys (new)
```
onboarding:config    TTL 1hr    (OnboardingConfig steps)
SetuLix:user:{id}    TTL 5min   (user profile - invalidated on complete)
```

---

## Phase 1 Status: COMPLETE ✓
## Phase B1 Status: COMPLETE ✓

## Issues
None. TypeScript: 0 errors.
