# Handoff Note
Updated: 2026-05-09 | Account: A | Session: #18 | Dashboard Redesign + Sidebar Overhaul

## Where We Are
Session A18 done. **TypeScript: 0 errors.**
All 27 tools complete. Premium UX overhaul done — sidebar accordion, new dashboard, navbar polish.

---

## What Was Built (Session A18 — UX Overhaul)

### PART 1 — Root Redirect
- `apps/web/src/app/(site)/page.tsx` — `auth()` check at top; logged-in users redirected to `/dashboard`

### PART 2 — Sidebar Complete Overhaul
- `apps/web/src/store/sidebar-store.ts` — added `expandedKit: string | null` + `setExpandedKit()`
- `apps/web/src/components/layout/sidebar.tsx` — full rewrite:
  - **Framer Motion accordion** — one kit open at a time, AnimatePresence + motion.div height animation
  - **Auto-expand** — `usePathname()` detects active tool slug and auto-expands parent kit
  - **Active states** — active tool gets `bg-primary/10`, `text-primary`, left 3px accent border
  - **Collapsed sidebar** (56px) — icons only, tooltips on hover, no tool lists
  - **Bottom section** — Refer & Earn (Gift icon) + Logout (LogOut icon, destructive on hover)
  - **Removed** — "All Tools" link, History link, theme toggle (moved to navbar)
  - **Mobile** — overlay drawer with full sidebar, closes on pathname change
  - **Kit config** — imported from `@/lib/kit-config` (centralized)

### PART 3 — Navbar Update
- `apps/web/src/components/layout/UserDropdown.tsx` — new file, custom dropdown:
  - Trigger: avatar initials + name
  - Items: Dashboard, History, Refer & Earn, Logout (destructive)
- `apps/web/src/components/layout/Navbar.tsx` — rewritten:
  - **Logged in**: Search | Credits badge (Coins + balance, click → /pricing) | ThemeToggle | UserDropdown
  - **Logged out**: Search | ThemeToggle | Login button
  - ThemeToggle: Sun/Moon icon, useTheme() from next-themes

### PART 4 — Dashboard Redesign
- `apps/web/src/app/(site)/dashboard/page.tsx` — full rewrite:
  - **Auth guard** — `auth()` check, redirects to `/` if not logged in
  - **Time-based greeting** — "Good morning/afternoon/evening/night, [FirstName]!"
  - **Stats**: toolsUsed (ToolOutput.countDocuments), creditsUsed (CreditTransaction aggregate), balance (from store), memberSince (User.createdAt from DB)
  - **Kit-wise tools** — KitSection renders all 27 tools grouped by kit
  - **Recent Activity** — last 5 runs, client-side fetch
  - **Referral** — at bottom with `id="referral"` for anchor linking
  - **Removed** — CreditOverview card, old TransactionHistory + ReferralCard combo layout

- `apps/web/src/components/dashboard/StatsBar.tsx` — 4-card stats row (tools used, credits left, credits used, member since)
- `apps/web/src/components/dashboard/DashboardToolCard.tsx` — compact tool card with icon, name, description, FREE/Xcr badge, hover lift + purple border
- `apps/web/src/components/dashboard/KitSection.tsx` — renders all SIDEBAR_KITS with tool grids (3/2/1 col)
- `apps/web/src/components/dashboard/RecentActivity.tsx` — last 5 history items, relative time, View link, empty state, loading skeleton

### PART 6 — Kit Config Centralization
- `apps/web/src/lib/kit-config.ts` — **new file**, single source of truth:
  - `SIDEBAR_KITS` — all 5 kits with full tool lists
  - `KitConfig` / `KitTool` interfaces
  - `getKitForSlug(slug)` — returns parent kit id
  - Imported by both sidebar.tsx and dashboard components

### PART 7 — Performance
- `apps/web/src/app/(site)/layout.tsx` — added `animate-in fade-in duration-200` to `<main>` for smooth page transitions; removed `kits` prop from `<Sidebar>` (no longer needed)

---

## Architecture Notes

### Sidebar is now self-contained
The sidebar no longer needs a `kits` prop passed from the server layout. All kit/tool data lives in `src/lib/kit-config.ts` (static, client-side). The site layout is now simpler — just mounts `<Sidebar />` and `<Navbar />`.

