# ToolHub — All Session Prompts
# Jab bhi new session shuru karo — yahan se prompt copy karo
# Pehle hamesha: git pull + HANDOFF.md padho

---

## ACCOUNT A SESSIONS

---

### A6 — Razorpay Payment Integration

```
Read .claude/CLAUDE.md and docs/HANDOFF.md first.

Session A6 Task: Razorpay Payment Integration

What to build:

1. RAZORPAY ORDER API (apps/web/src/app/api/credits/purchase/route.ts)
   POST /api/credits/purchase
   - Auth required
   - Body: { packId: string }
   - Fetch CreditPack from DB by _id
   - Create Razorpay order via Razorpay API
   - Return: { orderId, amount, currency, packName, credits }
   - Use fetch() to call Razorpay API directly (no SDK needed)
   - Razorpay create order endpoint:
     POST https://api.razorpay.com/v1/orders
     Auth: Basic base64(KEY_ID:KEY_SECRET)
     Body: { amount: priceInr*100, currency: 'INR', receipt: userId+packId }

2. RAZORPAY WEBHOOK (apps/web/src/app/api/webhooks/razorpay/route.ts)
   POST /api/webhooks/razorpay
   - Verify webhook signature (X-Razorpay-Signature header)
   - Use crypto.createHmac('sha256', WEBHOOK_SECRET)
   - Event: payment.captured → add credits to user
   - Find user by notes.userId
   - Call CreditService.addCredits(userId, pack.credits, 'purchase', { orderId, paymentId })
   - Return 200 always (even on verify fail — just log)
   - Idempotent: check if transaction already exists before adding

3. PAYMENT BUTTON COMPONENT
   (apps/web/src/components/credits/BuyCreditsButton.tsx)
   Client component
   - Props: pack (ICreditPack)
   - On click:
     1. POST /api/credits/purchase with packId
     2. Get orderId back
     3. Load Razorpay checkout script dynamically
     4. Open Razorpay modal with options:
        key: NEXT_PUBLIC_RAZORPAY_KEY_ID
        amount, currency, order_id
        name: 'Toolspire'
        description: pack.name + ' — ' + pack.credits + ' credits'
        theme: { color: '#7c3aed' }
     5. handler (on success):
        - Call syncFromServer() from credits-store
        - Show success toast
        - Close modal
     6. On dismiss: nothing

4. UPDATE PRICING PAGE
   - Replace static "Get Started" button with <BuyCreditsButton pack={pack} />
   - Pass pack data as prop

5. ENV VARS
   Add to .env.example:
   RAZORPAY_KEY_ID=
   RAZORPAY_KEY_SECRET=
   RAZORPAY_WEBHOOK_SECRET=
   NEXT_PUBLIC_RAZORPAY_KEY_ID=  ← same as KEY_ID, for client

Rules:
- Webhook must verify signature before processing
- Credits added only on payment.captured event
- Idempotent — never add credits twice for same payment
- Razorpay script loaded dynamically (not in _document)
- NEXT_PUBLIC_ prefix for client-side key only

After completing: list files created/modified.
```

---

### A7 — Admin Panel Part 1 (Tools + Users)

```
Read .claude/CLAUDE.md and docs/HANDOFF.md first.

Session A7 Task: Admin Panel — Tools + Users Management

What to build:

1. ADMIN LAYOUT (apps/web/src/app/admin/layout.tsx)
   - Middleware already protects /admin/* (role: admin)
   - Sidebar with admin nav links:
     LayoutDashboard → /admin (overview)
     Wrench → /admin/tools (tool config)
     Users → /admin/users (user management)
     CreditCard → /admin/pricing (credit packs)
     Settings → /admin/settings (site config)
   - Header: "Admin Panel" + back to site link
   - Different from main site sidebar

2. ADMIN OVERVIEW (apps/web/src/app/admin/page.tsx)
   Stats cards:
   - Total users (count from DB)
   - Total credits sold (sum of purchase transactions)
   - Active tools count
   - Revenue this month (sum of purchases in current month)

3. TOOLS MANAGEMENT (apps/web/src/app/admin/tools/page.tsx)
   Table of all tools with inline editing:
   - Columns: Icon | Name | Kit | Credits | Model | Status | Actions
   - Credits: editable number input (blur to save)
   - Model: dropdown (gpt-4o-mini / gpt-4o / claude-haiku-3-5 / 
     claude-sonnet-4-5 / gemini-flash-2.0 / dall-e-3)
   - Status: toggle switch (isActive)
   - Save: PATCH /api/admin/tools/[slug]
   
   API: PATCH /api/admin/tools/[slug]/route.ts
   - Admin auth required
   - Body: { creditCost?, aiModel?, aiProvider?, isActive? }
   - Update ToolConfig in DB
   - Clear tool registry cache (clearToolCache())
   - Log to AuditLog
   - Return updated config

4. USERS MANAGEMENT (apps/web/src/app/admin/users/page.tsx)
   Table with search:
   - Search by email or name
   - Columns: Name | Email | Credits | Plan | Joined | Actions
   - Actions: "Add Credits" button → modal with amount input
   
   API: POST /api/admin/users/[userId]/credits/route.ts
   - Admin auth required
   - Body: { amount: number, note: string }
   - CreditService.addCredits(userId, amount, 'manual_admin', { note, adminId })
   - Log to AuditLog

Rules:
- All admin APIs check role === 'admin' first
- Every admin action logged to AuditLog
- clearToolCache() after any tool config change
- Use shadcn Table component

After completing: list files created/modified.
```

