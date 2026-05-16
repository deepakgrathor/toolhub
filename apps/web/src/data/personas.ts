export interface PersonaTool {
  slug: string;
  name: string;
  icon: string;
  what: string;
  stat: string;
  isFree: boolean;
}

export interface PersonaStep {
  label: string;
  detail: string;
}

export interface PersonaStat {
  label: string;
  before: string;
  after: string;
}

export interface Persona {
  id: string;
  tab: string;
  name: string;
  role: string;
  city: string;
  quote: string;
  kitBadge: string;
  color: string;
  painStory: string;
  painChips: string[];
  steps: PersonaStep[];
  tools: PersonaTool[];
  stats: PersonaStat[];
  ctaText: string;
  ctaNote: string;
}

const hr: Persona = {
  id: "hr",
  tab: "HR Professional",
  name: "Sneha Patil",
  role: "HR Manager · Solo HR · 12-person firm",
  city: "Pune",
  quote:
    "I was drowning in paperwork. Now I actually have time to talk to people.",
  kitBadge: "HR Kit",
  color: "teal",
  painStory:
    "Sneha was the only HR at a fast-growing 12-person startup. Three roles open simultaneously, three hours per JD, manual resume reading, uncertain offer letters, and appraisal season meant rewriting the same paragraph twelve times with different names. Hiring felt like guesswork, and the paperwork never ended.",
  painChips: [
    "3 hrs per JD",
    "Manual resume reading",
    "Inconsistent offer letters",
    "Appraisal copy-paste nightmare",
    "Zero time for people",
  ],
  steps: [
    {
      label: "Open JD Generator",
      detail: "Role + seniority + skills → done in 1 min",
    },
    {
      label: "Screen Resumes",
      detail: "Upload batch → ranked shortlist instantly",
    },
    { label: "Send Offer", detail: "Branded offer letter in 1 minutes" },
    { label: "Run Appraisals", detail: "12 appraisal drafts in 5 minutes" },
  ],
  tools: [
    {
      slug: "jd-generator",
      name: "JD Generator",
      icon: "FileText",
      what: "Generates detailed job descriptions with role-specific skills and structure.",
      stat: "3.5 hrs → 1 min",
      isFree: false,
    },
    {
      slug: "resume-screener",
      name: "Resume Screener",
      icon: "Search",
      what: "Ranks candidates against JD criteria. Cuts manual screening completely.",
      stat: "2 days → 3 min",
      isFree: false,
    },
    {
      slug: "offer-letter",
      name: "Offer Letter",
      icon: "Mail",
      what: "Professional offer letters with company details auto-filled.",
      stat: "45 min → 2 min",
      isFree: false,
    },
    {
      slug: "appraisal-draft",
      name: "Appraisal Draft",
      icon: "ClipboardList",
      what: "Individual appraisal drafts for each employee in bulk.",
      stat: "12 appraisals in 5 min",
      isFree: false,
    },
  ],
  stats: [
    { label: "JD Creation Time", before: "3.5 hrs", after: "1 min" },
    { label: "Resumes Screened/day", before: "15", after: "80+" },
    { label: "Hours Saved/month", before: "0", after: "150 hrs" },
    { label: "Hiring Quality", before: "Inconsistent", after: "Structured" },
  ],
  ctaText: "Try HR Kit free",
  ctaNote: "10 free credits on signup",
};

const creator: Persona = {
  id: "creator",
  tab: "Creator",
  name: "Rahul Khanna",
  role: "Finance YouTuber · 180K subscribers · 2x/week",
  city: "Delhi",
  quote:
    "I missed 2 uploads. The algorithm punished me for a month. That will never happen again.",
  kitBadge: "Creator Kit",
  color: "violet",
  painStory:
    "Rahul was running a finance channel with 180K subscribers but burning 6 hours per script. He was paying a freelancer ₹500 per thumbnail — ₹4,000 a month just for images. Title research was guesswork. He missed two uploads in one month and watched his reach collapse. The content was good, but the process was killing him.",
  painChips: [
    "6 hrs per script",
    "₹4,000/mo on thumbnails",
    "Title guesswork",
    "Missed 2 uploads",
    "Algorithm penalty",
  ],
  steps: [
    {
      label: "Generate Title",
      detail: "Topic → 10 ranked title options in 30 sec",
    },
    { label: "Write Script", detail: "Outline + full script in 5 minutes" },
    {
      label: "Create Thumbnail",
      detail: "AI thumbnail — ₹10 credits vs ₹500 freelancer",
    },
    {
      label: "Repurpose Content",
      detail: "5 social posts from 1 video automatically",
    },
  ],
  tools: [
    {
      slug: "title-generator",
      name: "Title Generator",
      icon: "Type",
      what: "Generates 10 click-optimised titles ranked by engagement potential.",
      stat: "45 min → 30 sec",
      isFree: false,
    },
    {
      slug: "yt-script",
      name: "YT Script Writer",
      icon: "Video",
      what: "Full YouTube scripts with hook, body, and CTA. Finance-optimised.",
      stat: "6 hrs → 5 min",
      isFree: false,
    },
    {
      slug: "thumbnail-ai",
      name: "Thumbnail AI",
      icon: "Image",
      what: "DALL-E 3 powered thumbnails. Professional quality, no freelancer needed.",
      stat: "₹500/thumb → ₹10 credits",
      isFree: false,
    },
    {
      slug: "hook-writer",
      name: "Hook + Caption",
      icon: "Zap",
      what: "Hooks for Reels and captions for 5 platforms from one video topic.",
      stat: "0 → 5 posts per video",
      isFree: false,
    },
  ],
  stats: [
    { label: "Script Time", before: "6 hrs", after: "5 min" },
    { label: "Thumbnail Cost/mo", before: "₹4,000", after: "₹20" },
    { label: "Videos/month", before: "4–5", after: "30" },
    { label: "Upload Consistency", before: "Broken", after: "100%" },
  ],
  ctaText: "Try Creator Kit free",
  ctaNote: "10 free credits on signup",
};

