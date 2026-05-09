# Handoff Note
Updated: 2026-05-09 | Account: A | Session: #10 | LiteLLM Gateway + Bull MQ Worker (complete)

## Where We Are
Session A10 done. Full async job pipeline is in place: web app creates jobs → Bull MQ queue (Redis) → worker processes them → results stored in Upstash Redis → web app polls for status.

### What Was Built (Session A10 — LiteLLM + Bull MQ Worker)

**LiteLLM Config**
- `apps/worker/litellm-config.yaml` — 6 models (gpt-4o-mini, gpt-4o, claude-haiku-3-5, claude-sonnet-4-5, gemini-flash-2.0, dall-e-3); router: 3 retries, fallbacks (gpt-4o-mini→gemini-flash-2.0, claude-haiku→gpt-4o-mini); master_key from env

**Bull MQ Worker (apps/worker/src/)**
- `queue.ts` — `aiQueue` (Bull MQ Queue) + `redisConnection` (ioredis) using `REDIS_URL`; `maxRetriesPerRequest: null` required by Bull MQ
- `worker.ts` — Worker with concurrency=5; on complete → `redis.set("job:<id>:result", JSON.stringify(result), { ex: 3600 })`; on fail → `redis.set("job:<id>:error", msg, { ex: 3600 })` via Upstash REST client
- `jobs/text-generation.ts` — fetch `${LITELLM_GATEWAY_URL}/chat/completions`; returns `{ content, tokensUsed }`
- `jobs/image-generation.ts` — fetch `${LITELLM_GATEWAY_URL}/images/generations` → download image → upload to Cloudflare R2 via `@aws-sdk/client-s3`; returns permanent `{ imageUrl }`
- `index.ts` — imports worker + queue; graceful SIGTERM/SIGINT shutdown (worker.close + queue.close)

**Package Changes**
- `apps/worker/package.json` — added: bullmq, ioredis, @aws-sdk/client-s3
- `apps/web/package.json` — added: bullmq, ioredis (for job creation from API routes)
- `packages/shared/package.json` — added: @upstash/redis (runtime dep, shared by web + worker)

**Shared Redis Client (packages/shared/)**
- `packages/shared/src/redis-client.ts` — lazy singleton `getRedis()` using `UPSTASH_REDIS_URL` + `UPSTASH_REDIS_TOKEN`; throws clearly if env vars missing
- `packages/shared/src/index.ts` — added `export * from "./redis-client"`

**Job API Routes (apps/web/src/app/api/jobs/)**
- `create/route.ts` — POST; auth required; Zod validates `{ jobType, payload }`; module-level Queue singleton (ioredis TCP); adds job with `userId` merged into payload; returns `{ jobId }`
- `[jobId]/status/route.ts` — GET; auth required; checks Upstash Redis for `job:<id>:result` / `job:<id>:error` first (fast path); falls back to Bull MQ `queue.getJob()` for live state; maps Bull MQ states → `queued|processing|done|failed`

**Frontend Hook**
- `apps/web/src/hooks/useJobStatus.ts` — `useJobStatus(jobId: string | null)`: polls `/api/jobs/[jobId]/status` every 2s; stops on `done`/`failed`/`null jobId`; returns `{ status, result, error, isLoading }`

**Next.js Config**
- `apps/web/next.config.mjs` — added `ioredis` and `bullmq` to `serverComponentsExternalPackages` (prevents webpack from bundling native Node.js modules)

**Env Files**
- `apps/worker/.env.example` — full reference for all worker env vars
- `apps/web/.env` — updated: replaced placeholder LiteLLM vars with real names; added `UPSTASH_REDIS_URL/TOKEN` (mapped from existing REST credentials); added `REDIS_URL` placeholder for Bull MQ TCP connection

### Architecture: Two Redis Connection Types
```
REDIS_URL (rediss://...)        → Bull MQ / ioredis (TCP protocol)
                                  Used by: apps/worker/src/queue.ts
                                           apps/web/src/app/api/jobs/*/

UPSTASH_REDIS_URL + TOKEN       → @upstash/redis (HTTP REST)
                                  Used by: packages/shared/src/redis-client.ts
                                  Stores: job:<id>:result  (TTL 1h)
                                          job:<id>:error   (TTL 1h)
```

### To Get REDIS_URL for Bull MQ
1. Go to [Upstash Console](https://console.upstash.com) → your Redis database
2. Click "Connect" → select "ioredis" tab
3. Copy the `rediss://default:<password>@<host>:<port>` URL
4. Set as `REDIS_URL` in both `apps/web/.env` and `apps/worker` env

### To Deploy LiteLLM on Railway
```bash
# In Railway, create a new service from Docker:
# Image: ghcr.io/berriai/litellm:main-latest
# Start command: litellm --config /app/litellm-config.yaml --port 4000
# Mount: apps/worker/litellm-config.yaml → /app/litellm-config.yaml
# Set env vars: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY, LITELLM_MASTER_KEY
```

### What Was Built (Session A9 — Blog Generator)

**ToolOutput DB Model**
- `packages/db/src/models/ToolOutput.ts` — Mongoose model: userId, toolSlug, inputSnapshot (Mixed), outputText, creditsUsed, timestamps
- `packages/db/src/index.ts` — Uncommented/added `export * from "./models/ToolOutput"`

**Shared Types**
- `packages/shared/src/tool-types.ts` — `ToolEngineResult` (output, structured, creditsUsed, newBalance) + `ToolEngineContext` (userId, toolSlug)

**Blog Generator — Tool Files**
- `apps/web/src/tools/blog-generator/config.ts` — creditCost=3, model=gpt-4o-mini
- `apps/web/src/tools/blog-generator/schema.ts` — Zod schema
- `apps/web/src/tools/blog-generator/engine.ts` — Server-only: checkBalance → OpenAI fetch → parse → deductCredits → ToolOutput.create
- `apps/web/src/app/api/tools/blog-generator/route.ts` — POST handler

**Blog Generator — UI**
- `apps/web/src/tools/blog-generator/BlogGeneratorTool.tsx` — Client component, 2-col layout
- `apps/web/src/components/tools/ToolLoadingSkeleton.tsx` — Loading skeleton

**Tool Shell Page**
- `apps/web/src/app/(site)/tools/[slug]/page.tsx` — `toolComponents` map with dynamic imports

## Next Task
Session A11: Wire blog-generator to use job queue (optional), OR build next tool (e.g. YT Script Generator)
- Blog generator currently calls OpenAI directly — can migrate to use job queue
- Or build yt-script-generator following same pattern (creditCost=4)
- Consider: tool output history page at /dashboard/history

## How to Seed
```bash
cd packages/db && MONGODB_URI=... npm run seed
```

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

## Env Vars (apps/web/.env)
All set except:
- `REDIS_URL` — needs Upstash ioredis TCP URL (see instructions above)
- `LITELLM_GATEWAY_URL` / `LITELLM_MASTER_KEY` — needs Railway deployment
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_AI_API_KEY` — for LiteLLM
- `R2_SECRET_ACCESS_KEY` — fill from Cloudflare dashboard

## Issues
None.
