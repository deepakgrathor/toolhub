# Handoff Note
Updated: 2026-05-09 | Account: A | Session: #15 | 8 New Tools Batch Build

## Where We Are
Session A15 done. 16 tools total built and wired. TypeScript: 0 errors.

### What Was Built (Session A15 — Batch Tool Build)

**SEED UPDATED — `packages/db/src/seed.ts`**
- hook-writer: added aiModel='gemini-flash-2.0', aiProvider='google'
- caption-generator: added aiModel='gemini-flash-2.0', aiProvider='google'
- title-generator/email-subject/whatsapp-bulk: primary model changed to gemini-flash-2.0/google
- legal-disclaimer: changed from claude-haiku-3-5 to gpt-4o-mini/openai

**PART 2 — 1-Credit AI Tools (Google Gemini)**

**TOOL 1 — Title Generator (slug: title-generator, 1cr)**
- `apps/web/src/tools/title-generator/` — config, schema, engine, TitleGeneratorTool.tsx
- `apps/web/src/app/api/tools/title-generator/route.ts`
- Input: topic, platform (5 options), style (5 options), count (5/10/15)
- Output: numbered list of titles, each with individual copy button + Copy All

**TOOL 2 — Email Subject Line (slug: email-subject, 1cr)**
- `apps/web/src/tools/email-subject/` — config, schema, engine, EmailSubjectTool.tsx
- `apps/web/src/app/api/tools/email-subject/route.ts`
- Input: email goal textarea, tone pills (5), count (5/10)
- Output: subject lines with character count badge + copy buttons

**TOOL 3 — WhatsApp Bulk Message (slug: whatsapp-bulk, 1cr)**
- `apps/web/src/tools/whatsapp-bulk/` — config, schema, engine, WhatsappBulkTool.tsx
- `apps/web/src/app/api/tools/whatsapp-bulk/route.ts`
- Input: business type, message goal pills (5), offer textarea, emoji toggle
- Output: 5 message cards with char count + individual copy buttons

**PART 3 — CA/Legal Tools (Anthropic Claude + OpenAI)**

**TOOL 4 — Legal Notice Draft (slug: legal-notice, 12cr)**
- `apps/web/src/tools/legal-notice/` — config, schema, engine, LegalNoticeTool.tsx
- `apps/web/src/app/api/tools/legal-notice/route.ts`
- Uses claude-sonnet-4-5
- Input: sender/receiver details, notice type (5), subject, incident, demand, deadline
- Output: full formal legal notice + summary box + Copy/Download .txt + disclaimer warning

**TOOL 5 — NDA Generator (slug: nda-generator, 12cr)**
- `apps/web/src/tools/nda-generator/` — config, schema, engine, NdaGeneratorTool.tsx
- `apps/web/src/app/api/tools/nda-generator/route.ts`
- Uses claude-sonnet-4-5
- Input: Party A/B details, NDA type (one-way/mutual), purpose, duration, jurisdiction
- Output: complete NDA document + summary + Copy/Download .txt

**TOOL 6 — Legal Disclaimer (slug: legal-disclaimer, 3cr)**
- `apps/web/src/tools/legal-disclaimer/` — config, schema, engine, LegalDisclaimerTool.tsx
- `apps/web/src/app/api/tools/legal-disclaimer/route.ts`
- Uses gpt-4o-mini
- Input: business name, URL, disclaimer type (5), additional context
- Output: ready-to-use disclaimer text + Copy/Download

**PART 4 — Marketing Tools (OpenAI + Anthropic)**

**TOOL 7 — Ad Copy Writer (slug: ad-copy, 3cr)**
- `apps/web/src/tools/ad-copy/` — config, schema, engine, AdCopyTool.tsx
- `apps/web/src/app/api/tools/ad-copy/route.ts`
- Uses gpt-4o-mini
- Input: product name/description, target audience, USP, platform (5), goal (5)
- Output: 3 ad variation cards (variant badge, headline, primary text, CTA pill, copy button)

**TOOL 8 — Resume Screener (slug: resume-screener, 3cr)**
- `apps/web/src/tools/resume-screener/` — config, schema, engine, ResumeScreenerTool.tsx
- `apps/web/src/app/api/tools/resume-screener/route.ts`
- Uses claude-haiku-3-5
- Input: resume text (paste), job description (paste) — both large textareas
- Output: match score (0-100 color-coded), verdict badge, key matches, gaps, recommendation, interview questions

**PAGE.TSX UPDATED**
- `apps/web/src/app/(site)/tools/[slug]/page.tsx`: all 8 A15 tools added to toolComponents map

---

## Tool Registry — All 16 Built Tools

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

---

## Next Task (Session A16 — SME Form Tools)

Build 6 remaining free tools (no credits, client-side only):

| Tool | Slug | Credits | Type |
|------|------|---------|------|
| GST Invoice Generator | gst-invoice | 0 | Form → PDF download |
| Expense Tracker | expense-tracker | 0 | Form → expense table |
| Quotation Generator | quotation-generator | 0 | Form → PDF download |
| Salary Slip Generator | salary-slip | 0 | Form → PDF download |
| Offer Letter Generator | offer-letter | 0 | Form → PDF download |
| TDS Sheet | tds-sheet | 0 | Form → calculation table |

### A16 Notes
- All are client-side only — no API routes, no credits, no auth required
- PDF tools: use browser print / window.open approach (no jspdf dependency)
- These are free tools that showcase the platform — high SEO value
- Multi-item form needed for gst-invoice and quotation-generator (add/remove rows)

## Tools Remaining After A16
- thumbnail-ai (7cr, DALL-E 3)
- website-generator (10cr, claude-sonnet-4-5)
- seo-auditor (8cr, claude-sonnet-4-5)
- appraisal-draft (3cr, claude-haiku-3-5)
- policy-generator (3cr, claude-haiku-3-5)

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