---

### A8 — Admin Panel Part 2 (Pricing + Settings)

```
Read .claude/CLAUDE.md and docs/HANDOFF.md first.

Session A8 Task: Admin Panel — Pricing + Settings

What to build:

1. PRICING MANAGEMENT (apps/web/src/app/admin/pricing/page.tsx)
   Full CRUD for credit packs:
   - Table: Name | Credits | Price | Per Credit | Featured | Active | Order | Edit
   - "Add New Pack" button → modal form
   - Edit button → same modal (pre-filled)
   - Delete button (with confirm dialog)
   - Drag to reorder (update sortOrder)
   
   APIs:
   POST /api/admin/pricing → create pack
   PATCH /api/admin/pricing/[id] → update pack
   DELETE /api/admin/pricing/[id] → delete pack
   
   Form fields:
   - Pack name (text)
   - Credits (number)
   - Price in Rs (number)
   - Is Featured (toggle)
   - Is Active (toggle)
   - Sort Order (number)

2. SITE SETTINGS (apps/web/src/app/admin/settings/page.tsx)
   Form with these controls:
   
   Theme section:
   - Default theme: radio (Dark / Light)
   
   Announcement Banner section:
   - Banner text (textarea)
   - Show banner: toggle
   - Preview of how it looks
   
   Maintenance Mode section:
   - Toggle switch
   - Warning: "This will show maintenance page to all users"
   
   Save button → PATCH /api/admin/settings
   
   API: PATCH /api/admin/settings/route.ts
   - Admin auth required
   - Update SiteConfig keys in DB
   - Log to AuditLog

3. ANNOUNCEMENT BANNER (global)
   - Fetch SiteConfig announcement_visible from DB in root layout
   - If true: show banner above navbar
   - Banner: full width, purple bg, announcement_banner text, X to dismiss
   - Dismiss stored in sessionStorage (shows again on new tab)

Rules:
- All admin APIs: role check first, AuditLog after
- Settings saved per key in SiteConfig collection
- Announcement banner SSR rendered (no flash)

After completing: list files created/modified.
```

---

### A9 — LiteLLM Gateway + Bull MQ Worker

```
Read .claude/CLAUDE.md and docs/HANDOFF.md first.

Session A9 Task: LiteLLM Gateway + Bull MQ Worker Setup

What to build:

1. LITELLM CONFIG (apps/worker/litellm-config.yaml)
   model_list:
   - gpt-4o-mini (openai)
   - gpt-4o (openai)  
   - claude-haiku-3-5 (anthropic)
   - claude-sonnet-4-5 (anthropic)
   - gemini-flash-2.0 (google)
   - dall-e-3 (openai)
   
   router_settings:
   - routing_strategy: least-busy
   - num_retries: 3
   
   general_settings:
   - request caching via Redis (24hr TTL)

2. BULL MQ WORKER (apps/worker/src/)
   
   queue.ts:
   - Create Bull MQ queue: 'ai-jobs'
   - Redis connection from REDIS_URL env
   
   worker.ts:
   - Process 'ai-jobs' queue
   - Job types: text-generation, image-generation
   - Call LiteLLM gateway for each job
   - Update job progress
   - On complete: store result in Redis (key: job:[jobId]:result, TTL: 1hr)
   - On fail: store error in Redis
   
   jobs/text-generation.ts:
   - Input: { model, messages[], maxTokens, userId, toolSlug }
   - Call LiteLLM: POST LITELLM_GATEWAY_URL/chat/completions
   - Return: { content, tokensUsed }
   
   jobs/image-generation.ts:
   - Input: { prompt, size, userId, toolSlug }
   - Call LiteLLM: POST LITELLM_GATEWAY_URL/images/generations
   - Upload result to Cloudflare R2
   - Return: { imageUrl }

3. JOB API ROUTES (apps/web/src/app/api/jobs/)
   
   POST /api/jobs/create
   - Auth required
   - Body: { jobType, payload }
   - Add to Bull MQ queue
   - Return: { jobId }
   
   GET /api/jobs/[jobId]/status
   - Auth required
   - Check Redis for result
   - Return: { status: 'queued'|'processing'|'done'|'failed', result? }

4. useJobStatus HOOK (apps/web/src/hooks/useJobStatus.ts)
   - Input: jobId (or null)
   - Polls GET /api/jobs/[jobId]/status every 2 seconds
   - Stops polling when status is done or failed
   - Returns: { status, result, error }

Rules:
- Worker runs separately on Railway (apps/worker)
- Web app only creates jobs and checks status
- LiteLLM handles all model routing and fallbacks
- Image URLs saved to R2 immediately (expire in 1hr from OpenAI)

After completing: list files created/modified.
```