const legal: Persona = {
  id: "legal",
  tab: "CA / Legal",
  name: "Adv. Anjali Mehta",
  role: "Solo Advocate · 20+ clients · High Court",
  city: "Mumbai",
  quote:
    "I was capped at 8 clients. Now I handle 22+ without working weekends.",
  kitBadge: "Legal Kit",
  color: "amber",
  painStory:
    "Anjali was a solo advocate handling 20+ clients but manually drafting every legal notice from scratch — pulling old files, rewriting facts, fixing formatting, generating PDFs. Each notice took 4 hours minimum. NDAs took 2 hours. She was turning away new clients not because she lacked skill, but because she had no time. She was capped at 8 active matters per month.",
  painChips: [
    "4 hrs per legal notice",
    "2 hrs per NDA",
    "Manual PDF formatting",
    "Capped at 8 clients/mo",
    "Turning away business",
  ],
  steps: [
    {
      label: "Draft Legal Notice",
      detail: "Facts + party details → formatted notice in 2 min",
    },
    {
      label: "Generate NDA",
      detail: "Parties + scope → watertight NDA in 2 min",
    },
    {
      label: "Download Branded PDF",
      detail: "Logo + signature + letterhead — one click",
    },
    {
      label: "GST Queries",
      detail: "Instant GST calculation for client queries",
    },
  ],
  tools: [
    {
      slug: "legal-notice",
      name: "Legal Notice",
      icon: "Scale",
      what: "Drafts legally structured notices using Claude Sonnet. Court-ready format.",
      stat: "4 hrs → 2 min",
      isFree: false,
    },
    {
      slug: "nda-generator",
      name: "NDA Generator",
      icon: "FileText",
      what: "Comprehensive NDAs with jurisdiction, duration, and penalty clauses.",
      stat: "2 hrs → 2 min",
      isFree: false,
    },
    {
      slug: "pdf-download",
      name: "Branded PDF",
      icon: "Download",
      what: "Outputs with firm logo, signature, and letterhead. Zero formatting time.",
      stat: "Formatting eliminated",
      isFree: false,
    },
    {
      slug: "gst-calculator",
      name: "GST Calculator",
      icon: "Calculator",
      what: "Instant GST breakdowns for any transaction. Answers client queries in 30 sec.",
      stat: "30 sec queries",
      isFree: true,
    },
  ],
  stats: [
    { label: "Legal Notice Time", before: "4 hrs", after: "2 min" },
    { label: "NDA Drafting", before: "2 hrs", after: "2 min" },
    { label: "Clients/month", before: "8", after: "22+" },
    { label: "Extra Revenue", before: "₹0", after: "+₹42,000" },
  ],
  ctaText: "Try Legal Kit free",
  ctaNote: "10 free credits on signup",
};

