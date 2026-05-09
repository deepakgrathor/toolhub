# Handoff Note
Updated: 2026-05-09 | Account: A | Session: #19 | Performance + Loading Experience

## Where We Are
Session A19 done. **TypeScript: 0 errors.**
All 10 performance + loading experience goals implemented.

---

## What Was Built (Session A19 — Performance + Loading)

### PART 1 — Skeleton Loaders
- `apps/web/src/components/ui/skeletons/DashboardSkeleton.tsx` — **new**:
  - `StatsBarSkeleton` — 4-card pulse grid
  - `RecentActivitySkeleton` — header + 5 row pulses
  - `KitSectionSkeleton` — 2 kit groups × 6 tool cards
  - `DashboardSkeleton` — full page composite
- `apps/web/src/components/ui/skeletons/ToolPageSkeleton.tsx` — **new**: matches 45/55 tool layout
- `apps/web/src/components/ui/skeletons/index.ts` — barrel exports
- All skeletons use `animate-pulse bg-muted` — works in dark + light

### PART 2 — Suspense + Next.js Streaming
- `apps/web/src/app/(site)/dashboard/loading.tsx` — **new**: full-page `<DashboardSkeleton />` shown by App Router during navigation
- `apps/web/src/app/(site)/dashboard/page.tsx` — **rewritten**:
  - Greeting renders instantly (no DB)
  - `<StatsSection>` wrapped in `<Suspense fallback={<StatsBarSkeleton />}>`
  - `<ToolsSection>` wrapped in `<Suspense fallback={<KitSectionSkeleton />}>`
  - Both are async server components — streaming after DB resolves