---

### A10 — Referral System + Output History

```
Read .claude/CLAUDE.md and docs/HANDOFF.md first.

Session A10 Task: Referral System + Output History

What to build:

1. REFERRAL SYSTEM
   
   Update User model:
   - referralCode: string (unique, auto-generated on signup)
   - referredBy: ObjectId (ref: User, optional)
   - referralCount: number (default 0)
   
   Referral flow:
   - Signup URL: /?ref=CODE
   - Store ref code in cookie (7 day expiry)
   - On signup: check cookie → link referredBy → 
     add 15 credits to new user +
     add 10 credits to referrer
   - Both get CreditTransaction (type: referral_bonus)
   
   APIs:
   GET /api/referral/code → returns current user referral code + link
   GET /api/referral/stats → referralCount, credits earned from referrals
   
   Dashboard referral section:
   - Referral link with copy button
   - Stats: X friends invited, X credits earned
   - "Share on WhatsApp" button

2. OUTPUT HISTORY PAGE (apps/web/src/app/dashboard/history/page.tsx)
   
   Fetch from ToolOutput collection (userId match)
   
   Table:
   - Date | Tool | Credits Used | Actions
   - Actions: "View Output" (eye icon) → modal with output text
   - "Replay" button → goes to /tools/[slug] with input pre-filled
   
   Pagination: 10 per page
   
   API: GET /api/user/history?page=1&limit=10
   - Auth required
   - Returns: { outputs: IToolOutput[], total, page }

Rules:
- Referral credits atomic (MongoDB transaction)
- History paginated (not all at once)
- Replay passes inputSnapshot as URL search params

After completing: list files created/modified.
```

---

## ACCOUNT B SESSIONS

---

### B1 — Blog Generator (First AI Tool)

```
Read .claude/CLAUDE.md and docs/HANDOFF.md first.

Session B1 Task: First Functional Tool — Blog Generator

[Full prompt already given in chat — copy from there]
```

---

### B2 — YT Script Writer

```
Read .claude/CLAUDE.md and docs/HANDOFF.md first.

Session B2 Task: YT Script Writer Tool

What to build:
src/tools/yt-script/ with config, schema, engine, UI

config.ts:
- slug: 'yt-script'
- creditCost: 4
- model: 'claude-haiku-3-5'
- provider: 'anthropic'

schema.ts (Zod):
- topic: string (min 3, max 200)
- duration: enum ['5', '10', '15', '20'] (minutes)
- style: enum ['educational', 'entertaining', 'tutorial', 'motivational']
- hookType: enum ['question', 'statistic', 'story', 'bold-claim']
- targetAudience: string (optional)
- cta: string (optional, what action viewer should take)

engine.ts:
- Call Anthropic API directly (fetch)
- Endpoint: https://api.anthropic.com/v1/messages
- Model: claude-haiku-3-5-20251001
- Headers: x-api-key, anthropic-version: 2023-06-01
- Prompt: generate script with these exact sections:
  HOOK (30 seconds), INTRO (1 min), MAIN_CONTENT (bulk),
  OUTRO (1 min), CTA (30 seconds)
- Each section has: title, duration, wordCount, content
- Return: { sections[], totalWords, estimatedDuration }
- Deduct 4 credits after success

UI (YTScriptTool.tsx):
Left Panel inputs:
- Topic text field
- Duration pills (5 / 10 / 15 / 20 min)
- Style pills (Educational / Entertaining / Tutorial / Motivational)
- Hook Type pills (Question / Statistic / Story / Bold Claim)
- Optional: Target Audience + CTA text
- Generate button: "Generate Script — 4 credits"

Right Panel output:
- Each section as collapsible card
  Header: section title + duration + word count
  Body: script content (monospace font)
  Copy button per section
- "Copy All" button at bottom
- Total words + estimated duration shown

Wire into tool shell:
- Add to toolComponents map in /tools/[slug]/page.tsx

After completing: list files created/modified.
```

