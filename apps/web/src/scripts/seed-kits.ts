/**
 * Seed kits collection + migrate existing tools with formFields, type, kitSlug, etc.
 * Run: MONGODB_URI="..." npx tsx apps/web/src/scripts/seed-kits.ts
 * Safe to re-run — uses upsert.
 */

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) { console.error("MONGODB_URI not set"); process.exit(1); }

// ── Minimal schemas for this script ──────────────────────────────────────────

const KitSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true },
    name: String, description: String,
    icon: String, color: String,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    showInOnboarding: { type: Boolean, default: true },
    onboardingLabel: String,
    onboardingDescription: String,
    onboardingIcon: String,
  },
  { timestamps: true }
);

const ToolSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true },
    name: String, description: String,
    category: String, kits: [String],
    isAI: Boolean, isFree: Boolean, icon: String,
    type: { type: String, default: "ai" },
    kitSlug: String,
    kitRef: mongoose.Schema.Types.ObjectId,
    aiModel: String,
    systemPrompt: String,
    promptTemplate: String,
    formFields: [mongoose.Schema.Types.Mixed],
    outputType: String,
    outputLabel: String,
    color: String,
    tags: [String],
    maxOutputTokens: Number,
    temperature: Number,
    dailyLimit: Number,
    requiredPlan: String,
  },
  { timestamps: true }
);

const Kit   = mongoose.models.Kit   ?? mongoose.model("Kit",  KitSchema);
const Tool  = mongoose.models.Tool  ?? mongoose.model("Tool", ToolSchema);

// ── Kit seed data ─────────────────────────────────────────────────────────────

const KITS = [
  {
    slug: "creator", name: "Creator Kit",
    description: "For bloggers, YouTubers, and content creators",
    icon: "Video", color: "#7c3aed", order: 1,
    showInOnboarding: true,
    onboardingLabel: "Creator",
    onboardingDescription: "Bloggers, YouTubers, Influencers",
    onboardingIcon: "Video",
  },
  {
    slug: "sme", name: "SME Kit",
    description: "For small and medium businesses",
    icon: "Briefcase", color: "#2563eb", order: 2,
    showInOnboarding: true,
    onboardingLabel: "Business Owner",
    onboardingDescription: "SMEs, Startups, Shop Owners",
    onboardingIcon: "Briefcase",
  },
  {
    slug: "hr", name: "HR Kit",
    description: "For HR professionals and recruiters",
    icon: "Users", color: "#16a34a", order: 3,
    showInOnboarding: true,
    onboardingLabel: "HR Pro",
    onboardingDescription: "HR Managers, Recruiters, People Ops",
    onboardingIcon: "Users",
  },
  {
    slug: "legal", name: "Legal Kit",
    description: "For CAs, lawyers, and legal professionals",
    icon: "Scale", color: "#dc2626", order: 4,
    showInOnboarding: true,
    onboardingLabel: "CA / Legal",
    onboardingDescription: "CAs, Lawyers, Compliance Teams",
    onboardingIcon: "Scale",
  },
  {
    slug: "marketing", name: "Marketing Kit",
    description: "For marketers and growth professionals",
    icon: "TrendingUp", color: "#ea580c", order: 5,
    showInOnboarding: true,
    onboardingLabel: "Marketer",
    onboardingDescription: "Digital Marketers, Growth Hackers, Agencies",
    onboardingIcon: "TrendingUp",
  },
];

// ── Tool definitions ──────────────────────────────────────────────────────────

type ToolDef = {
  slug: string;
  type: "ai" | "client-side";
  kitSlug: string;
  aiModel?: string;
  systemPrompt?: string;
  promptTemplate?: string;
  formFields?: object[];
  outputType?: string;
  outputLabel?: string;
  tags?: string[];
  maxOutputTokens?: number;
  temperature?: number;
  dailyLimit?: number;
};