### PART 3 — AI Tool Output Streaming
- `apps/web/src/lib/ai-stream.ts` — **new**: raw SSE streaming for Anthropic, OpenAI, Gemini, and LiteLLM gateway
- `apps/web/src/app/api/tools/blog-generator/stream/route.ts` — **new**:
  - Uses plain-text markdown prompt (not JSON) so streaming content is readable
  - Pipes AI chunks directly to `ReadableStream` → client
  - Credits deducted ONLY after full stream completes (rule #4 maintained)
  - Terminal metadata: `[DONE:{"creditsUsed":X,"newBalance":Y}]`
- `apps/web/src/hooks/useStreamingOutput.ts` — **new**:
  - `startStream(url, body)` — reads chunked response, accumulates text
  - Parses terminal `[DONE:...]` / `[ERROR:...]` markers
  - Exposes `{ text, isStreaming, isDone, error, creditsUsed, newBalance }`
- `apps/web/src/tools/blog-generator/BlogGeneratorTool.tsx` — **rewritten**:
  - Uses `useStreamingOutput` hook
  - `<StreamingSkeleton>` with live char counter + progress bar while streaming
  - `<TypingCursor>` blinking cursor (accent color, 500ms interval)
  - `<BlogOutput>` fades in with `animate-in fade-in` after parsing
  - Form inputs disabled during generation
  - `<CheckCheck>` green icon on copy (2s, then resets)
  - Parses plain-text markdown sections into structured BlogOutput object

### PART 4 — Optimistic UI
- Blog generator: Loader2 spinner on button + all fields disabled during streaming
- Error toast (sonner) fired on `stream.error` via `useEffect`
- Credits NOT deducted unless stream completes successfully

### PART 9 — Error Boundaries
- `apps/web/src/components/tools/ToolErrorBoundary.tsx` — **new**:
  - React class `Component` with `getDerivedStateFromError`
  - Shows: AlertTriangle icon + tool name + error message + "Try Again" button
  - Captures to Posthog if `NEXT_PUBLIC_POSTHOG_KEY` set
  - Wrapped around every `ToolComponent` in the `[slug]/page.tsx`
- `apps/web/src/app/error.tsx` — **enhanced**:
  - Shows error digest ID
  - Posthog `global_error` capture
  - Dashboard link added alongside Try Again

### PART 7 — Redis Caching
- `apps/web/src/lib/credit-cache.ts` — **new**:
  - `getCachedBalance` / `setCachedBalance` / `invalidateBalance` — key `toolhub:credits:{userId}`, TTL 5 min
  - `getCachedDashStats` / `setCachedDashStats` / `invalidateDashStats` — key `toolhub:dashboard:{userId}`, TTL 2 min
- `apps/web/src/app/api/user/credits/route.ts` — **updated**: Redis cache hit → skip DB round-trip
- `apps/web/src/app/api/user/credits/deduct/route.ts` — **updated**: invalidates both balance + dashboard caches after deduction
- Dashboard `StatsSection` — **updated**: reads from Redis cache before hitting MongoDB

### PART 5 — Image Optimisation
- `apps/web/next.config.mjs` — **updated**:
  - `images.remotePatterns`: R2 public URL (from env), `*.r2.cloudflarestorage.com`, `lh3.googleusercontent.com`
  - Ready for `next/image` with blur placeholder on R2 images

### PART 6 — Route Prefetching
- Confirmed: 0 instances of `prefetch={false}` in the codebase → all `<Link>` components prefetch by default
- `apps/web/src/components/search/CommandSearch.tsx` — **updated**: prefetches top 3 tool routes via `router.prefetch()` when tools load on palette open

### PART 8 — Bundle Analysis
- `@next/bundle-analyzer` installed (dev dep)
- `apps/web/next.config.mjs` — wrapped with `withBundleAnalyzer({ enabled: ANALYZE==="true" })`
- Run: `ANALYZE=true npm run build` to open bundle report
- All tool components already use `next/dynamic` (code-split per route)

### PART 10 — Loading State Polish
- Navbar: credits badge pill skeleton is `rounded-full` (matching badge shape) while session loads
- Hook-writer: copy button now uses `<CheckCheck>` green icon (2s) instead of `<Check>`
- Blog generator: `CheckCheck` green copy icon + `animate-in fade-in` on output reveal
- Dashboard `main` tag already had `animate-in fade-in duration-200` (from A18)
- `<TypingCursor>` component in blog generator: accent-colored, 500ms blink

---

## Architecture Notes

### Streaming Blog Generator
The blog generator now has TWO API routes:
1. `/api/tools/blog-generator` — original JSON route (kept for backwards compat)
2. `/api/tools/blog-generator/stream` — new streaming route, plain-text markdown output

The tool component uses the streaming route. The streaming prompt outputs:
```
TITLE: ...
META: ...
---SECTION---
## Heading
Content...
---CONCLUSION---
...
---CTA---
...
```
Client parses this with `parseStreamedBlog()` after stream completes.

### Credits Safety (Rule #4 Never Broken)
All streaming routes:
1. Check balance BEFORE streaming
2. Call AI and stream response
3. Deduct credits ONLY after `callAIStream()` resolves successfully
4. Append `[DONE:{"creditsUsed":X,"newBalance":Y}]` terminal marker
5. Frontend only updates credit store when it receives the `[DONE:...]` marker

### Redis Cache Keys
```
toolhub:credits:{userId}     TTL 5 min — credit balance
toolhub:dashboard:{userId}   TTL 2 min — dashboard stats (toolsUsed, creditsUsed, memberSince)
registry:all_tools           TTL 5 min — tool registry (from A-earlier sessions)
registry:tool:{slug}         TTL 5 min — individual tool config
```

---

## Tool Registry — All 27 Built Tools (unchanged)

| Tool | Slug | Credits | Model | Status |
|------|------|---------|-------|--------|
| Blog Generator | blog-generator | 3 | claude-haiku-3-5 | ✅ + Streaming |
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

## Phase 1 Status: COMPLETE + PERFORMANCE POLISHED

Next steps:
1. End-to-end testing with real API keys
2. Razorpay integration wiring
3. Deploy to Vercel (web) + Railway (worker)

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
