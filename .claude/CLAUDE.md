# ToolHub — Claude Code Instructions

## Project
Indian multi-tool SaaS platform.
Company: Gobeens Technology | Owner: Deepak
Brand: Toolspire (toolspire.io + toolspire.ai)

## Monorepo Structure
apps/web    → Next.js 14 App Router (frontend)
apps/worker → Node.js + Bull MQ (AI background jobs)
packages/shared → TypeScript types + constants
packages/db     → Mongoose models + DB connection

## Tech Stack
Frontend:
- Next.js 14 App Router
- Tailwind CSS v4
- shadcn/ui (dark + light theme both)
- next-themes (theme switching)
- Zustand (state management)
- cmdk (Cmd+K search)
- Framer Motion (animations)
- React Hook Form + Zod

Backend:
- Hono (API framework)
- Bull MQ (AI job queue)
- Zod (validation)
- Upstash Redis (cache + rate limiting)

Database & Storage:
- MongoDB Atlas (main database)
- Upstash Redis (sessions + cache)
- Cloudflare R2 (PDF + image storage)

Auth & Payments:
- NextAuth v5 (Google OAuth + Email/Password)
- Razorpay (Indian payments)
- Resend (transactional email)
- Posthog (analytics)

Deploy:
- Vercel → apps/web
- Railway → apps/worker + LiteLLM gateway

## Design System
Dark Mode:
  Background:  #0a0a0a
  Surface:     #111111
  Accent:      #7c3aed (purple)
  Text:        #e8e8e8
  Muted:       #888888

Light Mode:
  Background:  #ffffff
  Surface:     #f4f4f5
  Accent:      #7c3aed (purple — same)
  Text:        #09090b
  Muted:       #71717a

Both Modes:
  Free/Success: #10b981 (green)
  Font:        Inter (Google Fonts)
  Code Font:   JetBrains Mono
  Border radius: cards=12px, buttons=8px
  Layout: Left sidebar (collapsible) + 2-col tool page (45/55)

## Theme Rules
- Default theme: dark
- User can toggle dark/light from navbar
- Preference saved in localStorage + user profile
- next-themes handles SSR flash prevention
- All components must support both themes via Tailwind dark: classes

## CRITICAL — Everything Is Dynamic From Admin

### Tool Config (NOT hardcoded)
- Credit cost per tool → loaded from DB (tool_config collection)
- AI model per tool → loaded from DB (tool_config collection)
- Tool active/inactive → loaded from DB (tool_config collection)
- Cache tool configs in Redis (TTL: 5 min) for performance

### Pricing Plans (NOT hardcoded)
- All credit packs → loaded from DB (credit_packs collection)
- Admin can add/edit/delete packs anytime
- Razorpay plan ID stored per pack
- Cache pricing in Redis (TTL: 10 min)

### Admin Can Control
1. Tool credit cost — change anytime
2. Tool AI model — switch between GPT/Claude/Gemini per tool
3. Tool active status — enable/disable any tool instantly
4. Credit pack pricing — change name, price, credits
5. Credit pack visibility — show/hide any pack
6. Featured pack — mark which pack is highlighted
7. User credits — manually add or deduct
8. Site theme default — dark or light
9. Maintenance mode — on/off
10. Announcement banner — text + show/hide

### Admin Panel Routes
/admin                → Dashboard (stats overview)
/admin/tools          → All tools list + edit config
/admin/tools/[slug]   → Edit specific tool (model, credits, status)
/admin/pricing        → Manage credit packs
/admin/users          → User list, search, manual credit edit
/admin/settings       → Global site settings

### Admin Security
- Separate admin role in User model (role: 'admin' | 'user')
- All /admin/* routes protected by middleware
- Admin actions logged in audit_log collection

## MongoDB Collections
users             → User accounts + credits + role
tools             → Tool registry (slug, name, kits, description)
tool_config       → Dynamic config (creditCost, aiModel, isActive)
credit_packs      → Pricing plans (fully editable from admin)
tool_outputs      → User generation history
credit_transactions → Full credit ledger
site_config       → Global settings (theme, maintenance, banner)
audit_log         → Admin action history
sessions          → NextAuth sessions

## Architecture Rules — Never Break
1. AI APIs never called from frontend — always /api routes
2. New tool = folder in apps/web/src/tools/[tool-name]/
3. Each tool needs: config.ts, schema.ts, engine.ts, page.tsx, api.ts
4. Credits deduct AFTER successful AI response, never before
5. All file outputs (PDF/images) → Cloudflare R2, never local
6. Show tool preview BEFORE asking user to login
7. Auth modal → same page, no redirect
8. Paywall modal → same page, no redirect
9. Tool credit cost → always fetch from DB/Redis, never hardcode
10. AI model → always fetch from DB/Redis, never hardcode
11. Pricing → always fetch from DB/Redis, never hardcode

## AI Model Options Available (Admin Can Choose Per Tool)
OpenAI:    gpt-4o-mini, gpt-4o
Anthropic: claude-haiku-3-5, claude-sonnet-4-5
Google:    gemini-flash-2.0, gemini-pro
Images:    dall-e-3

## Session Rules
- Always read docs/HANDOFF.md before starting
- Always update docs/HANDOFF.md before finishing
- Commit after every session with clear message
- Never hardcode API keys — always .env files
- Never hardcode credit costs, models, or pricing

## Current Status
Phase: 1 | Session: A1 | Focus: Monorepo Setup