const sme: Persona = {
  id: "sme",
  tab: "SME Owner",
  name: "Vikram Gupta",
  role: "Wholesale Trading · 8 employees",
  city: "Surat",
  quote:
    "I was paying ₹3,000/month for invoicing. Now I do it myself in 3 minutes.",
  kitBadge: "SME Kit",
  color: "blue",
  painStory:
    "Vikram ran a wholesale trading business with 8 employees and was paying ₹3,000 a month to an accountant just for GST invoicing. GSTIN and HSN errors were causing client complaints. Salary slips were WhatsApp screenshots of an Excel file. Month-end was pure panic — three days of back-and-forth, mistakes, and stress.",
  painChips: [
    "₹3,000/mo accountant fee",
    "GSTIN/HSN errors",
    "Salary slips via WhatsApp Excel",
    "Month-end panic",
    "Client complaints on invoices",
  ],
  steps: [
    {
      label: "Create GST Invoice",
      detail: "GSTIN auto-validated, HSN auto-filled, PDF ready",
    },
    { label: "Generate Salary Slips", detail: "All 8 employees in 10 minutes" },
    {
      label: "Send Quotations",
      detail: "Professional PDF quotation in 1 minutes",
    },
    { label: "File TDS", detail: "TDS sheet generated, month-end sorted" },
  ],
  tools: [
    {
      slug: "gst-invoice",
      name: "GST Invoice",
      icon: "Receipt",
      what: "GST-compliant invoices with auto GSTIN validation and HSN codes.",
      stat: "25 min → 2 min",
      isFree: true,
    },
    {
      slug: "salary-slip",
      name: "Salary Slip",
      icon: "Wallet",
      what: "Professional salary slips for all employees. Download as PDF instantly.",
      stat: "8 slips in 10 min",
      isFree: true,
    },
    {
      slug: "quotation-generator",
      name: "Quotation",
      icon: "FileCheck",
      what: "Professional quotations with company branding and itemised pricing.",
      stat: "1 min, professional PDF",
      isFree: true,
    },
    {
      slug: "tds-sheet",
      name: "TDS Sheet",
      icon: "Table",
      what: "TDS calculation sheet for all deductees. Month-end ready in minutes.",
      stat: "4 hrs → 10 min",
      isFree: true,
    },
  ],
  stats: [
    { label: "Accountant Cost", before: "₹3,000/mo", after: "₹0" },
    { label: "Invoice Time", before: "25 min", after: "2 min" },
    { label: "GST Errors", before: "Regular", after: "Zero" },
    { label: "Month-end Stress", before: "High", after: "Gone" },
  ],
  ctaText: "Try SME Kit free",
  ctaNote: "All SME tools are free · No credits needed",
};

const marketer: Persona = {
  id: "marketing",
  tab: "Marketer",
  name: "Priya Sharma",
  role: "Agency Founder · 3-person team · 4 clients",
  city: "Bangalore",
  quote:
    "I turned away 2 clients because I had no capacity. That was the last time.",
  kitBadge: "Marketing Kit",
  color: "pink",
  painStory:
    "Priya ran a 3-person agency with 4 clients and was spending 3 hours per client on ad copy alone. Her SEO tool cost ₹8,000 a month. LinkedIn content was always the first thing cut when time ran out. She turned away 2 potential clients in one quarter simply because there was no capacity — not because the work wasn't there.",
  painChips: [
    "3 hrs ad copy per client",
    "₹8,000/mo SEO tool",
    "LinkedIn always deferred",
    "Turned away 2 clients",
    "No capacity to grow",
  ],
  steps: [
    { label: "Write Ad Copy", detail: "5 variants per client in 2 minutes" },
    {
      label: "Run SEO Audit",
      detail: "Full site audit — pay per use, not subscription",
    },
    {
      label: "Build LinkedIn",
      detail: "Founder bio = new upsell service at ₹5,000",
    },
    {
      label: "Email Campaigns",
      detail: "10 subject variants, +22% open rate average",
    },
  ],
  tools: [
    {
      slug: "ad-copy",
      name: "Ad Copy Writer",
      icon: "Megaphone",
      what: "Generates 5 ad variants per brief. Facebook, Google, Instagram ready.",
      stat: "3 hrs → 2 min per client",
      isFree: false,
    },
    {
      slug: "seo-auditor",
      name: "SEO Auditor",
      icon: "BarChart2",
      what: "Full site audit powered by GPT-4o. Pay per audit, not ₹8,000/month.",
      stat: "₹8,000/mo → pay per use",
      isFree: false,
    },
    {
      slug: "linkedin-bio",
      name: "LinkedIn Bio",
      icon: "Linkedin",
      what: "Founder and executive bios that convert. New upsell for agency clients.",
      stat: "New service at ₹5,000/bio",
      isFree: false,
    },
    {
      slug: "email-subject",
      name: "Email Subject",
      icon: "AtSign",
      what: "10 subject line variants per campaign. Average +22% open rate improvement.",
      stat: "+22% open rate avg",
      isFree: false,
    },
  ],
  stats: [
    { label: "Active Clients", before: "4", after: "11" },
    { label: "SEO Tool Cost", before: "₹8,000/mo", after: "Pay per use" },
    { label: "Ad Copy Time/client", before: "3 hrs", after: "5 min" },
    { label: "Revenue", before: "Capped", after: "+₹85,000" },
  ],
  ctaText: "Try Marketing Kit free",
  ctaNote: "10 free credits on signup",
};

export const personas: Persona[] = [hr, creator, legal, sme, marketer];