const AI_TOOLS: ToolDef[] = [
  {
    slug: "blog-generator", type: "ai", kitSlug: "creator",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are an expert blog writer who creates engaging, SEO-optimised blog posts. Format with proper headings, subheadings, and paragraphs. Write in the specified tone and target the given keywords naturally.",
    promptTemplate: "Write a {{tone}} blog post about '{{topic}}' in approximately {{wordCount}} words.{{#keywords}}\nTarget keywords (weave in naturally): {{keywords}}{{/keywords}}\nFormat with H2/H3 headings, short paragraphs, and a compelling intro and conclusion.",
    outputType: "text", outputLabel: "Generated Blog Post",
    tags: ["time_saving", "content", "creator"], maxOutputTokens: 3000, temperature: 0.7,
    formFields: [
      { key: "topic",     label: "Blog Topic",              type: "text",     placeholder: "e.g. AI trends in 2026",          required: true,  order: 1 },
      { key: "tone",      label: "Tone",                    type: "select",   options: ["Professional","Casual","Informative","Persuasive","Inspirational"], required: true, order: 2 },
      { key: "wordCount", label: "Word Count",              type: "number",   defaultValue: "800",                             required: false, order: 3 },
      { key: "keywords",  label: "Target Keywords (optional)", type: "text", placeholder: "AI, automation, future",           required: false, order: 4, helpText: "Comma-separated for SEO optimisation" },
    ],
  },
  {
    slug: "yt-script", type: "ai", kitSlug: "creator",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are a professional YouTube scriptwriter. Write engaging, structured video scripts with hooks, main content, and CTAs. Include [PAUSE], [CUT TO], and [B-ROLL] cues where appropriate.",
    promptTemplate: "Write a {{style}} YouTube video script about '{{topic}}' for a {{duration}} video.\nTarget audience: {{audience}}\nInclude: hook, main content sections, transitions, and a CTA at the end.",
    outputType: "text", outputLabel: "YouTube Script",
    tags: ["time_saving", "content", "creator"], maxOutputTokens: 3000, temperature: 0.75,
    formFields: [
      { key: "topic",    label: "Video Topic",    type: "text",   placeholder: "e.g. How to start a YouTube channel",              required: true,  order: 1 },
      { key: "style",    label: "Video Style",    type: "select", options: ["Educational","Entertaining","Tutorial","Review","Vlog"], required: true,  order: 2 },
      { key: "duration", label: "Video Duration", type: "select", options: ["5-7 minutes","8-12 minutes","13-20 minutes"],           required: true,  order: 3 },
      { key: "audience", label: "Target Audience", type: "text", placeholder: "e.g. Beginner content creators",                    required: false, order: 4 },
    ],
  },
  {
    slug: "thumbnail-ai", type: "ai", kitSlug: "creator",
    aiModel: "dall-e-3",
    systemPrompt: "Generate a high-quality YouTube thumbnail image that is eye-catching, bold, and optimised for click-through rates.",
    promptTemplate: "Create a YouTube thumbnail for a video titled '{{title}}'. Style: {{style}}. Include bold text overlay saying '{{textOverlay}}'. Make it vibrant, high contrast, and visually striking.",
    outputType: "image", outputLabel: "Thumbnail Image",
    tags: ["quality", "content", "creator"], maxOutputTokens: 1, temperature: 0.9, dailyLimit: 5,
    formFields: [
      { key: "title",       label: "Video Title",   type: "text",   placeholder: "e.g. 10 AI Tools That Will Change Your Life", required: true,  order: 1 },
      { key: "style",       label: "Style",         type: "select", options: ["Tech & Futuristic","Bold & Bright","Minimal & Clean","Dramatic & Dark"], required: true, order: 2 },
      { key: "textOverlay", label: "Text Overlay",  type: "text",   placeholder: "e.g. SHOCKING TRUTH",                        required: false, order: 3 },
    ],
  },
  {
    slug: "title-generator", type: "ai", kitSlug: "creator",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are a viral content title expert. Generate highly clickable, SEO-optimised titles that balance curiosity, value, and relevance.",
    promptTemplate: "Generate {{count}} {{tone}} YouTube/blog titles about '{{topic}}'.\nMake them click-worthy, specific, and SEO-friendly.\nReturn as a numbered list.",
    outputType: "text", outputLabel: "Generated Titles",
    tags: ["time_saving", "content", "creator"], maxOutputTokens: 800, temperature: 0.9,
    formFields: [
      { key: "topic", label: "Topic / Keyword",   type: "text",   placeholder: "e.g. Home workouts for beginners",   required: true,  order: 1 },
      { key: "tone",  label: "Style",              type: "select", options: ["Curiosity","How-To","Listicle","Question","Bold Claim"], required: true, order: 2 },
      { key: "count", label: "Number of Titles",  type: "number", defaultValue: "10",                                required: false, order: 3 },
    ],
  },
  {
    slug: "hook-writer", type: "ai", kitSlug: "creator",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are a viral hook writing expert. Create irresistible opening lines that stop the scroll and compel viewers/readers to keep watching or reading.",
    promptTemplate: "Write {{count}} powerful {{hookType}} hooks for content about '{{topic}}' on {{platform}}.\nMake each hook under 2 sentences, attention-grabbing, and platform-appropriate.\nReturn as a numbered list.",
    outputType: "text", outputLabel: "Generated Hooks",
    tags: ["time_saving", "content", "creator", "marketing"], maxOutputTokens: 800, temperature: 0.9,
    formFields: [
      { key: "topic",    label: "Content Topic",  type: "text",   placeholder: "e.g. Morning productivity routine",                        required: true,  order: 1 },
      { key: "platform", label: "Platform",       type: "select", options: ["YouTube","Instagram Reels","LinkedIn","Twitter/X","Blog"],     required: true,  order: 2 },
      { key: "hookType", label: "Hook Style",     type: "select", options: ["Curiosity","Shocking Stat","Story","Question","Bold Claim"],   required: true,  order: 3 },
      { key: "count",    label: "Number of Hooks", type: "number", defaultValue: "5",                                                      required: false, order: 4 },
    ],
  },
  {
    slug: "caption-generator", type: "ai", kitSlug: "creator",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are a social media copywriter who creates engaging, on-brand captions that drive engagement, shares, and follows.",
    promptTemplate: "Write a {{tone}} {{platform}} caption for the following content:\n{{content}}\n\nHashtags: {{hashtags}}\nOptimise for engagement. Keep platform character limits in mind.",
    outputType: "text", outputLabel: "Generated Caption",
    tags: ["time_saving", "content", "creator", "marketing"], maxOutputTokens: 500, temperature: 0.85,
    formFields: [
      { key: "content",  label: "Describe Your Post",  type: "textarea", placeholder: "e.g. A photo of my new café launch in Delhi", required: true,  order: 1 },
      { key: "platform", label: "Platform",            type: "select",   options: ["Instagram","LinkedIn","Twitter/X","Facebook","YouTube"], required: true, order: 2 },
      { key: "tone",     label: "Tone",                type: "select",   options: ["Casual","Professional","Funny","Inspirational","Promotional"], required: true, order: 3 },
      { key: "hashtags", label: "Include Hashtags?",   type: "select",   options: ["Yes, include 5-10 hashtags","No hashtags"],         required: false, order: 4 },
    ],
  },
  {
    slug: "jd-generator", type: "ai", kitSlug: "hr",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are an expert HR professional. Write clear, inclusive, and compelling job descriptions that attract the right candidates.",
    promptTemplate: "Write a professional job description for:\nJob Title: {{jobTitle}}\nDepartment: {{department}}\nExperience Required: {{experience}}\nKey Skills: {{skills}}\nLocation: {{location}}\n\nInclude: role overview, responsibilities, requirements, and what we offer.",
    outputType: "text", outputLabel: "Job Description",
    tags: ["time_saving", "hr"], maxOutputTokens: 1500, temperature: 0.65,
    formFields: [
      { key: "jobTitle",   label: "Job Title",          type: "text",     placeholder: "e.g. Senior Software Engineer",      required: true,  order: 1 },
      { key: "department", label: "Department",         type: "text",     placeholder: "e.g. Engineering",                   required: true,  order: 2 },
      { key: "experience", label: "Experience Required",type: "text",     placeholder: "e.g. 3-5 years",                     required: true,  order: 3 },
      { key: "skills",     label: "Key Skills",         type: "textarea", placeholder: "e.g. React, Node.js, AWS, MongoDB",  required: true,  order: 4 },
      { key: "location",   label: "Location",           type: "text",     placeholder: "e.g. Remote / Bangalore",            required: false, order: 5 },
    ],
  },
  {
    slug: "resume-screener", type: "ai", kitSlug: "hr",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are an expert recruiter and HR professional. Analyse resumes against job requirements and provide structured, fair evaluations.",
    promptTemplate: "Screen this resume against the job description:\n\nJOB DESCRIPTION:\n{{jobDescription}}\n\nRESUME:\n{{resumeText}}\n\nProvide: Match Score (0-100%), Key Strengths, Gaps/Concerns, and Hire Recommendation (Strong Yes/Maybe/No with reasoning).",
    outputType: "text", outputLabel: "Screening Report",
    tags: ["quality", "hr", "team"], maxOutputTokens: 1200, temperature: 0.5,
    formFields: [
      { key: "jobDescription", label: "Job Description",    type: "textarea", placeholder: "Paste the full job description here...", required: true, order: 1 },
      { key: "resumeText",     label: "Candidate Resume",   type: "textarea", placeholder: "Paste the candidate's resume here...",   required: true, order: 2 },
    ],
  },
  {
    slug: "appraisal-draft", type: "ai", kitSlug: "hr",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are an experienced HR manager who writes professional, constructive, and motivating performance appraisals.",
    promptTemplate: "Write a performance appraisal for:\nEmployee: {{employeeName}}\nRole: {{role}}\nPeriod: {{period}}\nRating: {{rating}}\nKey Achievements: {{achievements}}\nAreas for Improvement: {{improvements}}\n\nWrite in professional tone, be specific and constructive.",
    outputType: "text", outputLabel: "Appraisal Draft",
    tags: ["quality", "hr", "time_saving"], maxOutputTokens: 1500, temperature: 0.6,
    formFields: [
      { key: "employeeName",  label: "Employee Name",         type: "text",     placeholder: "e.g. Rahul Sharma",                        required: true,  order: 1 },
      { key: "role",          label: "Job Role",              type: "text",     placeholder: "e.g. Senior Developer",                    required: true,  order: 2 },
      { key: "period",        label: "Appraisal Period",      type: "text",     placeholder: "e.g. Jan–Dec 2025",                        required: true,  order: 3 },
      { key: "rating",        label: "Overall Rating",        type: "select",   options: ["Exceptional","Exceeds Expectations","Meets Expectations","Needs Improvement"], required: true, order: 4 },
      { key: "achievements",  label: "Key Achievements",      type: "textarea", placeholder: "List key projects and accomplishments...", required: true,  order: 5 },
      { key: "improvements",  label: "Areas for Growth",      type: "textarea", placeholder: "Areas where improvement is expected...",   required: false, order: 6 },
    ],
  },
  {
    slug: "policy-generator", type: "ai", kitSlug: "hr",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are an expert HR policy writer. Create comprehensive, legally sound, and employee-friendly policies.",
    promptTemplate: "Create a {{policyType}} policy for {{companyName}}, a {{industry}} company with {{teamSize}} employees.\nAdditional requirements: {{requirements}}\n\nFormat professionally with sections, sub-sections, and clear language.",
    outputType: "text", outputLabel: "HR Policy Document",
    tags: ["compliance", "hr"], maxOutputTokens: 2000, temperature: 0.5,
    formFields: [
      { key: "policyType",    label: "Policy Type",        type: "select",   options: ["Leave Policy","Work From Home Policy","Code of Conduct","Anti-Harassment Policy","IT & Data Policy","Expense Reimbursement Policy"], required: true, order: 1 },
      { key: "companyName",   label: "Company Name",       type: "text",     placeholder: "e.g. Acme Technologies Pvt. Ltd.",     required: true,  order: 2 },
      { key: "industry",      label: "Industry",           type: "text",     placeholder: "e.g. IT Services",                     required: true,  order: 3 },
      { key: "teamSize",      label: "Team Size",          type: "select",   options: ["1-10","11-50","51-200","200+"],             required: true,  order: 4 },
      { key: "requirements",  label: "Special Requirements", type: "textarea", placeholder: "Any specific clauses or rules...", required: false, order: 5 },
    ],
  },
  {
    slug: "legal-notice", type: "ai", kitSlug: "legal",
    aiModel: "claude-haiku-3-5",
    systemPrompt: "You are an expert legal writer in India. Draft formal, legally sound notices following Indian legal conventions.",
    promptTemplate: "Draft a legal notice for:\nType: {{noticeType}}\nFrom: {{senderName}}\nTo: {{recipientName}}\nSubject: {{subject}}\nDetails: {{details}}\nRelief Sought: {{relief}}\n\nUse formal legal language, cite applicable laws, include demand period and consequences.",
    outputType: "text", outputLabel: "Legal Notice",
    tags: ["compliance", "legal"], maxOutputTokens: 2000, temperature: 0.4,
    formFields: [
      { key: "noticeType",    label: "Notice Type",    type: "select",   options: ["Payment Recovery","Property Dispute","Service Deficiency","Contract Breach","Cheque Bounce (NI Act)","Employment Dispute"], required: true, order: 1 },
      { key: "senderName",    label: "Sender Name",    type: "text",     placeholder: "e.g. Rajesh Kumar / ABC Pvt. Ltd.",  required: true,  order: 2 },
      { key: "recipientName", label: "Recipient Name", type: "text",     placeholder: "e.g. Suresh Singh",                  required: true,  order: 3 },
      { key: "subject",       label: "Subject Matter", type: "text",     placeholder: "e.g. Non-payment of ₹50,000 invoice", required: true, order: 4 },
      { key: "details",       label: "Detailed Facts", type: "textarea", placeholder: "Describe the full situation...",      required: true,  order: 5 },
      { key: "relief",        label: "Relief Sought",  type: "textarea", placeholder: "What do you want them to do?",        required: true,  order: 6 },
    ],
  },
  {
    slug: "nda-generator", type: "ai", kitSlug: "legal",
    aiModel: "claude-haiku-3-5",
    systemPrompt: "You are a legal expert specialising in Non-Disclosure Agreements under Indian law. Draft comprehensive, enforceable NDAs.",
    promptTemplate: "Draft an NDA between:\nParty 1: {{party1}}\nParty 2: {{party2}}\nPurpose: {{purpose}}\nDuration: {{duration}}\nType: {{ndaType}}\n\nInclude: definitions, obligations, exceptions, term, jurisdiction (India), signature blocks.",
    outputType: "text", outputLabel: "NDA Document",
    tags: ["compliance", "legal"], maxOutputTokens: 2500, temperature: 0.35,
    formFields: [
      { key: "party1",   label: "Disclosing Party",    type: "text",     placeholder: "e.g. TechCorp Pvt. Ltd.",                  required: true,  order: 1 },
      { key: "party2",   label: "Receiving Party",     type: "text",     placeholder: "e.g. John Doe",                            required: true,  order: 2 },
      { key: "purpose",  label: "Purpose of Sharing",  type: "textarea", placeholder: "e.g. Exploring a business partnership...", required: true,  order: 3 },
      { key: "duration", label: "Confidentiality Period", type: "text",  placeholder: "e.g. 2 years from signing",                required: true,  order: 4 },
      { key: "ndaType",  label: "NDA Type",            type: "select",   options: ["Mutual (both parties)","One-way (Disclosing → Receiving)"], required: true, order: 5 },
    ],
  },
  {
    slug: "legal-disclaimer", type: "ai", kitSlug: "legal",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are a legal expert who drafts clear, comprehensive disclaimers for businesses and websites.",
    promptTemplate: "Write a {{disclaimerType}} disclaimer for:\nBusiness: {{businessName}}\nIndustry: {{industry}}\nAdditional context: {{context}}\n\nMake it comprehensive, legally sound, and easy to understand.",
    outputType: "text", outputLabel: "Legal Disclaimer",
    tags: ["compliance", "legal"], maxOutputTokens: 1200, temperature: 0.4,
    formFields: [
      { key: "disclaimerType", label: "Disclaimer Type",  type: "select",   options: ["Website Disclaimer","Medical/Health Disclaimer","Financial Disclaimer","AI/Technology Disclaimer","Affiliate Disclaimer","General Business Disclaimer"], required: true, order: 1 },
      { key: "businessName",   label: "Business Name",    type: "text",     placeholder: "e.g. HealthBot AI",                  required: true,  order: 2 },
      { key: "industry",       label: "Industry/Niche",   type: "text",     placeholder: "e.g. Health & Wellness",             required: true,  order: 3 },
      { key: "context",        label: "Additional Context", type: "textarea", placeholder: "Any specific risks or limitations?", required: false, order: 4 },
    ],
  },
  {
    slug: "whatsapp-bulk", type: "ai", kitSlug: "sme",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are a WhatsApp marketing expert. Write concise, engaging messages that feel personal and drive action — not spammy.",
    promptTemplate: "Write {{count}} WhatsApp message templates for:\nPurpose: {{purpose}}\nProduct/Service: {{productService}}\nOffer/News: {{offer}}\nTone: {{tone}}\n\nKeep each under 160 words. Use simple language. Include a clear CTA. Avoid sounding spammy.",
    outputType: "text", outputLabel: "WhatsApp Messages",
    tags: ["time_saving", "sme", "marketing"], maxOutputTokens: 1200, temperature: 0.8,
    formFields: [
      { key: "purpose",       label: "Message Purpose",   type: "select",   options: ["Promotional Offer","New Product Launch","Festival Greetings","Order Update","Appointment Reminder","Feedback Request"], required: true, order: 1 },
      { key: "productService",label: "Your Product/Service", type: "text", placeholder: "e.g. Traditional sweets shop",        required: true,  order: 2 },
      { key: "offer",         label: "Offer / Key Message", type: "text",  placeholder: "e.g. 20% off on Diwali orders",       required: true,  order: 3 },
      { key: "tone",          label: "Tone",              type: "select",   options: ["Friendly","Professional","Festive","Urgent"], required: true, order: 4 },
      { key: "count",         label: "Number of Messages", type: "number", defaultValue: "3",                                  required: false, order: 5 },
    ],
  },
  {
    slug: "ad-copy", type: "ai", kitSlug: "marketing",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are a performance marketing copywriter specialising in high-converting ads for Indian businesses.",
    promptTemplate: "Write {{count}} {{adFormat}} ad copy variations for:\nProduct/Service: {{product}}\nTarget Audience: {{audience}}\nKey Benefit: {{benefit}}\nPlatform: {{platform}}\nTone: {{tone}}\n\nInclude headline, body copy, and CTA. Optimise for click-through rate.",
    outputType: "text", outputLabel: "Ad Copy Variations",
    tags: ["quality", "marketing", "time_saving"], maxOutputTokens: 1200, temperature: 0.85,
    formFields: [
      { key: "product",   label: "Product / Service",    type: "text",     placeholder: "e.g. Online yoga classes",        required: true,  order: 1 },
      { key: "platform",  label: "Ad Platform",          type: "select",   options: ["Facebook/Instagram","Google Search","LinkedIn","YouTube","WhatsApp"], required: true, order: 2 },
      { key: "audience",  label: "Target Audience",      type: "text",     placeholder: "e.g. Working women 25-40",        required: true,  order: 3 },
      { key: "benefit",   label: "Key Benefit / USP",    type: "text",     placeholder: "e.g. Lose 5kg in 30 days",        required: true,  order: 4 },
      { key: "tone",      label: "Tone",                 type: "select",   options: ["Persuasive","Emotional","Direct","Humorous","Urgency"], required: true, order: 5 },
      { key: "adFormat",  label: "Ad Format",            type: "select",   options: ["Standard","Carousel","Story","Search"], required: false, order: 6 },
      { key: "count",     label: "Variations",           type: "number",   defaultValue: "3",                               required: false, order: 7 },
    ],
  },
  {
    slug: "email-subject", type: "ai", kitSlug: "marketing",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are an email marketing expert who writes subject lines that maximise open rates.",
    promptTemplate: "Write {{count}} email subject lines for this campaign:\nEmail Content/Purpose: {{emailContent}}\nTarget Audience: {{audience}}\nTone: {{tone}}\n\nReturn as a numbered list. Include open rate tips in brackets after each.",
    outputType: "text", outputLabel: "Email Subject Lines",
    tags: ["time_saving", "marketing"], maxOutputTokens: 600, temperature: 0.9,
    formFields: [
      { key: "emailContent", label: "Email Purpose / Content", type: "textarea", placeholder: "e.g. Announcing 50% sale on all products this weekend", required: true, order: 1 },
      { key: "audience",     label: "Target Audience",         type: "text",     placeholder: "e.g. Existing customers",         required: false, order: 2 },
      { key: "tone",         label: "Tone",                    type: "select",   options: ["Curiosity","Urgency","Benefit-driven","Personal","Funny"], required: true, order: 3 },
      { key: "count",        label: "Number of Subject Lines", type: "number",   defaultValue: "10",                              required: false, order: 4 },
    ],
  },
  {
    slug: "linkedin-bio", type: "ai", kitSlug: "marketing",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are a personal branding expert who writes compelling LinkedIn profiles that attract opportunities.",
    promptTemplate: "Write a compelling LinkedIn About section for:\nName: {{name}}\nCurrent Role: {{role}}\nExperience Summary: {{experience}}\nKey Skills: {{skills}}\nGoal: {{goal}}\n\nWrite in first person, 2-3 paragraphs, under 2600 characters. Include a subtle CTA.",
    outputType: "text", outputLabel: "LinkedIn Bio",
    tags: ["quality", "marketing"], maxOutputTokens: 800, temperature: 0.7,
    formFields: [
      { key: "name",       label: "Your Name",                type: "text",     placeholder: "e.g. Priya Sharma",                          required: true,  order: 1 },
      { key: "role",       label: "Current / Target Role",    type: "text",     placeholder: "e.g. Product Manager at TechCorp",           required: true,  order: 2 },
      { key: "experience", label: "Experience Summary",       type: "textarea", placeholder: "e.g. 5 years in SaaS, led 3 product launches", required: true, order: 3 },
      { key: "skills",     label: "Top Skills",               type: "text",     placeholder: "e.g. Product Strategy, Data Analysis, Agile", required: true,  order: 4 },
      { key: "goal",       label: "Professional Goal",        type: "text",     placeholder: "e.g. Connect with founders and investors",    required: false, order: 5 },
    ],
  },
  {
    slug: "seo-auditor", type: "ai", kitSlug: "marketing",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are an SEO expert. Provide actionable, structured SEO audits based on the information provided.",
    promptTemplate: "Conduct an SEO audit for:\nWebsite/Page: {{url}}\nIndustry: {{industry}}\nTarget Keywords: {{keywords}}\nCurrent Issues (if known): {{issues}}\n\nProvide: On-page SEO checklist, keyword opportunities, technical issues to fix, and top 5 priority actions.",
    outputType: "text", outputLabel: "SEO Audit Report",
    tags: ["quality", "marketing"], maxOutputTokens: 2000, temperature: 0.5,
    formFields: [
      { key: "url",      label: "Website / Page URL",    type: "text",     placeholder: "e.g. https://mystore.in/products",          required: true,  order: 1 },
      { key: "industry", label: "Industry / Niche",      type: "text",     placeholder: "e.g. E-commerce, Fashion",                  required: true,  order: 2 },
      { key: "keywords", label: "Target Keywords",       type: "text",     placeholder: "e.g. women kurta, ethnic wear online",       required: true,  order: 3 },
      { key: "issues",   label: "Known Issues (optional)", type: "textarea", placeholder: "e.g. low traffic, not ranking for keywords", required: false, order: 4 },
    ],
  },
  {
    slug: "website-generator", type: "ai", kitSlug: "sme",
    aiModel: "gpt-4o",
    systemPrompt: "You are an expert web developer and designer. Generate complete, beautiful, responsive single-page HTML websites with embedded CSS and JavaScript.",
    promptTemplate: "Create a complete HTML website for:\nBusiness: {{businessName}}\nType: {{businessType}}\nKey Features/Sections: {{features}}\nColor Scheme: {{colorScheme}}\nTone: {{tone}}\n\nReturn ONLY the complete HTML code starting with <!DOCTYPE html>. No explanations.",
    outputType: "html", outputLabel: "Generated Website",
    tags: ["quality", "sme"], maxOutputTokens: 4000, temperature: 0.6, dailyLimit: 3,
    formFields: [
      { key: "businessName", label: "Business Name",      type: "text",     placeholder: "e.g. Sharma Sweets & Snacks",             required: true,  order: 1 },
      { key: "businessType", label: "Business Type",      type: "select",   options: ["Restaurant/Food","Retail Shop","Service Business","Freelancer/Portfolio","Startup","Healthcare","Education"], required: true, order: 2 },
      { key: "features",     label: "Sections / Features", type: "textarea", placeholder: "e.g. About us, Menu, Gallery, Contact form", required: true, order: 3 },
      { key: "colorScheme",  label: "Color Scheme",       type: "select",   options: ["Purple & Dark (Modern)","Blue & White (Professional)","Green & White (Fresh)","Orange & Warm (Vibrant)","Black & Gold (Premium)"], required: false, order: 4 },
      { key: "tone",         label: "Tone / Style",       type: "select",   options: ["Modern & Minimal","Traditional & Warm","Bold & Energetic","Professional & Corporate"], required: false, order: 5 },
    ],
  },
  {
    slug: "offer-letter", type: "ai", kitSlug: "hr",
    aiModel: "gemini-flash-2.0",
    systemPrompt: "You are an HR professional who drafts formal, comprehensive employment offer letters following Indian labour law conventions.",
    promptTemplate: "Draft an offer letter for:\nEmployee: {{employeeName}}\nRole: {{role}}\nDepartment: {{department}}\nCTC: {{ctc}}\nStart Date: {{startDate}}\nCompany: {{companyName}}\nLocation: {{location}}\n\nInclude: role, compensation, joining date, reporting manager note, conditions of offer.",
    outputType: "text", outputLabel: "Offer Letter",
    tags: ["time_saving", "hr", "compliance"], maxOutputTokens: 1500, temperature: 0.5,
    formFields: [
      { key: "employeeName", label: "Candidate Name",   type: "text",   placeholder: "e.g. Anjali Verma",          required: true,  order: 1 },
      { key: "role",         label: "Job Role",         type: "text",   placeholder: "e.g. Marketing Manager",     required: true,  order: 2 },
      { key: "department",   label: "Department",       type: "text",   placeholder: "e.g. Marketing",             required: true,  order: 3 },
      { key: "ctc",          label: "Annual CTC (₹)",   type: "text",   placeholder: "e.g. ₹8,00,000 per annum",  required: true,  order: 4 },
      { key: "startDate",    label: "Joining Date",     type: "text",   placeholder: "e.g. 1 June 2026",           required: true,  order: 5 },
      { key: "companyName",  label: "Company Name",     type: "text",   placeholder: "e.g. Nexus Solutions Pvt. Ltd.", required: true, order: 6 },
      { key: "location",     label: "Work Location",    type: "text",   placeholder: "e.g. Bangalore / Remote",    required: false, order: 7 },
    ],
  },
];