### Two parallel tool configs
- `src/lib/kit-config.ts` — **static, client-side** — sidebar structure, tool names per kit
- DB `tool_config` collection — **dynamic, server-side** — credit cost, AI model, active status
Both are used together in the dashboard KitSection (DB configs fetched server-side, passed as props).

### Credit balance flow
1. Server renders with `session.user.credits` from JWT (fast)
2. `useCreditStore.syncFromServer()` runs client-side to get fresh balance
3. Navbar credits badge reads from `useCreditStore().balance`
4. StatsBar credits card also reads from store (client component)

---

## Tool Registry — All 27 Built Tools

| Tool | Slug | Credits | Model | Status |
|------|------|---------|-------|--------|
| Blog Generator | blog-generator | 3 | claude-haiku-3-5 | ✅ |
| QR Generator | qr-generator | 0 | client-side | ✅ |
| GST Calculator | gst-calculator | 0 | client-side | ✅ |
| Hook Writer | hook-writer | 0 | gemini-flash-2.0 | ✅ |
| Caption Generator | caption-generator | 0 | gemini-flash-2.0 | ✅ |
| YT Script Writer | yt-script | 4 | claude-haiku-3-5 | ✅ |
| JD Generator | jd-generator | 3 | gpt-4o-mini | ✅ |
| LinkedIn Bio | linkedin-bio | 3 | gpt-4o-mini | ✅ |
| Title Generator | title-generator | 1 | gemini-flash-2.0 | ✅ |
| Email Subject | email-subject | 1 | gemini-flash-2.0 | ✅ |
| WhatsApp Bulk | whatsapp-bulk | 1 | gemini-flash-2.0 | ✅ |
| Legal Notice | legal-notice | 12 | claude-sonnet-4-5 | ✅ |
| NDA Generator | nda-generator | 12 | claude-sonnet-4-5 | ✅ |
| Legal Disclaimer | legal-disclaimer | 3 | gpt-4o-mini | ✅ |
| Ad Copy Writer | ad-copy | 3 | gpt-4o-mini | ✅ |
| Resume Screener | resume-screener | 3 | claude-haiku-3-5 | ✅ |
| GST Invoice Generator | gst-invoice | 0 | client-side | ✅ |
| Expense Tracker | expense-tracker | 0 | client-side | ✅ |
| Quotation Generator | quotation-generator | 0 | client-side | ✅ |
| Salary Slip Generator | salary-slip | 0 | client-side | ✅ |
| Offer Letter Generator | offer-letter | 0 | client-side | ✅ |
| TDS Sheet | tds-sheet | 0 | client-side | ✅ |
| Appraisal Draft | appraisal-draft | 3 | claude-haiku-3-5 | ✅ |
| Policy Generator | policy-generator | 3 | claude-haiku-3-5 | ✅ |
| Website Generator | website-generator | 10 | claude-sonnet-4-5 | ✅ |
| SEO Auditor | seo-auditor | 8 | claude-sonnet-4-5 | ✅ |
| Thumbnail AI | thumbnail-ai | 7 | dall-e-3 | ✅ |

---

## Phase 1 Status: COMPLETE + UX POLISHED

Next steps:
1. End-to-end testing with real API keys
2. Razorpay integration wiring
3. Admin panel polish
4. Deploy to Vercel (web) + Railway (worker)

## Architecture: Two Redis Connection Types

```
REDIS_URL (rediss://...)        → Bull MQ / ioredis (TCP protocol)
UPSTASH_REDIS_URL + TOKEN       → @upstash/redis (HTTP REST) — job results, cache, registry
```

## Env Vars Needed Before Testing
- `OPENAI_API_KEY` — for gpt-4o-mini, gpt-4o, dall-e-3 tools
- `ANTHROPIC_API_KEY` — for claude-haiku-3-5, claude-sonnet-4-5 tools
- `GOOGLE_AI_API_KEY` — for gemini-flash-2.0 tools
- `CLOUDFLARE_R2_ACCOUNT_ID` — for thumbnail-ai R2 uploads
- `CLOUDFLARE_R2_ACCESS_KEY_ID` — fill from Cloudflare dashboard
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY` — fill from Cloudflare dashboard
- `CLOUDFLARE_R2_BUCKET_NAME` — your R2 bucket name
- `CLOUDFLARE_R2_PUBLIC_URL` — public URL base for R2 bucket

## Issues
None. TypeScript: 0 errors.
