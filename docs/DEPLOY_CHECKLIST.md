# Deployment Checklist

## Before Deploy

### Accounts + Services
- [ ] Vercel account — vercel.com
- [ ] Railway account — railway.app
- [ ] MongoDB Atlas cluster created (M0 free tier)
- [ ] Upstash Redis created (2 needed: 1 for sessions, 1 for Bull MQ)
- [ ] Cloudflare R2 bucket created: toolhub-outputs
- [ ] Razorpay account (test mode first)
- [ ] Google Cloud OAuth credentials
- [ ] Resend account + domain verified
- [ ] Domain registered: toolspire.io

### Environment Variables — Vercel
(Set all from .env.example)
- [ ] MONGODB_URI
- [ ] NEXTAUTH_SECRET (generate: openssl rand -base64 32)
- [ ] NEXTAUTH_URL=https://toolspire.io
- [ ] GOOGLE_CLIENT_ID
- [ ] GOOGLE_CLIENT_SECRET
- [ ] RAZORPAY_KEY_ID
- [ ] RAZORPAY_KEY_SECRET
- [ ] RAZORPAY_WEBHOOK_SECRET
- [ ] NEXT_PUBLIC_RAZORPAY_KEY_ID
- [ ] UPSTASH_REDIS_URL
- [ ] UPSTASH_REDIS_TOKEN
- [ ] REDIS_URL (ioredis format for Bull MQ)
- [ ] LITELLM_GATEWAY_URL
- [ ] LITELLM_MASTER_KEY
- [ ] CLOUDFLARE_R2_ACCOUNT_ID
- [ ] CLOUDFLARE_R2_ACCESS_KEY_ID
- [ ] CLOUDFLARE_R2_SECRET_ACCESS_KEY
- [ ] CLOUDFLARE_R2_BUCKET_NAME=toolhub-outputs
- [ ] CLOUDFLARE_R2_PUBLIC_URL
- [ ] RESEND_API_KEY
- [ ] POSTHOG_KEY (optional)

### Environment Variables — Railway (Worker)
- [ ] REDIS_URL
- [ ] UPSTASH_REDIS_URL
- [ ] UPSTASH_REDIS_TOKEN
- [ ] LITELLM_GATEWAY_URL
- [ ] LITELLM_MASTER_KEY
- [ ] OPENAI_API_KEY
- [ ] ANTHROPIC_API_KEY
- [ ] GOOGLE_AI_API_KEY
- [ ] CLOUDFLARE_R2_ACCOUNT_ID
- [ ] CLOUDFLARE_R2_ACCESS_KEY_ID
- [ ] CLOUDFLARE_R2_SECRET_ACCESS_KEY
- [ ] CLOUDFLARE_R2_BUCKET_NAME

### OAuth Setup
- [ ] Google Cloud Console → Authorized redirect URIs:
  - https://toolspire.io/api/auth/callback/google
  - http://localhost:3000/api/auth/callback/google (keep for dev)

### Razorpay Webhook
- [ ] Dashboard → Webhooks → Add:
  - URL: https://toolspire.io/api/webhooks/razorpay
  - Events: payment.captured
  - Secret: (same as RAZORPAY_WEBHOOK_SECRET)

## Deploy Steps

### 1. Deploy apps/web to Vercel
- [ ] Connect GitHub repo to Vercel
- [ ] Root directory: apps/web
- [ ] Framework: Next.js
- [ ] Build command: cd ../.. && npm run build --filter=web
- [ ] Set all env vars
- [ ] Deploy

### 2. Deploy LiteLLM to Railway
- [ ] New service → Docker image
- [ ] Image: ghcr.io/berriai/litellm:main-latest
- [ ] Mount litellm-config.yaml
- [ ] Set env vars (AI API keys)
- [ ] Note the Railway URL → set as LITELLM_GATEWAY_URL

### 3. Deploy Worker to Railway
- [ ] New service → GitHub repo
- [ ] Root directory: apps/worker
- [ ] Start command: npm run start
- [ ] Set all worker env vars
- [ ] Deploy

## After Deploy

- [ ] Run seed: `MONGODB_URI=... npm run seed` (from packages/db)
- [ ] Make admin: `MONGODB_URI=... npm run make-admin -- your@email.com`
- [ ] Test: Login with Google
- [ ] Test: Login with Email
- [ ] Test: Buy credits (Razorpay test mode)
- [ ] Test: Admin panel access
- [ ] Test: Tool registry (/api/tools)
- [ ] Test: Announcement banner (toggle in admin)
- [ ] Verify: Webhook receiving events (Razorpay dashboard)
- [ ] Switch: Razorpay test → live mode