---

### B3 — Resume Screener

```
Read .claude/CLAUDE.md and docs/HANDOFF.md first.

Session B3 Task: Resume Screener Tool

config.ts:
- slug: 'resume-screener'
- creditCost: 3
- model: 'claude-haiku-3-5'
- provider: 'anthropic'

schema.ts:
- resumeText: string (min 100) ← extracted from PDF on client
- jobDescription: string (min 50, max 3000)

engine.ts:
- Send both to Claude Haiku 3.5
- Output: {
    matchScore: number (0-100),
    verdict: 'strong-match' | 'good-match' | 'weak-match' | 'no-match',
    keyMatches: string[] (skills/experience that match),
    gaps: string[] (missing requirements),
    recommendation: string (2-3 sentences),
    interviewQuestions: string[] (3 suggested questions)
  }
- Deduct 3 credits after success

UI (ResumeScreenerTool.tsx):
Left Panel:
- PDF upload (drag & drop)
  Client-side: use pdfjs-dist to extract text
  Show extracted text preview (collapsed, max 3 lines)
- Job Description textarea
- "Screen Resume — 3 credits" button

Right Panel output:
- Match score: large circular gauge (0-100)
  Color: green >70, yellow 40-70, red <40
- Verdict badge (Strong Match / Good Match / etc.)
- Key Matches section: green checkmark list
- Gaps section: red X list
- Recommendation: paragraph text
- Interview Questions: numbered list

After completing: list files created/modified.
```

---

### B4 — GST Invoice Generator (Free Tool)

```
Read .claude/CLAUDE.md and docs/HANDOFF.md first.

Session B4 Task: GST Invoice Generator — Free Tool

config.ts:
- slug: 'gst-invoice'
- creditCost: 0
- isAI: false

schema.ts (Zod):
Seller: name, gstin, address, state, phone, email
Buyer: name, gstin (optional), address, state, phone
Invoice: number, date, dueDate
Items[]: description, hsn, qty, unit, rate, gstRate (5/12/18/28)

engine.ts (NO AI):
- Calculate: taxableAmount, cgst, sgst, igst (if different state), total
- IGST if seller state !== buyer state
- Generate PDF using pdf-lib
- Upload PDF to Cloudflare R2
- Return: { pdfUrl, invoiceSummary }

UI (GSTInvoiceTool.tsx):
Left Panel:
- Seller details section (collapsible, filled once)
- Buyer details section
- Invoice details (number auto-increments)
- Line items table (add/remove rows)
  Each row: description, HSN, qty, unit, rate, GST%
  Row shows calculated values live
- Totals summary (live calculation)
- "Generate Invoice" button (FREE — no credits)

Right Panel:
- Invoice preview (rendered HTML matching PDF layout)
- Download PDF button
- Share link button

No login required to generate (free tool).
Login required to save history.

After completing: list files created/modified.
```

---

### B5 — Title Generator + Hook Writer + Caption Generator (Batch)

```
Read .claude/CLAUDE.md and docs/HANDOFF.md first.

Session B5 Task: 3 Small AI Tools (Batch Session)

Build all 3 tools — they are small (1 credit each):

1. TITLE GENERATOR (slug: title-generator)
   Model: gemini-flash-2.0 (Google AI)
   API: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
   Inputs: topic, platform (YouTube/Blog/LinkedIn/Twitter), count (5/10/15)
   Output: array of title strings with copy-each button
   
2. HOOK WRITER (slug: hook-writer)
   Model: gemini-flash-2.0
   Inputs: topic, hookType (question/statistic/story/bold-claim/humor), platform
   Output: 5 hook variations, copy each
   
3. CAPTION GENERATOR (slug: caption-generator)
   Model: gemini-flash-2.0
   Inputs: topic, platform (Instagram/LinkedIn/Twitter/YouTube), tone, includeHashtags (bool)
   Output: 3 caption variations with hashtags, copy each

For all 3:
- Small compact UI (single column input, output below)
- Results shown as cards with copy button each
- "Copy All" button
- Wire into toolComponents map

After completing: list files created/modified.
```

