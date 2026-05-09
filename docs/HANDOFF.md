# Handoff Note
Updated: 2026-05-09 | Account: A | Session: #16 | 6 SME Free Tools (Client-side)

## Where We Are
Session A16 done. 22 tools total built and wired. TypeScript: 0 errors.

### What Was Built (Session A16 — SME Form Tools)

**SHARED UTILITIES**
- `apps/web/src/lib/print-pdf.ts` — `printDocument(html, title)` utility using window.open + print
- `apps/web/src/lib/utils.ts` — Added `amountToWords()`, `fmtInr()`, `INDIAN_STATES` array

**TOOL 1 — GST Invoice Generator (slug: gst-invoice, 0cr)**
- `apps/web/src/tools/gst-invoice/` — config.ts + GstInvoiceTool.tsx
- Seller + Buyer details with all Indian states dropdown
- Line items: description, HSN, qty, unit, rate, GST rate (0/5/12/18/28%)
- Live preview: auto CGST+SGST (same state) or IGST (different state)
- Amount in words, grand total, Download PDF button

**TOOL 2 — Expense Tracker (slug: expense-tracker, 0cr)**
- `apps/web/src/tools/expense-tracker/` — config.ts + ExpenseTrackerTool.tsx
- Add expenses: date, category (8 types), description, amount, payment mode
- Filter by category + date range
- Summary cards: Total, This Month, Top Category
- Color-coded category badges, delete per row
- Export to PDF via printDocument()

**TOOL 3 — Quotation Generator (slug: quotation-generator, 0cr)**
- `apps/web/src/tools/quotation-generator/` — config.ts + QuotationGeneratorTool.tsx
- From + To party details (no GST — simple quotation)
- Line items: description, qty, unit, rate
- Discount field, Notes, Terms & Conditions
- Live preview + Download PDF

**TOOL 4 — Salary Slip Generator (slug: salary-slip, 0cr)**
- `apps/web/src/tools/salary-slip/` — config.ts + SalarySlipTool.tsx
- Company + Employee info (name, ID, designation, department, bank last 4, PAN)
- Month/Year selector
- Earnings: Basic, HRA, Special Allowance, Other
- Deductions: PF (auto 12% of basic toggle or manual), ESI, TDS, Other
- Net Pay = Gross - Total Deductions, amount in words
- Live 2-column earnings/deductions preview + Download PDF

**TOOL 5 — Offer Letter Generator (slug: offer-letter, 0cr)**
- `apps/web/src/tools/offer-letter/` — config.ts + OfferLetterTool.tsx
- Company + Candidate details
- Offer: role, department, reporting to, joining date, work location, work type, CTC, probation
- Benefits toggles (6 options as pills)
- Auto acceptance deadline (7 days from letter date)
- Formal letter preview + Download PDF

**TOOL 6 — TDS Sheet (slug: tds-sheet, 0cr)**
- `apps/web/src/tools/tds-sheet/` — config.ts + TdsSheetTool.tsx
- Quarter (Q1–Q4) + Financial Year selector
- Add entries: vendor, PAN, nature, TDS section dropdown (8 preset sections with auto-fill rate)
- TDS amount auto-calculated = payment × rate/100
- Summary cards: Total Payments, TDS Deducted, Payable to Govt
- Section badge per row, Export PDF

**PAGE.TSX UPDATED**
- `apps/web/src/app/(site)/tools/[slug]/page.tsx`: all 6 A16 tools added to toolComponents map

---

## Tool Registry — All 22 Built Tools

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

---

## Next Task (Session A17 — Remaining AI Tools)

Build 5 remaining AI tools:

| Tool | Slug | Credits | Model |
|------|------|---------|-------|
| Thumbnail AI | thumbnail-ai | 7 | dall-e-3 |
| Website Generator | website-generator | 10 | claude-sonnet-4-5 |
| SEO Auditor | seo-auditor | 8 | claude-sonnet-4-5 |
| Appraisal Draft | appraisal-draft | 3 | claude-haiku-3-5 |
| Policy Generator | policy-generator | 3 | claude-haiku-3-5 |

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