const CLIENT_SIDE_TOOLS: ToolDef[] = [
  { slug: "gst-invoice",         type: "client-side", kitSlug: "sme",   tags: ["compliance","cost","sme"] },
  { slug: "expense-tracker",     type: "client-side", kitSlug: "sme",   tags: ["cost","sme","time_saving"] },
  { slug: "quotation-generator", type: "client-side", kitSlug: "sme",   tags: ["time_saving","cost","sme"] },
  { slug: "salary-slip",         type: "client-side", kitSlug: "hr",    tags: ["compliance","hr","time_saving"] },
  { slug: "tds-sheet",           type: "client-side", kitSlug: "legal", tags: ["compliance","cost","legal"] },
  { slug: "qr-generator",        type: "client-side", kitSlug: "sme",   tags: ["time_saving","sme"] },
  { slug: "gst-calculator",      type: "client-side", kitSlug: "legal", tags: ["compliance","cost","legal","sme"] },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri!);
  console.log("Connected.\n");

  // ── 1. Upsert kits ────────────────────────────────────────────────────────
  console.log("Seeding kits...");
  for (const kit of KITS) {
    await Kit.updateOne({ slug: kit.slug }, { $set: kit }, { upsert: true });
    console.log(`  ✓ Kit: ${kit.slug}`);
  }

  // ── 2. Build kit slug → _id map ───────────────────────────────────────────
  const kitDocs = await Kit.find({ slug: { $in: KITS.map(k => k.slug) } }).lean();
  const kitMap = new Map<string, string>(
    (kitDocs as unknown as Array<{ slug: string; _id: { toString(): string } }>).map(k => [k.slug, k._id.toString()])
  );
  console.log(`\nKit IDs mapped: ${kitMap.size}\n`);

  // ── 3. Update AI tools ────────────────────────────────────────────────────
  console.log("Updating AI tools...");
  for (const tool of AI_TOOLS) {
    const kitId = kitMap.get(tool.kitSlug);
    const update: Record<string, unknown> = {
      type: tool.type,
      kitSlug: tool.kitSlug,
      ...(kitId ? { kitRef: kitId } : {}),
      ...(tool.aiModel       ? { aiModel: tool.aiModel }             : {}),
      ...(tool.systemPrompt  ? { systemPrompt: tool.systemPrompt }   : {}),
      ...(tool.promptTemplate? { promptTemplate: tool.promptTemplate}: {}),
      ...(tool.formFields    ? { formFields: tool.formFields }       : {}),
      ...(tool.outputType    ? { outputType: tool.outputType }       : {}),
      ...(tool.outputLabel   ? { outputLabel: tool.outputLabel }     : {}),
      ...(tool.tags          ? { tags: tool.tags }                   : {}),
      ...(tool.maxOutputTokens !== undefined ? { maxOutputTokens: tool.maxOutputTokens } : {}),
      ...(tool.temperature   !== undefined ? { temperature: tool.temperature }           : {}),
      ...(tool.dailyLimit    !== undefined ? { dailyLimit: tool.dailyLimit }             : {}),
    };
    const res = await Tool.updateOne({ slug: tool.slug }, { $set: update });
    const status = res.matchedCount > 0 ? "updated" : "not found";
    console.log(`  ✓ ${tool.slug} (${status})`);
  }

  // ── 4. Update client-side tools ───────────────────────────────────────────
  console.log("\nUpdating client-side tools...");
  for (const tool of CLIENT_SIDE_TOOLS) {
    const kitId = kitMap.get(tool.kitSlug);
    const update: Record<string, unknown> = {
      type: tool.type,
      kitSlug: tool.kitSlug,
      ...(kitId ? { kitRef: kitId } : {}),
      ...(tool.tags ? { tags: tool.tags } : {}),
    };
    const res = await Tool.updateOne({ slug: tool.slug }, { $set: update });
    const status = res.matchedCount > 0 ? "updated" : "not found";
    console.log(`  ✓ ${tool.slug} (${status})`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const kitCount  = await Kit.countDocuments();
  const toolsWithFields = await Tool.countDocuments({ formFields: { $exists: true, $ne: [] } });
  console.log(`\nSeed complete:`);
  console.log(`  Kits total:            ${kitCount}`);
  console.log(`  Tools with formFields: ${toolsWithFields}`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch(err => { console.error(err); process.exit(1); });
