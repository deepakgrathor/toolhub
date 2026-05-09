# Handoff Note
Updated: 2026-05-09 | Account: A | Session: #14 | New Tools + Upstash Registry

## Where We Are
Session A14 done. 7 new tools built and wired. Tool registry upgraded to Upstash Redis. TypeScript: 0 errors.

### What Was Built (Session A14 — New Tools + Registry Upgrade)

**NEW UTILITY — `apps/web/src/lib/ai.ts`**
- Shared `callAI(prompt, model, provider)` function — extracted from blog-generator engine
- All new tool engines import from here; blog-generator unchanged (backward compatible)
- Supports LiteLLM gateway → Anthropic → Google → OpenAI fallback chain
- Also exports `repairJson()` and `extractJson()` JSON repair utilities

**TOOL 1 — QR Generator (0 credits, client-side)**
- `apps/web/src/tools/qr-generator/` — config, schema, QrGeneratorTool.tsx
- Uses `qrcode` npm package (installed: `npm install qrcode @types/qrcode --workspace=apps/web`)
- No API route needed — fully client-side
- Input: URL/text, size (128/256/512), error correction level (L/M/Q/H)
- Output: QR code PNG data URL, displayed as image with download + clipboard copy

**TOOL 2 — GST Calculator (0 credits, client-side)**
- `apps/web/src/tools/gst-calculator/` — config, schema, GstCalculatorTool.tsx
- Pure math, no API route needed
- Input: amount, GST rate (5/12/18/28%), exclusive/inclusive, intrastate/interstate
- Output: CGST, SGST (intrastate) or IGST (interstate) breakdown with totals

**TOOL 3 — Hook Writer (0 credits, AI)**
- `apps/web/src/tools/hook-writer/` — config, schema, engine, HookWriterTool.tsx
- `apps/web/src/app/api/tools/hook-writer/route.ts`
- Input: topic, platform (instagram/youtube/linkedin/twitter), count (3/5/10)
- Output: list of viral hook lines with individual copy buttons

**TOOL 4 — Caption Generator (0 credits, AI)**
- `apps/web/src/tools/caption-generator/` — config, schema, engine, CaptionGeneratorTool.tsx
- `apps/web/src/app/api/tools/caption-generator/route.ts`
- Input: topic, platform, tone, include hashtags toggle
- Output: 3 captions each with text + hashtag array

**TOOL 5 — YT Script Writer (4 credits, AI)**
- `apps/web/src/tools/yt-script/` — config, schema, engine, YtScriptTool.tsx
- `apps/web/src/app/api/tools/yt-script/route.ts`
- Input: video title, duration (5/10/15/20 min), style, optional audience + keywords
- Output: hook, intro, N segments, outro, CTA — full copy + download as .txt

**TOOL 6 — JD Generator (3 credits, AI)**
- `apps/web/src/tools/jd-generator/` — config, schema, engine, JdGeneratorTool.tsx
- `apps/web/src/app/api/tools/jd-generator/route.ts`
- Input: job title, department, experience level, work type, skills, location, company context
- Output: full JD with overview, responsibilities, requirements, nice-to-have, benefits

**TOOL 7 — LinkedIn Bio Generator (3 credits, AI)**
- `apps/web/src/tools/linkedin-bio/` — config, schema, engine, LinkedinBioTool.tsx
- `apps/web/src/app/api/tools/linkedin-bio/route.ts`
- Input: name, current role, industry, top skills, career highlight, years of experience
- Output: 3 bio variants (concise ~60w, storytelling ~110w, professional ~90w)

**REGISTRY UPGRADE — `apps/web/src/lib/tool-registry.ts`**
- Replaced in-memory Map with Upstash Redis (HTTP REST, works in Vercel serverless)
- Pattern: Upstash Redis first → falls back to in-memory if Redis not configured (dev safety)
- Redis keys prefixed `registry:*`, TTL 5 min (300s)
- `clearToolCache()` is now async — clears Redis + in-memory
- Updated `/api/admin/tools/[slug]/route.ts` to `await clearToolCache()`

**PAGE.TSX UPDATE**
- `apps/web/src/app/(site)/tools/[slug]/page.tsx`: 7 new tools added to `toolComponents` map

---

## Where We Were (Session A13 — Bug Fixes + Polish)
All HIGH + MEDIUM bugs fixed. Maintenance mode, toast notifications, rate limiting, mobile responsiveness, error pages, make-admin script.

---

## Next Task (Session A15)
1. Seed DB tool configs for A14 tools (qr-generator, gst-calculator, hook-writer, caption-generator, yt-script, jd-generator, linkedin-bio)
2. Build remaining 1-credit tools: Title Generator, Email Subject, WhatsApp Bulk
3. Build CA/Legal tools: Legal Notice (12cr), NDA Generator (12cr), Legal Disclaimer (3cr)
4. Build marketing tools: Ad Copy (3cr), SEO Auditor (8cr)
5. Build SME form tools: GST Invoice, Expense Tracker, Quotation Generator, Salary Slip

## How to Seed

```bash
cd packages/db && MONGODB_URI=... npm run seed
```

> **Important**: After A14, DB seed must include tool configs for all 7 A14 tools. Currently only blog-generator is fully configured in DB.

## Credit Cost Reference
| Credits | Tools |
|---------|-------|
| 0 | hook-writer, caption-generator, gst-invoice, expense-tracker, quotation-generator, qr-generator, salary-slip, offer-letter, gst-calculator, tds-sheet |
| 1 | title-generator, email-subject, whatsapp-bulk |
| 3 | blog-generator, resume-screener, jd-generator, appraisal-draft, policy-generator, linkedin-bio, ad-copy, legal-disclaimer |
| 4 | yt-script |
| 7 | thumbnail-ai |
| 8 | seo-auditor |
| 10 | website-generator |
| 12 | legal-notice, nda-generator |

## Tools Built (UI Complete)
- blog-generator ✅ (A9)
- qr-generator ✅ (A14) — client-side
- gst-calculator ✅ (A14) — client-side
- hook-writer ✅ (A14) — AI, 0cr
- caption-generator ✅ (A14) — AI, 0cr
- yt-script ✅ (A14) — AI, 4cr
- jd-generator ✅ (A14) — AI, 3cr
- linkedin-bio ✅ (A14) — AI, 3cr

## Architecture: Two Redis Connection Types

```
REDIS_URL (rediss://...)        → Bull MQ / ioredis (TCP protocol)
UPSTASH_REDIS_URL + TOKEN       → @upstash/redis (HTTP REST) — job results, cache, registry
```

## Env Vars (apps/web/.env)
All set except:
- `REDIS_URL` — needs Upstash ioredis TCP URL
- `LITELLM_GATEWAY_URL` / `LITELLM_MASTER_KEY` — needs Railway deployment
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_AI_API_KEY` — for LiteLLM
- `R2_SECRET_ACCESS_KEY` — fill from Cloudflare dashboard

## Issues
None. TypeScript: 0 errors.
