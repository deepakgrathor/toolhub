# Handoff Note
Updated: 2026-05-08 | Account: A | Session: #2 (A2 complete)

## Where We Are
Session A2 done. Authentication foundation is fully set up.

### What Was Built

**packages/db**
- `src/models/User.ts` — Mongoose User model with full fields (name, email, password,
  image, role, credits, plan, kitPreference, authProvider, lastSeen, timestamps)
- `src/index.ts` updated — exports `User` and `IUser`

**apps/web — Auth Core**
- `src/auth.ts` — NextAuth v5 config (JWT strategy, no DB adapter)
  - Google OAuth: auto-creates user in MongoDB on first sign-in (10 free credits)
  - Credentials: bcrypt password verify, updates `lastSeen`
  - JWT/session callbacks expose `id`, `role`, `credits`
- `src/middleware.ts` — Route protection
  - `/dashboard/*` → redirect to `/` if not logged in
  - `/admin/*` → redirect to `/` if `role !== 'admin'`
- `src/types/next-auth.d.ts` — Session + JWT type extensions

**apps/web — API Routes**
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handler
- `src/app/api/auth/signup/route.ts` — POST endpoint: validates, hashes password,
  creates user with `FREE_CREDITS_ON_SIGNUP` (10) credits

**apps/web — Frontend**
- `src/store/auth-store.ts` — Zustand store (`isAuthModalOpen`, `authMode`, actions)
- `src/components/auth/AuthModal.tsx` — Full modal (login + signup tabs)
  - Same-page, no redirect for credentials
  - Google OAuth button (redirects to Google, returns to same page)
  - react-hook-form + zod validation, error display
  - Dark/light theme via Tailwind
- `src/components/layout/Navbar.tsx` — Top bar
  - Logged out: "Login" button → opens AuthModal
  - Loading: skeleton placeholder
  - Logged in: credits badge (purple) + avatar + name
- `src/components/providers/session-provider.tsx` — NextAuth SessionProvider wrapper
- `src/app/layout.tsx` updated — Navbar + SessionProvider + AuthModal added

**Config**
- `apps/web/.env.example` — All env vars documented
- `apps/web/package.json` — Added: next-auth@beta, bcryptjs, zustand, @radix-ui/react-dialog,
  react-hook-form, @hookform/resolvers, zod, @toolhub/db, @toolhub/shared

### Verified
- TypeScript: clean (0 errors in web + db)
- npm install: 423 packages installed successfully

## Next Task
Session A3: Dashboard + Tool Registry
- Homepage with tool grid (loaded from DB)
- Tool categories / kits
- Sidebar navigation (real links)
- Dashboard page (user history, credits overview)

## Env Vars Status (all in apps/web/.env.example)
**Must fill before testing:**
- `MONGODB_URI` — MongoDB Atlas connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
  - OAuth callback URL to add: `http://localhost:3000/api/auth/callback/google`

**Optional for now:**
- Upstash Redis, Cloudflare R2, Razorpay, Resend, PostHog, LiteLLM

## Issues
None — clean build and type check.