---

### B6 — Legal Notice + NDA Generator

```
Read .claude/CLAUDE.md and docs/HANDOFF.md first.

Session B6 Task: Legal Notice + NDA Generator

1. LEGAL NOTICE (slug: legal-notice)
   Model: claude-sonnet-4-5, 12 credits
   Inputs:
   - senderName, senderAddress
   - receiverName, receiverAddress  
   - subject (what the notice is about)
   - incidentDetails (what happened)
   - demand (what you want them to do)
   - deadline (days to respond)
   - noticeType: enum [payment-recovery, property-dispute, 
     service-deficiency, cheque-bounce, employment]
   Output: Full formal legal notice (ready to send)
   UI: Form left, formatted legal document right
   Download as PDF + Copy buttons

2. NDA GENERATOR (slug: nda-generator)
   Model: claude-sonnet-4-5, 12 credits
   Inputs:
   - partyAName, partyAAddress (disclosing party)
   - partyBName, partyBAddress (receiving party)
   - purpose (what they're sharing info for)
   - duration (months)
   - jurisdiction (Indian state)
   - ndaType: enum [one-way, mutual]
   Output: Complete NDA document
   Download as PDF + Copy buttons

For both:
- Professional document formatting in output
- pdf-lib for PDF generation
- Upload to R2, return download URL

After completing: list files created/modified.
```

---

### B7 — Remaining Tools (Batch)

```
Read .claude/CLAUDE.md and docs/HANDOFF.md first.

Session B7 Task: Remaining Tools Batch

Build these tools following established patterns:

1. EMAIL SUBJECT LINE (slug: email-subject, 1 credit, gemini-flash)
   Inputs: emailContent (brief), tone, count (5/10)
   Output: list of subject lines, copy each

2. LINKEDIN BIO (slug: linkedin-bio, 3 credits, gpt-4o-mini)
   Inputs: currentRole, experience, skills, achievements, tone
   Output: 3 bio variations (short/medium/full), copy each

3. AD COPY WRITER (slug: ad-copy, 3 credits, gpt-4o-mini)
   Inputs: product, targetAudience, platform, goal, usp
   Output: headline + body + CTA for each variation (3 total)

4. WHATSAPP BULK MESSAGE (slug: whatsapp-bulk, 1 credit, gemini-flash)
   Inputs: businessType, messageGoal, customerName (placeholder), offer
   Output: 5 message templates, copy each

5. GST CALCULATOR (slug: gst-calculator, FREE, no AI)
   Inputs: amount, gstRate (5/12/18/28), calculationType (inclusive/exclusive)
   Output: base amount, GST amount, total — live calculation (no API call)

6. OFFER LETTER (slug: offer-letter, FREE, no AI)
   Inputs: company, candidate, role, salary, joiningDate, benefits
   Output: formatted offer letter, download as PDF

After completing: list files created/modified.
```

---

### B8 — Kit Landing Pages + SEO

```
Read .claude/CLAUDE.md and docs/HANDOFF.md first.

Session B8 Task: Kit Landing Pages + SEO

1. KIT PAGES (apps/web/src/app/kits/[kit]/page.tsx)
   generateStaticParams for all 5 kits
   generateMetadata per kit (SEO optimized)
   
   Each kit page:
   - Hero: kit icon (large) + name + description
   - "X tools for [profession]" 
   - Tool grid (all tools in this kit)
   - Who is this for section
   - CTA: "Start Free — No subscription"

2. SEO OPTIMIZATION
   - generateMetadata for /tools/[slug] (already shell exists, enhance it)
   - Add JSON-LD structured data per tool page
   - Sitemap: apps/web/src/app/sitemap.ts
     Include: /, /tools, /pricing, all /tools/[slug], all /kits/[kit]
   - robots.txt: apps/web/src/app/robots.ts

3. OG IMAGES
   apps/web/src/app/og/[slug]/route.ts
   - Dynamic OG image using Next.js ImageResponse
   - Shows: tool icon + name + credit cost + Toolspire branding

After completing: list files created/modified.
```

---

# HOW TO USE THIS FILE
# 1. git pull origin main
# 2. cat docs/HANDOFF.md  
# 3. Find your current session above
# 4. Copy the prompt
# 5. Paste in Claude Code
# 6. After session: git commit + update HANDOFF.md