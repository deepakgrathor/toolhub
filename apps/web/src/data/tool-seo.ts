export type ToolFaq = {
  question: string
  answer: string
}

export type ToolHowItWorks = {
  step: number
  title: string
  description: string
}

export type ToolUseCase = {
  title: string
  description: string
}

export type ToolSeoData = {
  slug: string
  kitSlug: 'creator' | 'sme' | 'hr' | 'legal' | 'marketing'
  kitName: string
  metaTitle: string
  metaDescription: string
  h1: string
  description: string
  howItWorks: ToolHowItWorks[]
  useCases: ToolUseCase[]
  faqs: ToolFaq[]
  relatedSlugs: string[]
}

export const toolSeoData: ToolSeoData[] = [
  // ── CREATOR KIT ───────────────────────────────────────────────────────────
  {
    slug: 'blog-generator',
    kitSlug: 'creator',
    kitName: 'Creator Kit',
    metaTitle: 'Free AI Blog Generator for Indian Creators — SetuLix',
    metaDescription:
      'Generate SEO-optimised blog posts in minutes with AI. Built for Indian creators, marketers and businesses. Choose tone, topic and keywords — free to start.',
    h1: 'AI Blog Post Generator — Write SEO-Ready Blogs in Minutes',
    description:
      'Indian content creators, YouTubers, digital marketers, and small business owners spend hours writing blog posts that may never rank on Google. SetuLix Blog Generator changes that. Powered by Claude AI, it produces fully structured, SEO-optimised blog posts in under 60 seconds — complete with a compelling introduction, organised body sections, and a strong conclusion. Choose your tone (professional, casual, or persuasive), enter your target keywords, and the AI naturally weaves them into content that search engines and readers both love. Whether you run a tech channel in Bengaluru, an e-commerce brand in Mumbai, or a consulting practice in Delhi, consistent blog content is the fastest way to build authority and grow organic traffic. SetuLix removes the blank-page problem entirely. New users get welcome credits on signup — no credit card required. Start writing your first blog post in seconds.',
    howItWorks: [
      {
        step: 1,
        title: 'Enter your topic',
        description:
          'Type your blog topic, select tone (professional, casual, or persuasive) and add target keywords for SEO.',
      },
      {
        step: 2,
        title: 'AI writes your blog',
        description:
          'Claude AI generates a fully structured blog post with intro, body sections, and conclusion in under 60 seconds.',
      },
      {
        step: 3,
        title: 'Copy or download',
        description:
          'Copy the output directly or download as a branded PDF (LITE plan and above).',
      },
    ],
    useCases: [
      {
        title: 'Content creators and YouTubers',
        description:
          'Indian YouTubers use Blog Generator to repurpose video content into SEO articles, growing their Google search presence alongside their channel.',
      },
      {
        title: 'Small business owners',
        description:
          'SME owners in India write product blogs, how-to guides and local SEO content without hiring a content writer.',
      },
      {
        title: 'Digital marketing agencies',
        description:
          'Agencies generate first drafts for client blogs in minutes, cutting content production time by 80%.',
      },
    ],
    faqs: [
      {
        question: 'Is the AI blog generator free?',
        answer:
          'Yes. New users get welcome credits on signup — enough to generate your first blog posts immediately. No credit card required. See /pricing for current credit packs.',
      },
      {
        question: 'What AI model powers the blog generator?',
        answer:
          'Blog Generator uses Claude by Anthropic — optimised for fast, high-quality long-form content generation.',
      },
      {
        question: 'Can I generate blogs in Hindi?',
        answer:
          'Currently SetuLix generates content in English. Hindi language support is planned for a future update.',
      },
      {
        question: 'How long are the blog posts generated?',
        answer:
          'Generated blogs are typically 600–900 words, structured with a proper introduction, 3–4 body sections, and a conclusion.',
      },
      {
        question: 'Can I edit the generated blog post?',
        answer:
          'Yes. The output is fully editable text. Copy it to any editor — Google Docs, Notion, WordPress — and customise as needed.',
      },
      {
        question: 'Is the content SEO optimised?',
        answer:
          'Yes. You can add target keywords and the AI naturally incorporates them. We recommend using the output as a strong first draft and refining for your specific audience.',
      },
    ],
    relatedSlugs: ['yt-script', 'title-generator', 'hook-writer'],
  },

  {
    slug: 'yt-script',
    kitSlug: 'creator',
    kitName: 'Creator Kit',
    metaTitle: 'Free YouTube Script Writer AI India — SetuLix',
    metaDescription:
      'Write engaging YouTube video scripts with AI in minutes. Hooks, intro, sections and CTA — all structured for Indian creators. Free to try.',
    h1: 'AI YouTube Script Writer — Structured Video Scripts for Indian Creators',
    description:
      'Scripting is the most time-consuming part of creating YouTube videos — and for Indian creators in tech, finance, education, and lifestyle niches, upload consistency is everything. SetuLix YT Script Writer eliminates the blank page. Describe your video topic, select your target audience, and choose a video length (short, medium, or long). Claude AI generates a complete script with an attention-grabbing hook designed to retain viewers in the first 30 seconds, structured body sections that deliver real value, and a compelling call to action. Whether you are a finance creator in Pune explaining SIP returns, a tech reviewer in Chennai unboxing the latest smartphone, or an educator in Delhi teaching JEE concepts, a well-structured script means confident delivery and better audience retention. New users get welcome credits on signup — start scripting your next video today without spending hours planning.',
    howItWorks: [
      {
        step: 1,
        title: 'Describe your video',
        description:
          'Enter your video topic, target audience, and video length (short/medium/long).',
      },
      {
        step: 2,
        title: 'AI scripts your video',
        description:
          'Claude AI writes a complete script with attention-grabbing hook, structured sections, and a strong call to action.',
      },
      {
        step: 3,
        title: 'Record with confidence',
        description:
          'Copy the script to your teleprompter app or notes and start recording — no more blank page.',
      },
    ],
    useCases: [
      {
        title: 'Indian tech and finance YouTubers',
        description:
          'Creators in tech reviews, stock market, and personal finance use YT Script to maintain upload consistency without spending hours scripting.',
      },
      {
        title: 'Educational content creators',
        description:
          'Teachers and tutors creating online course content use it to structure complex topics into clear, engaging video lessons.',
      },
      {
        title: 'Business and startup founders',
        description:
          'Founders use it to script product demo videos, explainer content, and thought leadership videos for LinkedIn and YouTube.',
      },
    ],
    faqs: [
      {
        question: 'Is the YouTube script writer free?',
        answer:
          'Yes. New users get welcome credits on signup — free to start, no card required. See /pricing for current per-use costs.',
      },
      {
        question: 'What video lengths does it support?',
        answer:
          'You can choose short (under 5 min), medium (5–15 min), or long-form (15+ min). The AI adjusts structure and depth accordingly.',
      },
      {
        question: 'Does it write the hook automatically?',
        answer:
          'Yes. Every script starts with a strong hook designed to retain viewers in the first 30 seconds — the most critical window on YouTube.',
      },
      {
        question: 'Can I use it for YouTube Shorts scripts?',
        answer:
          'Yes. Select "short" as your video length and the AI writes a punchy, fast-paced script suitable for Shorts format.',
      },
      {
        question: 'What AI model is used?',
        answer:
          'YT Script Writer uses Claude by Anthropic, optimised for structured, creative long-form content.',
      },
      {
        question: 'Can I generate scripts for multiple niches?',
        answer:
          'Yes. It works for any niche — tech, finance, cooking, travel, fitness, education, business. Just describe your topic and audience.',
      },
    ],
    relatedSlugs: ['blog-generator', 'hook-writer', 'title-generator'],
  },

  {
    slug: 'thumbnail-ai',
    kitSlug: 'creator',
    kitName: 'Creator Kit',
    metaTitle: 'AI YouTube Thumbnail Generator Free India — SetuLix',
    metaDescription:
      'Generate eye-catching YouTube thumbnails with AI. No design skills needed. Built for Indian creators — free credits to start.',
    h1: 'AI Thumbnail Generator — Create Click-Worthy YouTube Thumbnails Instantly',
    description:
      'Your thumbnail is the single most important factor determining whether someone clicks your YouTube video. For Indian creators who cannot afford professional designers or find Canva time-consuming, SetuLix Thumbnail AI is the answer. Powered by DALL-E 3 — the same image model behind ChatGPT — it generates professional, high-contrast YouTube thumbnails from a simple text description. Describe your video topic, the emotion you want to convey (curiosity, excitement, shock), and any text overlay. The AI produces a 1792×1024 pixel thumbnail ready for upload directly to YouTube Studio. Popular among Indian tech, finance, and education creators who rely on strong visuals to drive CTR, Thumbnail AI removes the need for design software entirely. A daily generation limit ensures consistent quality for all users. New users get welcome credits on signup — create your first AI thumbnail for free today.',
    howItWorks: [
      {
        step: 1,
        title: 'Describe your thumbnail',
        description:
          'Enter your video topic, the emotion you want (curiosity, shock, excitement) and any text to include.',
      },
      {
        step: 2,
        title: 'AI generates the image',
        description:
          'DALL-E 3 creates a professional, high-contrast thumbnail image tailored to your description.',
      },
      {
        step: 3,
        title: 'Download and upload',
        description:
          'Download the generated thumbnail and upload directly to YouTube Studio.',
      },
    ],
    useCases: [
      {
        title: 'Solo YouTubers without design skills',
        description:
          'Creators who cannot afford designers or do not know Canva use Thumbnail AI to produce professional-looking thumbnails consistently.',
      },
      {
        title: 'Finance and stock market channels',
        description:
          'Finance YouTubers generate attention-grabbing thumbnails with charts, expressions, and bold visuals that drive higher CTR.',
      },
      {
        title: 'Faceless YouTube channels',
        description:
          'Faceless channel creators who rely entirely on visuals use AI thumbnails to maintain a consistent, professional channel aesthetic.',
      },
    ],
    faqs: [
      {
        question: 'Is the AI thumbnail generator free?',
        answer:
          'New users get welcome credits on signup. Sign up to try — no card required. See /pricing for current thumbnail credit costs.',
      },
      {
        question: 'What AI generates the thumbnails?',
        answer:
          'Thumbnails are generated by DALL-E 3 from OpenAI — the same model behind ChatGPT\'s image generation.',
      },
      {
        question: 'What size are the generated thumbnails?',
        answer:
          'Thumbnails are generated at 1792×1024 pixels — YouTube\'s recommended widescreen ratio.',
      },
      {
        question: 'How many thumbnails can I generate per day?',
        answer:
          'All plans: 5 thumbnails per day. This ensures high-quality generation without overload.',
      },
      {
        question: 'Can I add text to the thumbnail?',
        answer:
          'Yes. Include the text you want in your description prompt (e.g. "add bold text saying 10X RETURNS") and the AI incorporates it.',
      },
      {
        question: 'Can I regenerate if I do not like the output?',
        answer:
          'Yes. Each generation is independent. Refine your prompt and generate again — each attempt uses thumbnail credits.',
      },
    ],
    relatedSlugs: ['yt-script', 'title-generator', 'hook-writer'],
  },

  {
    slug: 'title-generator',
    kitSlug: 'creator',
    kitName: 'Creator Kit',
    metaTitle: 'YouTube Title Generator AI Free — SetuLix',
    metaDescription:
      'Generate high-CTR YouTube titles and blog headlines with AI. Optimised for Indian search trends. Free — no signup needed to explore.',
    h1: 'AI Title Generator — Click-Worthy YouTube Titles and Blog Headlines',
    description:
      'The difference between 10,000 views and 100,000 views often comes down to a single line — your title. Indian YouTubers and bloggers spend too long brainstorming titles when AI can generate 10 click-optimised options in seconds. SetuLix Title Generator uses proven headline formulas — curiosity gaps, numbered lists, how-to structures, emotional triggers — to produce titles that get clicked. Describe your video or blog topic in a sentence, and receive 10 variations instantly. It works equally well for YouTube titles, blog post headlines, LinkedIn posts, and newsletter subject lines. Perfect for creators running A/B title tests on YouTube Studio, or SEO writers who need the perfect balance of keyword inclusion and reader curiosity. Works for Hindi-audience channels that use English titles — just describe your audience in the prompt. With just 1 credit per generation, it is one of the most affordable tools on SetuLix.',
    howItWorks: [
      {
        step: 1,
        title: 'Enter your topic',
        description:
          'Describe your video or blog topic in a sentence — the more specific, the better the titles.',
      },
      {
        step: 2,
        title: 'Get 10 title options',
        description:
          'AI generates 10 click-optimised title variations using proven patterns (How-to, Numbers, Curiosity gaps).',
      },
      {
        step: 3,
        title: 'Pick and publish',
        description:
          'Choose your favourite, optionally A/B test two variations, and publish with confidence.',
      },
    ],
    useCases: [
      {
        title: 'YouTube creators testing CTR',
        description:
          'Creators generate 10 title variations and test which performs best using YouTube\'s A/B title testing feature.',
      },
      {
        title: 'Bloggers and SEO writers',
        description:
          'Content writers generate multiple headline options to pick the one with the best balance of keyword and curiosity.',
      },
      {
        title: 'Social media managers',
        description:
          'Agencies use Title Generator to quickly produce post headlines for clients across multiple content formats.',
      },
    ],
    faqs: [
      {
        question: 'Is the title generator completely free?',
        answer:
          'New users get welcome credits on signup — enough for several title sets immediately. See /pricing for current per-use costs.',
      },
      {
        question: 'How many title options does it generate?',
        answer:
          'It generates 10 title variations per request, using different hooks — numbers, how-to, curiosity, emotional triggers.',
      },
      {
        question: 'Does it work for blog post titles too?',
        answer:
          'Yes. It works equally well for YouTube titles, blog headlines, LinkedIn posts, and newsletter subject lines.',
      },
      {
        question: 'What AI model powers it?',
        answer:
          'Title Generator uses Gemini Flash 2.0 by Google — optimised for fast, creative short-form output.',
      },
      {
        question: 'Can I specify the title style?',
        answer:
          'Yes. Mention your preferred style in the topic — e.g. "how-to format", "numbered list style", or "curiosity-driven".',
      },
      {
        question: 'Does it consider Indian search trends?',
        answer:
          'The AI is trained on global data including Indian content patterns. Mentioning "India" or your specific audience in the prompt improves relevance.',
      },
    ],
    relatedSlugs: ['blog-generator', 'hook-writer', 'caption-generator'],
  },

  {
    slug: 'hook-writer',
    kitSlug: 'creator',
    kitName: 'Creator Kit',
    metaTitle: 'AI Hook Writer for Content Creators India — SetuLix',
    metaDescription:
      'Write scroll-stopping hooks for Instagram Reels, YouTube Shorts and blogs with AI. Free for Indian creators and businesses — welcome credits on signup.',
    h1: 'AI Hook Writer — Stop the Scroll with Powerful Content Hooks',
    description:
      'In the age of Reels and Shorts, the first line determines everything. Indian creators in lifestyle, motivation, finance, and business niches know that a weak hook means viewers scroll past, readers bounce, and engagement tanks. SetuLix Hook Writer generates 5 distinct hook variations for any platform — Instagram Reels, YouTube Shorts, Twitter/X, LinkedIn, or blog articles. Each variation uses a different proven hook formula: a thought-provoking question, a startling statistic, a relatable story opener, a bold claim, or a curiosity gap that leaves the reader wanting more. Finance creators can lead with sobering statistics, motivation creators can open with relatable struggle, and business educators can hook with counterintuitive insights. Mention your desired tone — conversational, authoritative, or controversial — and the AI adapts. Hooks also work brilliantly as email preview text and newsletter openers. New users get welcome credits on signup. Write your best hook yet in seconds.',
    howItWorks: [
      {
        step: 1,
        title: 'Describe your content',
        description:
          'Enter your topic and the platform (Instagram Reels, YouTube Shorts, blog, Twitter/X).',
      },
      {
        step: 2,
        title: 'AI writes 5 hook variations',
        description:
          'Gemini Flash generates 5 different hook styles — question, statistic, story opener, bold claim, and curiosity gap.',
      },
      {
        step: 3,
        title: 'Use the one that fits',
        description:
          'Pick the hook that matches your content style and paste it as your opening line.',
      },
    ],
    useCases: [
      {
        title: 'Instagram Reels creators',
        description:
          'Lifestyle and motivation creators in India use Hook Writer to craft the perfect first line that stops the scroll and boosts watch time.',
      },
      {
        title: 'Finance and business content creators',
        description:
          'Finance influencers use bold stat-based hooks to grab attention — "Most Indians lose 30% of their savings to this mistake."',
      },
      {
        title: 'Bloggers and newsletter writers',
        description:
          'Writers use AI hooks as their article openers and email preview text to improve open rates and time-on-page.',
      },
    ],
    faqs: [
      {
        question: 'Is the hook writer free?',
        answer:
          'Yes. New users get welcome credits on signup. Hook Writer is one of the lowest-cost tools on SetuLix. See /pricing for details.',
      },
      {
        question: 'What platforms does it write hooks for?',
        answer:
          'Instagram Reels, YouTube Shorts, Twitter/X, LinkedIn posts, blog articles, newsletters, and podcast intros.',
      },
      {
        question: 'How many hook variations does it generate?',
        answer:
          '5 variations per request — each using a different hook formula: question, statistic, story, bold claim, curiosity gap.',
      },
      {
        question: 'What AI powers the hook writer?',
        answer:
          'Gemini Flash 2.0 by Google — fast and creative for short-form persuasive content.',
      },
      {
        question: 'Can it write hooks in a specific tone?',
        answer:
          'Yes. Mention your tone in the prompt — conversational, authoritative, motivational, or controversial — and the AI adapts.',
      },
      {
        question: 'Does it work for email subject lines too?',
        answer:
          'Yes. Hook-style email subjects dramatically improve open rates. Use Hook Writer for newsletters and cold email campaigns.',
      },
    ],
    relatedSlugs: ['caption-generator', 'title-generator', 'yt-script'],
  },

  {
    slug: 'caption-generator',
    kitSlug: 'creator',
    kitName: 'Creator Kit',
    metaTitle: 'AI Instagram Caption Generator Free India — SetuLix',
    metaDescription:
      'Generate engaging Instagram, LinkedIn and social media captions with AI. With hashtags. Free for Indian creators and businesses.',
    h1: 'AI Caption Generator — Engaging Social Media Captions with Hashtags',
    description:
      'Posting consistently on Instagram, LinkedIn, and Facebook is essential for Indian brands and creators — but writing fresh, engaging captions every single day is exhausting. SetuLix Caption Generator solves this. Describe your image or video, choose your brand tone (fun, professional, inspirational, or bold), and specify the platform. Gemini Flash generates a complete caption with a scroll-stopping hook, a value-packed body, a clear call to action, and 15–20 relevant hashtags — a mix of high-volume and niche tags to maximise reach. Indian SME owners selling products on Instagram, social media managers handling multiple brand accounts, and personal brand builders on LinkedIn all save hours every week with AI-generated captions. Whether you are announcing a Diwali sale, sharing a product feature, posting a thought leadership update, or celebrating a business milestone, the Caption Generator delivers the right words instantly. New users get welcome credits on signup.',
    howItWorks: [
      {
        step: 1,
        title: 'Describe your post',
        description:
          'Enter what your image or video is about, your brand tone, and the platform you are posting on.',
      },
      {
        step: 2,
        title: 'AI writes your caption',
        description:
          'Gemini Flash generates a full caption with a hook, body, call-to-action and 15–20 relevant hashtags.',
      },
      {
        step: 3,
        title: 'Post with confidence',
        description:
          'Copy the caption directly to Instagram, LinkedIn, or Facebook — ready to post in seconds.',
      },
    ],
    useCases: [
      {
        title: 'Small business owners on Instagram',
        description:
          'Indian SMEs selling products on Instagram use Caption Generator to post consistently without spending time writing captions daily.',
      },
      {
        title: 'Social media managers at agencies',
        description:
          'Agencies managing multiple brand accounts generate platform-specific captions for clients across Instagram, LinkedIn, and Facebook.',
      },
      {
        title: 'Personal brand builders on LinkedIn',
        description:
          'Professionals building their personal brand use it to write thoughtful LinkedIn captions that drive engagement and followers.',
      },
    ],
    faqs: [
      {
        question: 'Is the caption generator free?',
        answer:
          'Yes. New users get welcome credits on signup — enough for several captions immediately. See /pricing for current per-use costs.',
      },
      {
        question: 'Which social platforms does it support?',
        answer:
          'Instagram, LinkedIn, Facebook, Twitter/X, and YouTube community posts. Mention the platform in your prompt for best results.',
      },
      {
        question: 'Does it include hashtags?',
        answer:
          'Yes. Every caption includes 15–20 relevant hashtags, a mix of high-volume and niche tags.',
      },
      {
        question: 'What AI powers caption generation?',
        answer:
          'Gemini Flash 2.0 by Google — optimised for creative, short-form content generation.',
      },
      {
        question: 'Can it match my brand tone?',
        answer:
          'Yes. Describe your brand tone (fun, professional, inspirational, bold) in the prompt and the AI maintains it.',
      },
      {
        question: 'Can I use it for product launches?',
        answer:
          'Absolutely. Caption Generator is excellent for launch announcements, product features, festive sale posts, and offer promotions.',
      },
    ],
    relatedSlugs: ['hook-writer', 'title-generator', 'blog-generator'],
  },

  // ── SME KIT ───────────────────────────────────────────────────────────────
  {
    slug: 'gst-invoice',
    kitSlug: 'sme',
    kitName: 'SME Kit',
    metaTitle: 'Free GST Invoice Generator India — SetuLix',
    metaDescription:
      'Create GST-compliant invoices instantly. CGST, SGST, IGST auto-calculated. Free for Indian businesses — no signup required to try.',
    h1: 'Free GST Invoice Generator — Create GST-Compliant Invoices in Seconds',
    description:
      'Every Indian freelancer, consultant, and small business owner needs GST-compliant invoices — but Tally, Zoho Books, and other accounting software are overkill for basic invoicing. SetuLix GST Invoice Generator is completely free. Enter your GSTIN, business details, client information, invoice items with HSN codes, and applicable tax rates. The tool automatically calculates CGST and SGST for intrastate transactions, or IGST for interstate transactions — exactly as required under Indian GST rules. Download a professional PDF invoice ready to email to your client or file for GSTR-1 returns. Set up your Business Profile once and your GSTIN, business name, and address auto-fill on every future invoice. Whether you are a freelance developer in Hyderabad, a design agency in Ahmedabad, or a product retailer in Jaipur, you can generate a professional GST invoice in under 60 seconds — for free, every time.',
    howItWorks: [
      {
        step: 1,
        title: 'Enter your business details',
        description:
          'Add your GSTIN, business name, client details, and invoice items with HSN codes and tax rates.',
      },
      {
        step: 2,
        title: 'GST auto-calculates',
        description:
          'CGST, SGST, or IGST is automatically calculated based on intrastate or interstate transaction type.',
      },
      {
        step: 3,
        title: 'Download your invoice',
        description:
          'Download a professional PDF invoice ready to share with your client or file for GST returns.',
      },
    ],
    useCases: [
      {
        title: 'Freelancers and consultants',
        description:
          'Indian freelancers in design, development, writing, and consulting generate GST invoices for clients without needing Tally or expensive software.',
      },
      {
        title: 'Small retail and service businesses',
        description:
          'Small shop owners and service providers create GST invoices for B2B clients to maintain proper records for GSTR-1 filing.',
      },
      {
        title: 'Startups billing enterprise clients',
        description:
          'Early-stage startups generate professional GST invoices for their corporate clients before investing in full accounting software.',
      },
    ],
    faqs: [
      {
        question: 'Is the GST invoice generator completely free?',
        answer:
          'Yes. GST Invoice Generator is a free tool — 0 credits, no subscription required. You only need a free SetuLix account.',
      },
      {
        question: 'Does it calculate CGST, SGST, and IGST correctly?',
        answer:
          'Yes. The tool automatically applies CGST+SGST for intrastate transactions and IGST for interstate transactions based on your inputs.',
      },
      {
        question: 'Is the invoice format valid for GST filing?',
        answer:
          'The invoice follows the format prescribed under GST rules — suitable for issuing to clients and maintaining for GSTR-1 purposes. Always verify with your CA for compliance.',
      },
      {
        question: 'Can I add multiple items to one invoice?',
        answer:
          'Yes. Add multiple line items with different HSN codes, quantities, rates, and applicable GST percentages.',
      },
      {
        question: 'Can I save and reuse my business details?',
        answer:
          'Yes. Set up your Business Profile in SetuLix and your GSTIN, business name, and address auto-fill on every invoice.',
      },
      {
        question: 'Can I download the invoice as a PDF?',
        answer:
          'Yes. Download as PDF instantly. LITE and above plans get a branded PDF with your logo and business details.',
      },
    ],
    relatedSlugs: ['quotation-generator', 'salary-slip', 'tds-sheet'],
  },

  {
    slug: 'expense-tracker',
    kitSlug: 'sme',
    kitName: 'SME Kit',
    metaTitle: 'Free Business Expense Tracker India — SetuLix',
    metaDescription:
      'Track business expenses category-wise with summaries. Free for Indian SMEs and freelancers. No Excel needed — works in browser.',
    h1: 'Free Business Expense Tracker — Track and Categorise Business Expenses',
    description:
      'Indian small business owners and freelancers often track expenses in WhatsApp notes, scattered receipts, or complex Excel sheets — none of which give a clear picture of where the money goes. SetuLix Expense Tracker is a completely free, browser-based alternative. Add expenses with category, date, amount, and description — as many entries as you need, no limit. Get instant category-wise breakdowns: total spend on travel, office supplies, software, marketing, and professional fees in seconds. Monthly summaries help identify overspending and improve profit margins. Freelancers can track deductible business expenses for ITR filing, startup founders can monitor burn rate across categories, and small business owners can share clean summaries with their accountant. No app installation, no bank account connection, and no accounting background required — just enter and go. Completely free, always. Designed for the Indian business owner who wants clarity without complexity.',
    howItWorks: [
      {
        step: 1,
        title: 'Add your expenses',
        description:
          'Enter expense amount, category, date, and description — as many entries as you need.',
      },
      {
        step: 2,
        title: 'Get category summary',
        description:
          'See a breakdown by category — total spend, largest categories, and month-over-month view.',
      },
      {
        step: 3,
        title: 'Export or save',
        description:
          'Copy the summary or download for your accountant or for GST input credit claims.',
      },
    ],
    useCases: [
      {
        title: 'Freelancers tracking deductible expenses',
        description:
          'Freelancers track business expenses like software subscriptions, travel, and equipment to claim deductions during ITR filing.',
      },
      {
        title: 'Small business owners monitoring cash flow',
        description:
          'SME owners track monthly operational expenses by category to identify overspending and improve profit margins.',
      },
      {
        title: 'Startup founders managing burn rate',
        description:
          'Early-stage founders use expense tracker to monitor burn rate across categories without setting up full accounting software.',
      },
    ],
    faqs: [
      {
        question: 'Is the expense tracker free?',
        answer:
          'Yes. Expense Tracker is completely free — 0 credits, no subscription needed.',
      },
      {
        question: 'Does it connect to my bank account?',
        answer:
          'No. This is a manual entry tool — you enter expenses yourself. It is intentionally simple and private.',
      },
      {
        question: 'Can I track GST input credit?',
        answer:
          'You can tag expenses and note GST amounts. However, for formal ITC claims, use this as a reference alongside your CA\'s system.',
      },
      {
        question: 'How many expenses can I track?',
        answer:
          'There is no limit on entries. Add as many expenses as needed.',
      },
      {
        question: 'Can I export to Excel?',
        answer:
          'You can copy the summary output. Full Excel export is planned for a future update.',
      },
      {
        question: 'Is my data saved between sessions?',
        answer:
          'Currently the tool is session-based. Save or download your output before closing. Cloud save is planned for a future update.',
      },
    ],
    relatedSlugs: ['gst-invoice', 'tds-sheet', 'quotation-generator'],
  },

  {
    slug: 'quotation-generator',
    kitSlug: 'sme',
    kitName: 'SME Kit',
    metaTitle: 'Free Business Quotation Generator India — SetuLix',
    metaDescription:
      'Create professional business quotations and estimates instantly. Free for Indian freelancers and SMEs. Download as PDF.',
    h1: 'Free Quotation Generator — Professional Business Quotes in Seconds',
    description:
      'Sending a quotation on WhatsApp or a rough Word document does not inspire confidence in prospective clients. Indian freelancers, agencies, contractors, and SMEs who send professional, structured quotations win more business — full stop. SetuLix Quotation Generator is completely free. Enter your business details, client name, itemised services or products with rates and quantities, applicable GST, validity period, and payment terms. A professional quotation is formatted instantly — clean, structured, and client-ready. Download as PDF and send via email or WhatsApp in seconds. Set up your Business Profile once and your name, GSTIN, address, and contact details auto-fill on every quotation you generate. Works for freelance designers quoting web projects, contractors quoting renovation work, IT service providers quoting annual support contracts, and product businesses quoting bulk orders. The difference between a WhatsApp estimate and a professional PDF quotation is the difference between losing and winning the client.',
    howItWorks: [
      {
        step: 1,
        title: 'Enter quotation details',
        description:
          'Add your business details, client name, line items with rates, taxes, validity period and payment terms.',
      },
      {
        step: 2,
        title: 'Preview your quote',
        description:
          'See a professional quotation formatted and ready to send to your client.',
      },
      {
        step: 3,
        title: 'Download and send',
        description:
          'Download as PDF and share via email or WhatsApp — no design skills required.',
      },
    ],
    useCases: [
      {
        title: 'Freelance designers and developers',
        description:
          'Freelancers create professional project quotations for clients instead of informal WhatsApp messages — improving conversion rates.',
      },
      {
        title: 'Contractors and service providers',
        description:
          'Contractors generate itemised quotes for renovation, plumbing, electrical, or IT services with proper terms and validity.',
      },
      {
        title: 'Small agencies pitching clients',
        description:
          'Marketing and digital agencies generate clean, structured quotations for prospective clients during pitch meetings.',
      },
    ],
    faqs: [
      {
        question: 'Is the quotation generator free?',
        answer:
          'Yes. Quotation Generator is completely free — 0 credits, no subscription.',
      },
      {
        question: 'Can I add GST to the quotation?',
        answer:
          'Yes. Add GST percentage per line item and the total including GST is calculated automatically.',
      },
      {
        question: 'Can I set an expiry date on the quotation?',
        answer:
          'Yes. Add a validity period (e.g. valid for 15 days) and it appears clearly on the quotation.',
      },
      {
        question: 'Can I add my logo?',
        answer:
          'PRO plan users get branded PDFs with their business logo and letterhead. Free plan generates a clean standard format.',
      },
      {
        question: 'How is this different from a GST invoice?',
        answer:
          'A quotation is a price proposal sent before work begins. An invoice is sent after work is completed or goods are delivered.',
      },
      {
        question: 'Can I reuse my business details?',
        answer:
          'Yes. Set up your Business Profile in SetuLix — your name, GSTIN, address, and contact auto-fill on every quotation.',
      },
    ],
    relatedSlugs: ['gst-invoice', 'offer-letter', 'salary-slip'],
  },

  {
    slug: 'salary-slip',
    kitSlug: 'sme',
    kitName: 'SME Kit',
    metaTitle: 'Free Salary Slip Generator India — SetuLix',
    metaDescription:
      'Generate professional salary slips and payslips for employees instantly. Free for Indian SMEs and startups. Download as PDF.',
    h1: 'Free Salary Slip Generator — Professional Payslips for Indian Employees',
    description:
      'Small businesses and startups with fewer than 20 employees cannot justify paying for Keka, Razorpay Payroll, or GreytHR just to generate monthly salary slips. SetuLix Salary Slip Generator is completely free. Enter the employee\'s name, designation, department, and salary components — basic salary, HRA, dearness allowance, travel allowance, special allowances — along with deductions like PF, TDS, and professional tax. Gross salary, total deductions, and net take-home pay are calculated automatically. Download a professional PDF salary slip that employees can use for home loan applications, car loans, rental agreements, and visa applications. Covers full-time, part-time, and contract employees. Add custom allowance components by labelling them as needed. Whether you are running a retail shop in Surat, a startup in Bengaluru, or a professional practice in Kolkata, your employees deserve proper, professional payslips — and now you can generate them for free in seconds.',
    howItWorks: [
      {
        step: 1,
        title: 'Enter employee details',
        description:
          'Add employee name, designation, department, and the salary components: basic, HRA, allowances, and deductions.',
      },
      {
        step: 2,
        title: 'Auto-calculate net pay',
        description:
          'Gross salary, total deductions (PF, TDS, professional tax), and net take-home are calculated automatically.',
      },
      {
        step: 3,
        title: 'Download payslip',
        description:
          'Download a professional PDF salary slip the employee can use for loans, rental agreements, or visa applications.',
      },
    ],
    useCases: [
      {
        title: 'Small businesses and startups',
        description:
          'Startups with 2–20 employees generate monthly salary slips without investing in expensive payroll software like Keka or Razorpay Payroll.',
      },
      {
        title: 'HR managers at growing companies',
        description:
          'HR teams generate individual salary slips for employees during month-end payroll processing.',
      },
      {
        title: 'Employees needing proof of income',
        description:
          'Individuals whose employers do not provide formal payslips generate them for home loan, car loan, or rental applications.',
      },
    ],
    faqs: [
      {
        question: 'Is the salary slip generator free?',
        answer:
          'Yes. Salary Slip Generator is completely free — 0 credits, no subscription.',
      },
      {
        question: 'Does it calculate PF and TDS automatically?',
        answer:
          'Yes. Enter the PF and TDS amounts and the net salary is calculated automatically. The tool does not automatically compute TDS rates — enter the applicable amounts.',
      },
      {
        question: 'Is the salary slip format valid for banks?',
        answer:
          'The format includes all standard components banks accept. However, for formal loan applications, ensure it is on company letterhead (PRO plan).',
      },
      {
        question: 'Can I add custom allowances?',
        answer:
          'Yes. Add custom components like travel allowance, food allowance, performance bonus — label them as needed.',
      },
      {
        question: 'Can I generate salary slips for multiple employees?',
        answer:
          'Yes. Generate one slip at a time for each employee. Bulk generation is planned for the Business plan.',
      },
      {
        question: 'Does it work for contract employees?',
        answer:
          'Yes. You can generate salary slips for full-time, part-time, or contract employees with the appropriate components.',
      },
    ],
    relatedSlugs: ['offer-letter', 'tds-sheet', 'gst-invoice'],
  },

  {
    slug: 'offer-letter',
    kitSlug: 'sme',
    kitName: 'SME Kit',
    metaTitle: 'Free Offer Letter Generator India — SetuLix',
    metaDescription:
      'Generate professional employment offer letters instantly. Includes CTC, role, joining date and terms. Free for Indian businesses.',
    h1: 'Free Offer Letter Generator — Professional Employment Offers in Minutes',
    description:
      'The offer letter is often a candidate\'s first formal impression of your company. Indian startups and SMEs that send professional, well-structured offer letters close hires faster and project credibility to candidates — even at the pre-HR stage. SetuLix Offer Letter Generator is completely free. Enter the candidate\'s name, designation, CTC breakup (basic salary, HRA, allowances), joining date, probation period, reporting manager, and notice period. A professionally formatted offer letter is generated with proper structure, company letterhead placeholder, and standard Indian employment terms. Download as PDF and send to the candidate — ready for e-signature or printing. HR managers can process offers for multiple candidates in minutes during bulk hiring cycles. Founders hiring their first employee can generate an offer letter that looks like it came from an established company, not a WhatsApp message. Completely free — 0 credits, always.',
    howItWorks: [
      {
        step: 1,
        title: 'Enter offer details',
        description:
          'Add candidate name, designation, CTC, joining date, reporting manager, and any specific terms.',
      },
      {
        step: 2,
        title: 'AI formats the letter',
        description:
          'A professional offer letter is generated with proper structure, company letterhead placeholder, and standard employment terms.',
      },
      {
        step: 3,
        title: 'Download and send',
        description:
          'Download as PDF and send to the candidate — ready for e-signature or printing.',
      },
    ],
    useCases: [
      {
        title: 'Startups hiring their first employees',
        description:
          'Early-stage startups generate professional offer letters without a formal HR team or legal consultant.',
      },
      {
        title: 'HR managers processing bulk offers',
        description:
          'HR teams generate offer letters for multiple candidates during bulk hiring cycles, saving hours of manual drafting.',
      },
      {
        title: 'Small businesses formalising employment',
        description:
          'Small business owners transitioning from informal to formal employment generate compliant offer letters for their staff.',
      },
    ],
    faqs: [
      {
        question: 'Is the offer letter generator free?',
        answer:
          'Yes. Offer Letter Generator is completely free — 0 credits, no subscription required.',
      },
      {
        question: 'Does it include CTC breakup?',
        answer:
          'Yes. You can add basic salary, HRA, allowances, and other components. The CTC breakup appears in a structured table.',
      },
      {
        question: 'Is the offer letter legally valid?',
        answer:
          'The generated letter follows standard Indian employment offer formats. For legally binding contracts, have it reviewed by a legal professional.',
      },
      {
        question: 'Can I add probation period and notice period?',
        answer:
          'Yes. Both probation period and notice period terms can be specified and appear in the offer letter.',
      },
      {
        question: 'Can I add my company logo?',
        answer:
          'PRO plan users get branded letterheads with their company logo. Free plan generates a clean standard format.',
      },
      {
        question: 'Can I edit the generated offer letter?',
        answer:
          'Yes. Download as PDF or copy the text to Word/Google Docs for any final edits before sending.',
      },
    ],
    relatedSlugs: ['salary-slip', 'tds-sheet', 'quotation-generator'],
  },

  {
    slug: 'tds-sheet',
    kitSlug: 'sme',
    kitName: 'SME Kit',
    metaTitle: 'Free TDS Calculation Sheet India — SetuLix',
    metaDescription:
      'Calculate TDS on salary, contractor payments and professional fees. Free TDS sheet for Indian businesses and CAs. Download instantly.',
    h1: 'Free TDS Calculation Sheet — Calculate TDS for Salary and Payments',
    description:
      'Tax Deducted at Source is one of the most confusing compliance obligations for Indian small businesses and startups — wrong TDS deductions lead to penalties, interest, and TRACES notices. SetuLix TDS Sheet is a completely free tool that covers the most common TDS sections: Section 192 (salary), Section 194C (contractor and subcontractor payments), Section 194J (professional and technical fees), Section 194H (commission and brokerage), and Section 194I (rent). Select your payment type, enter the gross amount, and the correct TDS rate applies automatically — including surcharge and health/education cess where applicable. Download the calculation sheet as PDF to maintain records and share with your CA or auditor. Accountants managing multiple SME clients use it for quick calculations across different payment types. Startup founders calculate monthly salary TDS under Section 192 before crediting employee salaries. Completely free, always.',
    howItWorks: [
      {
        step: 1,
        title: 'Select payment type',
        description:
          'Choose the payment category: salary, contractor, professional fees, rent, or commission — the correct TDS section auto-applies.',
      },
      {
        step: 2,
        title: 'Enter payment amount',
        description:
          'Enter the gross payment amount and the TDS rate is calculated per the applicable Income Tax section.',
      },
      {
        step: 3,
        title: 'Download your sheet',
        description:
          'Download the TDS calculation sheet to maintain records and reference when filing TDS returns.',
      },
    ],
    useCases: [
      {
        title: 'Small businesses with contractors',
        description:
          'SMEs paying freelancers and contractors use TDS Sheet to calculate the correct deduction under Section 194C before making payments.',
      },
      {
        title: 'Accountants and bookkeepers',
        description:
          'Accountants managing multiple small business clients use it for quick TDS calculations across different payment types.',
      },
      {
        title: 'Startup founders managing payroll',
        description:
          'Founders calculate monthly salary TDS under Section 192 to ensure correct deduction before crediting employee salaries.',
      },
    ],
    faqs: [
      {
        question: 'Is the TDS sheet free?',
        answer:
          'Yes. TDS Sheet is completely free — 0 credits, no subscription required.',
      },
      {
        question: 'Which TDS sections does it cover?',
        answer:
          'It covers the most common sections: 192 (salary), 194C (contractor), 194J (professional fees), 194H (commission), 194I (rent).',
      },
      {
        question: 'Does it calculate surcharge and cess?',
        answer:
          'Yes. For applicable cases, surcharge and health/education cess are included in the calculation.',
      },
      {
        question: 'Is this tool updated for the latest TDS rates?',
        answer:
          'The tool uses standard TDS rates. Always verify against the latest Income Tax circular for any rate updates in the current financial year.',
      },
      {
        question: 'Can I use this for TDS return filing?',
        answer:
          'This tool helps you calculate TDS amounts. Actual TDS return filing (Form 24Q, 26Q) must be done through the TRACES portal or with a CA.',
      },
      {
        question: 'Can I save the TDS sheet for records?',
        answer:
          'Yes. Download the sheet as PDF to maintain for your records and share with your CA or auditor.',
      },
    ],
    relatedSlugs: ['gst-invoice', 'salary-slip', 'gst-calculator'],
  },

  {
    slug: 'qr-generator',
    kitSlug: 'sme',
    kitName: 'SME Kit',
    metaTitle: 'Free QR Code Generator for Business India — SetuLix',
    metaDescription:
      'Generate custom QR codes for UPI, website, contact, and WhatsApp. Free for Indian businesses. Download instantly.',
    h1: 'Free QR Code Generator — Custom QR Codes for Indian Businesses',
    description:
      'QR codes have become essential for Indian businesses of all sizes — from the corner shop displaying a UPI payment QR at the counter to the corporate brand linking to their website on a visiting card. SetuLix QR Generator is completely free and covers every use case: UPI payment QR codes that work with PhonePe, Google Pay, and Paytm; website URL QR codes for packaging and branding; WhatsApp chat QR codes that open a conversation instantly; vCard contact QR codes for visiting cards; and plain text QR codes for any information. Download as high-resolution PNG — ready for print on banners, menus, visiting cards, product packaging, and event collateral. Small retailers display payment QR codes to eliminate POS dependency. Restaurant owners link their QR code to a digital menu or Zomato page. Freelancers add a QR code to their portfolio that opens their LinkedIn profile. Completely free, no limits, no account needed to generate.',
    howItWorks: [
      {
        step: 1,
        title: 'Choose QR type',
        description:
          'Select what your QR code should do: open a URL, start a WhatsApp chat, share contact details, or accept UPI payment.',
      },
      {
        step: 2,
        title: 'Enter your details',
        description:
          'Enter the URL, phone number, UPI ID, or contact information depending on your QR type.',
      },
      {
        step: 3,
        title: 'Download your QR',
        description:
          'Download the QR code as PNG and use it on your visiting card, banner, packaging, or shop counter.',
      },
    ],
    useCases: [
      {
        title: 'Retail shop owners',
        description:
          'Small shop owners display UPI QR codes at their counter for instant digital payments without a POS machine.',
      },
      {
        title: 'Freelancers and professionals',
        description:
          'Consultants add QR codes to their visiting cards that instantly open their LinkedIn profile or WhatsApp chat.',
      },
      {
        title: 'Restaurant and cafe owners',
        description:
          'F&B businesses create QR codes linking to their digital menu, Zomato page, or WhatsApp order number.',
      },
    ],
    faqs: [
      {
        question: 'Is the QR code generator free?',
        answer:
          'Yes. QR Generator is completely free — 0 credits, no subscription required.',
      },
      {
        question: 'What types of QR codes can I generate?',
        answer:
          'URL, WhatsApp chat, UPI payment, contact/vCard, email, SMS, and plain text QR codes.',
      },
      {
        question: 'Can I use it for UPI payments?',
        answer:
          'Yes. Enter your UPI ID and generate a QR that customers can scan with any UPI app (PhonePe, GPay, Paytm).',
      },
      {
        question: 'What format is the downloaded QR?',
        answer:
          'QR codes are downloaded as PNG — high resolution, suitable for print and digital use.',
      },
      {
        question: 'Is there a limit on how many QR codes I can generate?',
        answer:
          'No daily limit. Generate as many as you need.',
      },
      {
        question: 'Can I customise the QR code colour or add a logo?',
        answer:
          'Basic QR codes are standard black-and-white. Customised branded QR codes are planned for a future update.',
      },
    ],
    relatedSlugs: ['gst-invoice', 'quotation-generator', 'whatsapp-bulk'],
  },

  // ── HR KIT ────────────────────────────────────────────────────────────────
  {
    slug: 'jd-generator',
    kitSlug: 'hr',
    kitName: 'HR Kit',
    metaTitle: 'AI Job Description Generator India — SetuLix',
    metaDescription:
      'Generate detailed, bias-free job descriptions for any role with AI. Built for Indian HR teams. Free to try — welcome credits on signup.',
    h1: 'AI Job Description Generator — Write JDs for Any Role in Minutes',
    description:
      'A poorly written job description attracts the wrong candidates and repels the right ones. Indian HR professionals, recruitment consultants, and founders hiring their first team often spend hours drafting JDs that still fall short. SetuLix JD Generator, powered by GPT-4o Mini, produces complete, structured job descriptions in minutes — with clearly defined responsibilities, skill requirements, qualification criteria, and perks section. The AI uses bias-free language by default, avoiding gendered phrasing and age-biased requirements that limit your talent pool. Output is formatted for direct posting on LinkedIn Jobs, Naukri, Internshala, and Indeed India. Startup HR teams generate JDs for new roles without a dedicated recruiting team. Recruitment consultants create client-specific JDs for multiple open positions simultaneously. Non-HR founders write professional, structured job descriptions for their first hires with zero HR experience. New users get welcome credits on signup — generate your first JD for free.',
    howItWorks: [
      {
        step: 1,
        title: 'Enter role details',
        description:
          'Provide the job title, department, experience level, key responsibilities, and must-have skills.',
      },
      {
        step: 2,
        title: 'AI writes the JD',
        description:
          'GPT-4o Mini generates a complete, structured job description with responsibilities, requirements, qualifications, and perks section.',
      },
      {
        step: 3,
        title: 'Post directly',
        description:
          'Copy and paste directly into LinkedIn Jobs, Naukri, Internshala, or your company careers page.',
      },
    ],
    useCases: [
      {
        title: 'HR managers at growing startups',
        description:
          'Startup HR teams generate JDs for new roles quickly without a dedicated recruiting team or agency.',
      },
      {
        title: 'Recruitment consultants',
        description:
          'Recruiters generate client-specific JDs for multiple open positions simultaneously, reducing time-to-post.',
      },
      {
        title: 'Founders hiring their first team',
        description:
          'Non-HR founders write professional, structured job descriptions for their first hires without HR experience.',
      },
    ],
    faqs: [
      {
        question: 'Is the job description generator free?',
        answer:
          'New users get welcome credits on signup — free to start, no card required. See /pricing for current per-use costs.',
      },
      {
        question: 'What roles does it support?',
        answer:
          'All roles — software engineers, sales executives, marketing managers, operations, finance, HR, and CXO-level positions.',
      },
      {
        question: 'Is the JD format suitable for Indian job portals?',
        answer:
          'Yes. The output is formatted for direct posting on LinkedIn, Naukri, Internshala, and Indeed India.',
      },
      {
        question: 'Does it write bias-free job descriptions?',
        answer:
          'Yes. The AI avoids gendered language and age-biased requirements by default.',
      },
      {
        question: 'What AI model powers JD Generator?',
        answer:
          'GPT-4o Mini by OpenAI — optimised for structured, professional business writing.',
      },
      {
        question: 'Can I generate JDs for multiple positions at once?',
        answer:
          'Currently one JD per request. For bulk generation, generate separately for each role.',
      },
    ],
    relatedSlugs: ['resume-screener', 'appraisal-draft', 'policy-generator'],
  },

  {
    slug: 'resume-screener',
    kitSlug: 'hr',
    kitName: 'HR Kit',
    metaTitle: 'AI Resume Screener for HR India — SetuLix',
    metaDescription:
      'Screen and shortlist resumes with AI. Paste resume content, set criteria, get ranked analysis. Built for Indian recruiters. Try free.',
    h1: 'AI Resume Screener — Shortlist Candidates 10x Faster with AI',
    description:
      'Indian IT companies, BPO operations, and manufacturing businesses face some of the highest application volumes in the world during hiring cycles. Manually screening 200 resumes for a single developer role takes days and introduces unconscious bias. SetuLix Resume Screener, powered by Claude AI, analyses a candidate\'s resume against your job requirements and provides a structured assessment — match score, key strengths, skill gaps, and a hire/no-hire recommendation — in seconds. Paste the resume text and job criteria, and the AI does the heavy lifting. Tech recruiters shortlist the top 10 candidates from 100 applications in minutes. HR managers in high-volume hiring environments process applications faster without sacrificing quality. Startup founders screen early hires with the same rigour as established HR teams. Resume content is processed in real-time and not stored beyond your session. New users get welcome credits on signup.',
    howItWorks: [
      {
        step: 1,
        title: 'Paste resume content',
        description:
          'Paste the candidate\'s resume text and the job description or key requirements you are hiring for.',
      },
      {
        step: 2,
        title: 'AI screens and scores',
        description:
          'Claude AI analyses the resume against your criteria and provides a match score, key strengths, gaps, and a hire/no-hire recommendation.',
      },
      {
        step: 3,
        title: 'Shortlist with confidence',
        description:
          'Use the AI analysis to make faster, more consistent shortlisting decisions.',
      },
    ],
    useCases: [
      {
        title: 'IT and tech recruiters',
        description:
          'Tech recruiters screening 100+ resumes for developer roles use AI to shortlist the top 10 matches in minutes.',
      },
      {
        title: 'HR managers in high-volume hiring',
        description:
          'HR teams in BPO, retail, and manufacturing running mass hiring drives use Resume Screener to process applications faster.',
      },
      {
        title: 'Startup founders evaluating candidates',
        description:
          'Non-HR founders screen resumes for early hires without recruitment experience or agency support.',
      },
    ],
    faqs: [
      {
        question: 'Is the resume screener free?',
        answer:
          'New users get welcome credits on signup. See /pricing for current per-resume costs.',
      },
      {
        question: 'What formats of resumes can I screen?',
        answer:
          'Paste resume text directly into the tool. PDF/Word upload support is planned for a future update.',
      },
      {
        question: 'How accurate is the AI screening?',
        answer:
          'The AI provides a structured analysis based on keyword matching and skill assessment. Always use it as a first filter, not the final decision.',
      },
      {
        question: 'What AI model is used?',
        answer:
          'Resume Screener uses Claude by Anthropic — optimised for analytical document processing.',
      },
      {
        question: 'Can it screen for culture fit?',
        answer:
          'You can mention culture fit criteria in your job requirements and the AI will assess the candidate\'s language and tone accordingly.',
      },
      {
        question: 'Is candidate data stored?',
        answer:
          'Resume content is processed in real-time and not stored beyond your session history (if you have an account).',
      },
    ],
    relatedSlugs: ['jd-generator', 'appraisal-draft', 'policy-generator'],
  },

  {
    slug: 'appraisal-draft',
    kitSlug: 'hr',
    kitName: 'HR Kit',
    metaTitle: 'AI Performance Appraisal Writer India — SetuLix',
    metaDescription:
      'Draft balanced employee performance appraisals and reviews with AI. Built for Indian HR managers. Free credits on signup.',
    h1: 'AI Appraisal Draft Generator — Write Performance Reviews in Minutes',
    description:
      'Performance appraisals are one of the most time-consuming and emotionally charged responsibilities in Indian HR. Engineering managers spend entire weekends writing annual reviews for 10–15 reports. HRBPs struggle to maintain consistent language across departments. Startup founders conducting their first formal performance reviews have no template or framework to follow. SetuLix Appraisal Draft Generator, powered by GPT-4o Mini, transforms the process. Provide the employee\'s role, key achievements during the review period, areas needing improvement, and future goals. The AI generates a balanced, professionally written performance appraisal — with documented strengths, constructive development areas, and rating guidance aligned to your framework. It works for annual reviews, quarterly check-ins, probation reviews, project-end feedback, and Performance Improvement Plans. The language is unbiased, gender-neutral, and professional by default. Review and personalise before submitting to your HRMS. New users get welcome credits on signup.',
    howItWorks: [
      {
        step: 1,
        title: 'Enter employee context',
        description:
          'Provide the employee\'s role, key achievements during the period, areas needing improvement, and goals.',
      },
      {
        step: 2,
        title: 'AI drafts the appraisal',
        description:
          'GPT-4o Mini generates a structured performance review with achievements, strengths, development areas, and ratings guidance.',
      },
      {
        step: 3,
        title: 'Personalise and submit',
        description:
          'Review and personalise the draft before sharing it with the employee or entering it into your HRMS.',
      },
    ],
    useCases: [
      {
        title: 'Team leads and managers',
        description:
          'Engineering managers and team leads write annual appraisals for 5–15 reports without spending entire weekends on it.',
      },
      {
        title: 'HR business partners',
        description:
          'HRBPs use it to maintain consistent appraisal language across departments, reducing manager bias in written reviews.',
      },
      {
        title: 'Startup founders doing first appraisals',
        description:
          'Founders conducting their first formal performance reviews use it to structure feedback professionally.',
      },
    ],
    faqs: [
      {
        question: 'Is the appraisal draft generator free?',
        answer:
          'New users get welcome credits on signup. See /pricing for current per-use costs.',
      },
      {
        question: 'Does it support different rating frameworks?',
        answer:
          'You can mention your rating scale (1–5, S/NI/U, bell curve) in the input and the AI aligns language accordingly.',
      },
      {
        question: 'Can it write PIPs (Performance Improvement Plans)?',
        answer:
          'Yes. Mention PIP in your requirements and the AI drafts a structured, professional improvement plan.',
      },
      {
        question: 'What AI model powers it?',
        answer:
          'GPT-4o Mini by OpenAI — optimised for professional HR writing.',
      },
      {
        question: 'Is the language unbiased?',
        answer:
          'The AI avoids gender bias and personal language by default. Always review the draft for context-specific accuracy.',
      },
      {
        question: 'Can I use it for quarterly reviews too?',
        answer:
          'Yes. Works for annual reviews, quarterly check-ins, probation reviews, and project-end feedback.',
      },
    ],
    relatedSlugs: ['jd-generator', 'policy-generator', 'resume-screener'],
  },

  {
    slug: 'policy-generator',
    kitSlug: 'hr',
    kitName: 'HR Kit',
    metaTitle: 'AI HR Policy Generator India — SetuLix',
    metaDescription:
      'Generate company HR policies — leave, remote work, code of conduct, IT — with AI. Built for Indian startups and SMEs. Free to try.',
    h1: 'AI HR Policy Generator — Draft Company Policies in Minutes',
    description:
      'Most Indian startups and SMEs operate without formal HR documentation until a compliance issue, dispute, or investor due diligence forces the question. Building an employee handbook from scratch is expensive when it involves HR consultants or legal professionals for every document. SetuLix Policy Generator, powered by GPT-4o Mini, generates professionally drafted HR policies in minutes — leave policy, work from home and hybrid policy, code of conduct, IT usage policy, POSH (Prevention of Sexual Harassment) policy, expense reimbursement policy, and social media policy. Provide your company size, industry, and any specific terms you want included. The output references standard Indian HR practices and labour law frameworks. Download and customise in Word or Google Docs. Series A startups formalise their HR documentation for investor readiness. HR teams update legacy policies for hybrid work realities. Small business owners transitioning to formal employment generate the essential compliance foundation. New users get welcome credits on signup.',
    howItWorks: [
      {
        step: 1,
        title: 'Select policy type',
        description:
          'Choose the type of policy: leave policy, WFH policy, code of conduct, IT policy, POSH, or custom policy.',
      },
      {
        step: 2,
        title: 'Enter company context',
        description:
          'Provide your company size, industry, and any specific terms you want included.',
      },
      {
        step: 3,
        title: 'Download your policy',
        description:
          'Get a professionally drafted policy document ready for your employee handbook or HRMS upload.',
      },
    ],
    useCases: [
      {
        title: 'Startups building their first employee handbook',
        description:
          'Series A startups formalise their HR documentation with policy documents without retaining an HR consultant.',
      },
      {
        title: 'HR managers updating legacy policies',
        description:
          'HR teams update outdated policies to align with current work patterns like hybrid and remote work.',
      },
      {
        title: 'Small business owners going formal',
        description:
          'SME owners transitioning from informal to structured employment generate the essential policies for compliance.',
      },
    ],
    faqs: [
      {
        question: 'Is the policy generator free?',
        answer:
          'New users get welcome credits on signup. See /pricing for current per-policy costs.',
      },
      {
        question: 'What types of policies can it generate?',
        answer:
          'Leave policy, WFH/hybrid policy, code of conduct, IT usage policy, POSH policy, expense reimbursement, and social media policy.',
      },
      {
        question: 'Is the policy compliant with Indian labour laws?',
        answer:
          'The AI references standard Indian HR practices. For legal compliance, have policies reviewed by an HR consultant or legal professional.',
      },
      {
        question: 'Can I customise the generated policy?',
        answer:
          'Yes. The output is editable text — copy to Word or Google Docs and customise for your specific company requirements.',
      },
      {
        question: 'What AI model is used?',
        answer:
          'Policy Generator uses GPT-4o Mini by OpenAI.',
      },
      {
        question: 'Can I generate a full employee handbook?',
        answer:
          'Generate each policy individually and combine them into your handbook. Full handbook generation in one shot is planned.',
      },
    ],
    relatedSlugs: ['jd-generator', 'appraisal-draft', 'offer-letter'],
  },

  // ── LEGAL KIT ─────────────────────────────────────────────────────────────
  {
    slug: 'legal-notice',
    kitSlug: 'legal',
    kitName: 'Legal Kit',
    metaTitle: 'Legal Notice Generator India — Free AI Draft — SetuLix',
    metaDescription:
      'Generate legally worded notices in minutes — payment recovery, property, consumer, employment disputes. Built for India. Free to try.',
    h1: 'AI Legal Notice Generator — Draft Legal Notices for Indian Disputes',
    description:
      'A formal legal notice is often the most effective way to resolve a dispute without going to court — and for Indian businesses and individuals dealing with payment defaults, property issues, cheque bounces, or consumer fraud, getting the language right matters enormously. SetuLix Legal Notice Generator, powered by Claude Sonnet, drafts professionally worded legal notices in minutes. Describe your dispute — the parties involved, the nature of the issue, amounts, and dates — and the AI generates a formal notice referencing the correct Indian legal framework. Covers payment recovery notices, cheque bounce notices under Section 138 of the Negotiable Instruments Act, property dispute notices, consumer complaint notices, and employment dispute notices. Have the generated draft reviewed by a practising advocate before sending via registered post or email. A 30-second cooldown applies between generations to ensure quality. New users get welcome credits on signup.',
    howItWorks: [
      {
        step: 1,
        title: 'Describe your dispute',
        description:
          'Enter the nature of the dispute, the parties involved, the demand being made, and relevant dates or amounts.',
      },
      {
        step: 2,
        title: 'AI drafts your notice',
        description:
          'Claude Sonnet generates a formally worded legal notice with proper legal language, jurisdiction references, and demands.',
      },
      {
        step: 3,
        title: 'Review and send',
        description:
          'Have the notice reviewed by an advocate, print on letterhead, and send via registered post or email.',
      },
    ],
    useCases: [
      {
        title: 'Business owners chasing payment',
        description:
          'Businesses send legal notices to clients with outstanding invoices — often triggering payment without going to court.',
      },
      {
        title: 'Individuals in consumer disputes',
        description:
          'Consumers generate legal notices to companies, service providers, or builders for deficiency in service or fraud.',
      },
      {
        title: 'Landlords and tenants in property disputes',
        description:
          'Landlords draft notices to vacate or tenants draft responses to illegal eviction demands.',
      },
    ],
    faqs: [
      {
        question: 'Is the legal notice generator free to try?',
        answer:
          'New users get welcome credits on signup — free to start. See /pricing for current credit costs per notice.',
      },
      {
        question: 'Is the generated notice legally valid?',
        answer:
          'The notice is a professional draft. For legal enforceability, have it reviewed and signed by a practising advocate before sending.',
      },
      {
        question: 'What types of legal notices does it cover?',
        answer:
          'Payment recovery, cheque bounce (Section 138), property disputes, consumer complaints, employment disputes, and general demand notices.',
      },
      {
        question: 'What AI model is used?',
        answer:
          'Legal Notice uses Claude Sonnet by Anthropic — chosen for its precision in formal, structured legal writing.',
      },
      {
        question: 'Can I use it for cheque bounce notices under Section 138?',
        answer:
          'Yes. Mention "cheque bounce" and the dishonour details. The AI drafts a notice referencing Section 138 of the Negotiable Instruments Act.',
      },
      {
        question: 'Is there a cooldown between generations?',
        answer:
          'Yes. There is a 30-second cooldown between legal notice generations to ensure quality.',
      },
    ],
    relatedSlugs: ['nda-generator', 'legal-disclaimer', 'whatsapp-bulk'],
  },

  {
    slug: 'nda-generator',
    kitSlug: 'legal',
    kitName: 'Legal Kit',
    metaTitle: 'NDA Generator India — Free Non-Disclosure Agreement AI — SetuLix',
    metaDescription:
      'Generate mutual or one-way NDAs for Indian businesses instantly. Covers confidentiality, IP, and dispute resolution. Free to try.',
    h1: 'AI NDA Generator — Draft Non-Disclosure Agreements for Indian Businesses',
    description:
      'Every Indian startup, business, and freelancer eventually faces a situation that requires an NDA — investor discussions, vendor onboarding, agency partnerships, or employee confidentiality. Retaining a lawyer for a standard NDA is expensive and slow. SetuLix NDA Generator, powered by Claude Sonnet, produces complete Non-Disclosure Agreements in minutes. Specify whether you need a mutual NDA (both parties protected equally) or a one-way NDA (only the disclosing party protected), and enter the party names and what information needs protection. The AI generates a complete agreement with all standard clauses — confidentiality obligations, permitted disclosures, exclusions, term and termination, IP ownership, and dispute resolution under Indian jurisdiction. Specify your city (Mumbai, Delhi, Bengaluru) for the appropriate court jurisdiction clause. Have the NDA reviewed by a legal professional and executed on proper stamp paper for full enforceability under the Indian Contract Act, 1872. New users get welcome credits on signup.',
    howItWorks: [
      {
        step: 1,
        title: 'Specify NDA type and parties',
        description:
          'Choose mutual or one-way NDA, enter the disclosing and receiving party names, and describe what information needs protection.',
      },
      {
        step: 2,
        title: 'AI drafts the NDA',
        description:
          'Claude Sonnet generates a complete NDA with all standard clauses — confidentiality obligations, exclusions, term, and Indian jurisdiction.',
      },
      {
        step: 3,
        title: 'Review and sign',
        description:
          'Have the NDA reviewed by a legal professional, get it e-signed via DocuSign or DigiLocker, and maintain your copy.',
      },
    ],
    useCases: [
      {
        title: 'Startups in investor discussions',
        description:
          'Founders share business ideas with potential investors under mutual NDA protection before formal term sheet discussions.',
      },
      {
        title: 'Businesses onboarding vendors and agencies',
        description:
          'Companies require vendors, agencies, and contractors to sign NDAs before sharing sensitive business information.',
      },
      {
        title: 'Freelancers protecting client information',
        description:
          'Freelancers sign one-way NDAs with clients to establish trust and protect client data they handle during projects.',
      },
    ],
    faqs: [
      {
        question: 'Is the NDA generator free to try?',
        answer:
          'New users get welcome credits on signup. See /pricing for current credit costs per NDA.',
      },
      {
        question: 'Is the generated NDA legally binding in India?',
        answer:
          'The NDA is governed by Indian Contract Act, 1872. For enforceability, have it reviewed and executed on proper stamp paper by a legal professional.',
      },
      {
        question: 'Can it generate mutual NDAs?',
        answer:
          'Yes. Specify "mutual NDA" and both parties\' obligations are covered symmetrically.',
      },
      {
        question: 'What jurisdiction does the NDA cover?',
        answer:
          'The NDA defaults to Indian jurisdiction. Specify your city (Mumbai, Delhi, Bengaluru) for the appropriate court jurisdiction clause.',
      },
      {
        question: 'What AI model generates the NDA?',
        answer:
          'Claude Sonnet by Anthropic — chosen for precision in legal contract drafting.',
      },
      {
        question: 'Can I add a non-compete clause?',
        answer:
          'Mention non-compete requirements in your input and the AI includes appropriate restrictions. Note: pure non-compete clauses have limited enforceability under Indian law.',
      },
    ],
    relatedSlugs: ['legal-notice', 'legal-disclaimer', 'offer-letter'],
  },

  {
    slug: 'legal-disclaimer',
    kitSlug: 'legal',
    kitName: 'Legal Kit',
    metaTitle: 'Legal Disclaimer Generator Free India — SetuLix',
    metaDescription:
      'Generate legal disclaimers for websites, apps, social media and content. Built for Indian businesses. Free to try.',
    h1: 'AI Legal Disclaimer Generator — Website and Content Disclaimers for India',
    description:
      'Indian content creators, website owners, and businesses often overlook disclaimers until a legal situation arises. A finance YouTuber sharing stock analysis needs an investment disclaimer. A health blogger writing about symptoms needs a medical advice disclaimer. An affiliate marketer recommending products needs an ASCI-compliant affiliate disclosure. A business website needs a general no-liability disclaimer. SetuLix Legal Disclaimer Generator covers all of these. Choose your disclaimer type — website general disclaimer, affiliate/sponsored content disclosure, investment advice disclaimer (with SEBI reference), medical/health disclaimer, educational content disclaimer, or custom — and the AI generates a professionally worded disclaimer tailored to Indian legal context. Copy it to your website footer, about page, YouTube description, or blog sidebar in seconds. Works for Indian creators across platforms — YouTube, Instagram, blogs, apps, and WhatsApp channels. New users get welcome credits on signup — generate your first disclaimer free.',
    howItWorks: [
      {
        step: 1,
        title: 'Select disclaimer type',
        description:
          'Choose: website disclaimer, affiliate/sponsored content, investment advice, medical/health, educational content, or general no-liability.',
      },
      {
        step: 2,
        title: 'Enter your details',
        description:
          'Add your website name, business type, and any specific activities or content types to cover.',
      },
      {
        step: 3,
        title: 'Copy and publish',
        description:
          'Copy the disclaimer to your website footer, about page, or YouTube description.',
      },
    ],
    useCases: [
      {
        title: 'Finance and investment content creators',
        description:
          'Indian finance YouTubers and bloggers add investment disclaimers to protect themselves from liability on stock tips and market analysis.',
      },
      {
        title: 'Website and app owners',
        description:
          'Businesses add website disclaimers to limit liability for information accuracy, external links, and user reliance on content.',
      },
      {
        title: 'Affiliate marketers',
        description:
          'Indian affiliate marketers add ASCI-compliant affiliate disclaimers to their blogs and social content.',
      },
    ],
    faqs: [
      {
        question: 'Is the legal disclaimer generator free?',
        answer:
          'New users get welcome credits on signup. See /pricing for current per-disclaimer costs.',
      },
      {
        question: 'Does it cover SEBI disclaimer requirements?',
        answer:
          'Yes. For investment content, mention SEBI compliance in your input and the AI includes appropriate SEBI-style disclaimers.',
      },
      {
        question: 'Can it generate disclaimers for YouTube channels?',
        answer:
          'Yes. Generate disclaimers for your YouTube about section, video descriptions, and community posts.',
      },
      {
        question: 'Is it valid for Indian law?',
        answer:
          'The disclaimer references Indian legal context. For critical legal protection, have it reviewed by a legal professional.',
      },
      {
        question: 'What AI model is used?',
        answer:
          'Legal Disclaimer uses GPT-4o Mini by OpenAI.',
      },
      {
        question: 'Can I generate a privacy policy instead?',
        answer:
          'Privacy Policy generation is coming soon. Currently the tool covers disclaimers. Use Legal Disclaimer for general liability protection.',
      },
    ],
    relatedSlugs: ['legal-notice', 'nda-generator', 'gst-calculator'],
  },

  {
    slug: 'gst-calculator',
    kitSlug: 'legal',
    kitName: 'Legal Kit',
    metaTitle: 'Free GST Calculator India — Calculate GST Online — SetuLix',
    metaDescription:
      'Calculate GST inclusive and exclusive amounts instantly. Supports 5%, 12%, 18%, 28% slabs. Free online GST calculator for India.',
    h1: 'Free GST Calculator India — Instant GST Calculation for All Slabs',
    description:
      'Whether you are pricing your services, verifying a vendor invoice, or settling a client dispute about tax amounts, instant GST calculation is a daily need for Indian businesses. SetuLix GST Calculator is completely free — no account needed, instant results, no submit button required. Enter your base amount or GST-inclusive amount, select the applicable GST slab (5%, 12%, 18%, or 28%), and choose between intrastate (CGST+SGST) or interstate (IGST). The GST amount, CGST, SGST or IGST, and final total appear instantly. Reverse GST calculation (from GST-inclusive price to base amount) is also supported. Used by Indian SME owners pricing products and services, chartered accountants and bookkeepers verifying vendor invoices during audits, and individuals calculating the tax component on high-value purchases like electronics, restaurant bills, or professional services. Completely free, no credits required, no account needed. The fastest GST calculator for Indian businesses.',
    howItWorks: [
      {
        step: 1,
        title: 'Enter amount and GST rate',
        description:
          'Enter the base amount or GST-inclusive amount and select the applicable GST slab: 5%, 12%, 18%, or 28%.',
      },
      {
        step: 2,
        title: 'Instant calculation',
        description:
          'GST amount, CGST, SGST (or IGST), and the final total are calculated instantly — no submit button needed.',
      },
      {
        step: 3,
        title: 'Use the result',
        description:
          'Use the calculated amounts for your invoice, pricing sheet, or GST return verification.',
      },
    ],
    useCases: [
      {
        title: 'Business owners pricing products and services',
        description:
          'SME owners calculate GST-inclusive prices to display to customers and GST-exclusive amounts for their records.',
      },
      {
        title: 'CAs and accountants verifying invoices',
        description:
          'Chartered accountants quickly verify GST amounts on vendor invoices during audits and reconciliations.',
      },
      {
        title: 'Individuals checking GST on purchases',
        description:
          'Individuals calculate the GST component on high-value purchases like electronics, vehicles, or restaurant bills.',
      },
    ],
    faqs: [
      {
        question: 'Is the GST calculator free?',
        answer:
          'Yes. GST Calculator is completely free — 0 credits, no account needed.',
      },
      {
        question: 'Which GST slabs does it support?',
        answer:
          'All four GST slabs: 5%, 12%, 18%, and 28%. Plus 0% for exempt goods.',
      },
      {
        question: 'Does it calculate CGST and SGST separately?',
        answer:
          'Yes. For intrastate transactions, it shows CGST (half of GST rate) and SGST (half of GST rate) separately. For interstate, it shows IGST.',
      },
      {
        question: 'Can I calculate reverse GST (GST-inclusive to exclusive)?',
        answer:
          'Yes. Enter the GST-inclusive amount and select the rate — it calculates the base amount and GST component.',
      },
      {
        question: 'Is it updated for the latest GST rates?',
        answer:
          'The calculator covers the four standard slabs. For special rates on specific goods (like petroleum, gold), verify on the GST Council website.',
      },
      {
        question: 'Can I use this for GST return filing?',
        answer:
          'Use it for reference and verification. Actual GST return filing must be done through the GST portal (gst.gov.in).',
      },
    ],
    relatedSlugs: ['gst-invoice', 'tds-sheet', 'legal-disclaimer'],
  },

  {
    slug: 'whatsapp-bulk',
    kitSlug: 'legal',
    kitName: 'Legal Kit',
    metaTitle: 'WhatsApp Bulk Message Generator India — SetuLix',
    metaDescription:
      'Generate personalised WhatsApp bulk messages for business, events and promotions. AI-written. Free for Indian businesses.',
    h1: 'WhatsApp Bulk Message Generator — Personalised Messages at Scale',
    description:
      'WhatsApp is the primary business communication channel for millions of Indian SMEs — from Diwali sale announcements and payment reminders to event invitations and customer updates. The challenge is writing messages that feel personal and get responses, not generic templates that customers ignore. SetuLix WhatsApp Bulk Message Generator, powered by Gemini Flash, creates concise, effective WhatsApp messages tailored to your goal and audience. Describe the purpose (festival offer, payment reminder, event invite, product launch), the recipient type, and key details. The AI generates a message with proper formatting, personalisation placeholders like {name} and {amount} for you to replace before sending, and a clear call to action. Copy directly into WhatsApp Business or paste into your bulk messaging platform (Interakt, Wati, or AiSensy). Always get opt-in consent from recipients before bulk messaging to comply with WhatsApp\'s policies. New users get welcome credits on signup.',
    howItWorks: [
      {
        step: 1,
        title: 'Describe your message goal',
        description:
          'Enter the purpose (payment reminder, festival offer, event invite), your target audience, and key details to include.',
      },
      {
        step: 2,
        title: 'AI writes your message',
        description:
          'Gemini Flash generates a concise, effective WhatsApp message with proper formatting, personalisation, and a clear CTA.',
      },
      {
        step: 3,
        title: 'Copy and send',
        description:
          'Copy the message to WhatsApp Business or your bulk messaging tool and send to your contact list.',
      },
    ],
    useCases: [
      {
        title: 'Retailers for festive season campaigns',
        description:
          'Indian retailers send Diwali, Navratri, and New Year offer messages to their customer WhatsApp list.',
      },
      {
        title: 'Businesses sending payment reminders',
        description:
          'SMEs send polite but firm payment reminder messages to clients with outstanding invoices.',
      },
      {
        title: 'Event organisers and coaches',
        description:
          'Workshop organisers, coaches, and educators send event invitations, reminders, and follow-ups to their WhatsApp groups.',
      },
    ],
    faqs: [
      {
        question: 'Is the WhatsApp message generator free?',
        answer:
          'New users get welcome credits on signup. WhatsApp Bulk is one of the lowest-cost tools on SetuLix. See /pricing for details.',
      },
      {
        question: 'Does it work with WhatsApp Business API?',
        answer:
          'Yes. Copy the generated message into your WhatsApp Business API platform or tool like Interakt, Wati, or AiSensy.',
      },
      {
        question: 'Can it personalise messages with recipient names?',
        answer:
          'Yes. The AI generates messages with personalisation placeholders like {name} and {amount} that you replace before sending.',
      },
      {
        question: 'What AI powers the message generator?',
        answer:
          'Gemini Flash 2.0 by Google — optimised for concise, conversational writing.',
      },
      {
        question: 'Can it generate messages in Hindi?',
        answer:
          'Currently generates in English. Mention "Hindi" in your prompt for Hinglish-style messages — full Hindi support is planned.',
      },
      {
        question: 'Is this compliant with WhatsApp\'s policies?',
        answer:
          'Generated messages are informational and promotional. Always get opt-in consent from recipients before bulk messaging to comply with WhatsApp\'s policies.',
      },
    ],
    relatedSlugs: ['caption-generator', 'email-subject', 'ad-copy'],
  },

  // ── MARKETING KIT ─────────────────────────────────────────────────────────
  {
    slug: 'ad-copy',
    kitSlug: 'marketing',
    kitName: 'Marketing Kit',
    metaTitle: 'AI Ad Copy Writer India — Facebook and Google Ads — SetuLix',
    metaDescription:
      'Write high-converting Facebook, Instagram and Google ad copy with AI. Built for Indian marketers and businesses. Free to try.',
    h1: 'AI Ad Copy Writer — High-Converting Ad Copy for Indian Businesses',
    description:
      'Writing ad copy that converts is a specialist skill — but Indian D2C brands, digital marketing agencies, and local businesses running their first Facebook or Google campaign cannot always afford a dedicated copywriter. SetuLix Ad Copy Writer, powered by GPT-4o Mini, generates three ad copy variations per request using proven copywriting frameworks: AIDA (Attention, Interest, Desire, Action), Problem-Agitate-Solve, and direct benefit-led messaging. Run all three variations as A/B tests, identify the winner, and scale your budget. Works for Facebook, Instagram, Google Search, Google Display, LinkedIn, and WhatsApp Status ads. Particularly powerful for Indian festive campaigns — describe your Diwali offer, your Navratri sale, or your IPL season promotion and the AI generates culturally relevant, conversion-optimised copy. Specify character limits for Google Search ads and the AI respects them. New users get welcome credits on signup — create your first ad copy for free.',
    howItWorks: [
      {
        step: 1,
        title: 'Describe your ad goal',
        description:
          'Enter your product or service, target audience, key benefit, and platform (Facebook, Instagram, or Google).',
      },
      {
        step: 2,
        title: 'AI writes 3 ad variations',
        description:
          'GPT-4o Mini generates 3 ad copy variations using different frameworks — AIDA, Problem-Agitate-Solve, and direct benefit.',
      },
      {
        step: 3,
        title: 'Test and optimise',
        description:
          'Run all 3 variations, identify the winner, and scale your budget on the best performing ad.',
      },
    ],
    useCases: [
      {
        title: 'D2C brands running Facebook ads',
        description:
          'Indian D2C brands use Ad Copy Writer to generate multiple creatives for testing without hiring a dedicated copywriter.',
      },
      {
        title: 'Digital marketing agencies',
        description:
          'Agencies generate client ad copies across categories (real estate, education, finance, fashion) at scale.',
      },
      {
        title: 'Local businesses running Instagram ads',
        description:
          'Small local businesses create their first digital ads for Instagram and Facebook without prior advertising experience.',
      },
    ],
    faqs: [
      {
        question: 'Is the ad copy writer free?',
        answer:
          'New users get welcome credits on signup. See /pricing for current per-generation costs.',
      },
      {
        question: 'Which ad platforms does it support?',
        answer:
          'Facebook, Instagram, Google Search, Google Display, LinkedIn, and WhatsApp Status ads.',
      },
      {
        question: 'Does it write multiple variations?',
        answer:
          'Yes. Each generation produces 3 variations using different copywriting frameworks for A/B testing.',
      },
      {
        question: 'What AI model powers ad copy generation?',
        answer:
          'GPT-4o Mini by OpenAI — chosen for its strong performance on persuasive, conversion-focused writing.',
      },
      {
        question: 'Can it write festive campaign copy for Diwali or Holi?',
        answer:
          'Yes. Mention the festival, your offer, and target audience. The AI creates culturally relevant festive ad copy.',
      },
      {
        question: 'Can I specify the ad character limit?',
        answer:
          'Yes. Mention the platform\'s character limit in your prompt (e.g. "Google Search: headline max 30 chars") and the AI respects it.',
      },
    ],
    relatedSlugs: ['email-subject', 'linkedin-bio', 'caption-generator'],
  },

  {
    slug: 'email-subject',
    kitSlug: 'marketing',
    kitName: 'Marketing Kit',
    metaTitle: 'AI Email Subject Line Generator India — SetuLix',
    metaDescription:
      'Generate high open-rate email subject lines with AI. A/B test ready. Built for Indian email marketers. Free — welcome credits on signup.',
    h1: 'AI Email Subject Line Generator — Boost Open Rates with AI-Written Subjects',
    description:
      'The average Indian professional receives over 100 emails a day. Your subject line has less than two seconds to earn a click — or get archived forever. SetuLix Email Subject Line Generator, powered by Gemini Flash, generates 10 subject line variations per request using different psychological triggers: curiosity, urgency, benefit-led messaging, personalisation, and question-based formats. Indian newsletter writers improve open rates by A/B testing two AI-generated subject lines instead of the first idea that comes to mind. B2B sales professionals improve cold email open rates with subject lines that feel personal and specific, not mass-mailed. E-commerce brands running Diwali sales, new product launches, and flash sale campaigns generate attention-grabbing subject lines that cut through inbox noise. Clean, professional subject lines are generated by default — mention "include emojis" if you prefer them. New users get welcome credits on signup — generate your first 10 subject lines for free.',
    howItWorks: [
      {
        step: 1,
        title: 'Describe your email',
        description:
          'Enter your email topic, target audience, and the action you want readers to take.',
      },
      {
        step: 2,
        title: 'Get 10 subject line options',
        description:
          'Gemini Flash generates 10 subject line variations using different psychological triggers — curiosity, urgency, benefit, personalisation.',
      },
      {
        step: 3,
        title: 'A/B test the best two',
        description:
          'Pick your top 2, A/B test with your email tool, and use the winner for your main send.',
      },
    ],
    useCases: [
      {
        title: 'Newsletter writers and content creators',
        description:
          'Indian newsletter creators improve open rates by testing AI-generated subject lines instead of the first idea that comes to mind.',
      },
      {
        title: 'Sales teams doing cold outreach',
        description:
          'B2B sales professionals improve cold email open rates with subject lines that do not sound templated or spammy.',
      },
      {
        title: 'E-commerce businesses running promotions',
        description:
          'Online businesses running festive sales, new arrivals, and flash sale campaigns generate attention-grabbing subject lines.',
      },
    ],
    faqs: [
      {
        question: 'Is the email subject line generator free?',
        answer:
          'New users get welcome credits on signup. Email Subject is one of the lowest-cost tools. See /pricing for current per-use costs.',
      },
      {
        question: 'How many subject lines does it generate?',
        answer:
          '10 variations per request, covering different angles: curiosity, urgency, benefit-led, question, personalised.',
      },
      {
        question: 'Does it work for cold emails?',
        answer:
          'Yes. Mention "cold email" and your prospect type. The AI generates subject lines that feel personal, not mass-mailed.',
      },
      {
        question: 'What AI powers subject line generation?',
        answer:
          'Gemini Flash 2.0 by Google — optimised for creative, short-form output.',
      },
      {
        question: 'Can it generate emoji-free subject lines?',
        answer:
          'Yes. By default it generates clean, professional subject lines. Mention "include emojis" if you want them.',
      },
      {
        question: 'Does it consider Indian email open rate patterns?',
        answer:
          'The AI is trained on global email marketing best practices. Mention your Indian audience for contextually appropriate subject lines.',
      },
    ],
    relatedSlugs: ['ad-copy', 'linkedin-bio', 'hook-writer'],
  },

  {
    slug: 'linkedin-bio',
    kitSlug: 'marketing',
    kitName: 'Marketing Kit',
    metaTitle: 'AI LinkedIn Bio Generator India — SetuLix',
    metaDescription:
      'Write a compelling LinkedIn About section with AI. Optimised for Indian professionals. Get more profile views and connections.',
    h1: 'AI LinkedIn Bio Generator — Write a LinkedIn About Section That Gets Noticed',
    description:
      'Your LinkedIn About section is your professional pitch to the world — recruiters, investors, clients, and collaborators all read it before deciding whether to connect. Yet most Indian professionals leave it blank or write three generic lines. SetuLix LinkedIn Bio Generator, powered by GPT-4o Mini, generates compelling About sections tailored to your goal — job search, consulting client acquisition, or thought leadership. Share your current role, key achievements, years of experience, target audience, and what you want to be known for. The AI produces a well-structured, first-person narrative within LinkedIn\'s 2600-character limit — typically 300–500 words. Choose your style: story-driven for founders building a narrative, achievement-led for professionals seeking opportunities, or keyword-optimised for candidates targeting recruiter searches. Indian professionals from IIT/IIM backgrounds, startup ecosystems, and corporate India all benefit from a polished LinkedIn presence. New users get welcome credits on signup.',
    howItWorks: [
      {
        step: 1,
        title: 'Share your background',
        description:
          'Enter your current role, key achievements, years of experience, skills, and what you want to be known for.',
      },
      {
        step: 2,
        title: 'AI writes your LinkedIn About',
        description:
          'GPT-4o Mini generates a compelling About section optimised for your goal: job search, consulting clients, or thought leadership.',
      },
      {
        step: 3,
        title: 'Update your profile',
        description:
          'Copy the bio to your LinkedIn About section and watch your profile views and connection requests increase.',
      },
    ],
    useCases: [
      {
        title: 'Professionals seeking new opportunities',
        description:
          'Job seekers rewrite their LinkedIn About section to attract recruiter attention and pass ATS keyword screening.',
      },
      {
        title: 'Founders building their personal brand',
        description:
          'Startup founders craft an About section that positions them as credible, thought-leading entrepreneurs for investor and media visibility.',
      },
      {
        title: 'Freelancers and consultants attracting clients',
        description:
          'Independent professionals use LinkedIn as their primary client acquisition channel and invest in a compelling bio.',
      },
    ],
    faqs: [
      {
        question: 'Is the LinkedIn bio generator free?',
        answer:
          'New users get welcome credits on signup. See /pricing for current per-generation costs.',
      },
      {
        question: 'How long is the generated LinkedIn About section?',
        answer:
          'The generated bio respects LinkedIn\'s 2600-character About section limit — typically 300–500 words.',
      },
      {
        question: 'Can it optimise for recruiter searches?',
        answer:
          'Yes. Mention "optimised for recruiter search" and your target roles — the AI includes high-search keywords naturally.',
      },
      {
        question: 'What AI model writes the bio?',
        answer:
          'GPT-4o Mini by OpenAI — chosen for its strong performance on professional, first-person narrative writing.',
      },
      {
        question: 'Can it write a LinkedIn headline too?',
        answer:
          'Mention "include LinkedIn headline" in your input and the AI generates a headline alongside the About section.',
      },
      {
        question: 'Can I regenerate with a different style?',
        answer:
          'Yes. Specify the style in your next prompt — story-driven, achievement-focused, or keyword-optimised — and regenerate.',
      },
    ],
    relatedSlugs: ['ad-copy', 'email-subject', 'hook-writer'],
  },

  {
    slug: 'seo-auditor',
    kitSlug: 'marketing',
    kitName: 'Marketing Kit',
    metaTitle: 'Free SEO Audit Tool India — Website SEO Checker — SetuLix',
    metaDescription:
      'Get a detailed AI SEO audit for your website. Crawlability, content, meta tags, speed and more. Built for Indian websites.',
    h1: 'AI SEO Auditor — Get a Detailed SEO Audit for Your Website',
    description:
      'Thousands of Indian businesses invest in websites that never rank on Google because no one has ever audited their SEO fundamentals. SetuLix SEO Auditor, powered by GPT-4o, performs a comprehensive analysis of your website\'s SEO signals — meta titles and descriptions, heading structure (H1 through H6), content quality and keyword usage, internal linking, mobile-friendliness indicators, and Core Web Vitals recommendations. Paste your website URL, optionally specify a target keyword, and receive a scored audit report with a prioritised action list of SEO improvements. Indian SMEs check why their website is not ranking and get clear, actionable fixes. Digital marketing agencies run audits for new clients during onboarding to identify quick wins. Bloggers audit existing articles to improve rankings without always writing new content. A 30-second cooldown applies between audits to ensure quality. Most audits complete in 30–60 seconds. New users get welcome credits on signup.',
    howItWorks: [
      {
        step: 1,
        title: 'Enter your website URL',
        description:
          'Paste your website URL and optionally specify the target keyword you want to rank for.',
      },
      {
        step: 2,
        title: 'AI audits your site',
        description:
          'GPT-4o analyses your website\'s SEO signals — content, meta tags, structure, and provides a scored audit report.',
      },
      {
        step: 3,
        title: 'Fix and rank',
        description:
          'Get a prioritised action list of SEO improvements — implement them and track your Google ranking improvement.',
      },
    ],
    useCases: [
      {
        title: 'Small business website owners',
        description:
          'Indian SMEs check why their website is not ranking on Google and get a clear, prioritised list of fixes.',
      },
      {
        title: 'Digital marketing agencies',
        description:
          'Agencies run SEO audits for new clients during onboarding to identify quick wins and long-term opportunities.',
      },
      {
        title: 'Bloggers and content creators',
        description:
          'Indian bloggers audit their articles to improve existing content ranking rather than always writing new posts.',
      },
    ],
    faqs: [
      {
        question: 'Is the SEO auditor free?',
        answer:
          'New users get welcome credits on signup — enough for your first audit. See /pricing for current credit costs per audit.',
      },
      {
        question: 'What does the SEO audit cover?',
        answer:
          'Meta tags, title and description, heading structure (H1–H6), content quality, keyword usage, internal linking, mobile-friendliness indicators, and recommendations.',
      },
      {
        question: 'What AI model performs the audit?',
        answer:
          'SEO Auditor uses GPT-4o by OpenAI — the most capable model for deep analytical tasks.',
      },
      {
        question: 'How long does the audit take?',
        answer:
          'Most audits complete in 30–60 seconds, depending on website content volume.',
      },
      {
        question: 'Is there a cooldown between audits?',
        answer:
          'Yes. A 30-second cooldown applies between audits to ensure quality processing.',
      },
      {
        question: 'Does it check Google Search Console data?',
        answer:
          'The audit analyses publicly available SEO signals. For Search Console data, connect your website in Google Search Console directly.',
      },
    ],
    relatedSlugs: ['ad-copy', 'linkedin-bio', 'blog-generator'],
  },

  {
    slug: 'website-generator',
    kitSlug: 'marketing',
    kitName: 'Marketing Kit',
    metaTitle: 'AI Website Generator India — Full Website Content with AI — SetuLix',
    metaDescription:
      'Generate complete website copy — homepage, about, services, contact — with AI. Built for Indian businesses. Free credits on signup.',
    h1: 'AI Website Generator — Complete Website Content for Indian Businesses',
    description:
      'Having a website is non-negotiable for Indian businesses in 2025 — but hiring a content agency or copywriter to write website copy costs anywhere from ₹15,000 to ₹1,00,000 and takes weeks. SetuLix Website Generator, powered by Claude Sonnet, generates complete website content for all four key pages in one shot. Describe your business name, industry, key services, target customers, and unique selling points. The AI produces professional copy for your Homepage (hero section, features, social proof, call to action), About page (company story, mission, team), Services section (individual service descriptions), and Contact page (directions and messaging guidance). Copy it section by section into Wix, Webflow, WordPress, or Squarespace and your website is content-ready in minutes — not weeks. The higher credit cost reflects the premium quality of Claude Sonnet output and the volume of content generated. New users get welcome credits on signup. Daily usage limits apply to ensure quality for all users.',
    howItWorks: [
      {
        step: 1,
        title: 'Describe your business',
        description:
          'Enter your business name, industry, key services, target customers, and unique selling points.',
      },
      {
        step: 2,
        title: 'AI writes your full website',
        description:
          'Claude Sonnet generates complete copy for homepage (hero, features, testimonial, CTA), About page, Services section, and Contact page.',
      },
      {
        step: 3,
        title: 'Paste into your website builder',
        description:
          'Copy the generated content section by section into your Wix, Webflow, WordPress, or Squarespace site.',
      },
    ],
    useCases: [
      {
        title: 'Small businesses launching their first website',
        description:
          'Indian SMEs get professional website copy without hiring a content agency or copywriter.',
      },
      {
        title: 'Freelancers building their portfolio site',
        description:
          'Consultants and freelancers generate their personal website content — bio, services, positioning — in minutes.',
      },
      {
        title: 'Agencies building client websites',
        description:
          'Web design agencies generate first-draft website copy for clients to review, saving hours in the content gathering phase.',
      },
    ],
    faqs: [
      {
        question: 'How much does website generator cost?',
        answer:
          'Website Generator uses our highest-quality model (Claude Sonnet) for maximum output quality. New users get welcome credits on signup. See /pricing for current credit costs.',
      },
      {
        question: 'How many pages of content does it generate?',
        answer:
          'It generates content for 4 pages: Homepage (hero, features, testimonials, CTA), About, Services, and Contact.',
      },
      {
        question: 'What AI model powers it?',
        answer:
          'Website Generator uses Claude Sonnet by Anthropic — chosen for producing the highest quality, structured long-form content.',
      },
      {
        question: 'Is there a daily usage limit?',
        answer:
          'Yes. LITE plan: 3 websites per day. PRO and above: 10 per day. This ensures quality output for everyone.',
      },
      {
        question: 'Can it generate content in a specific tone?',
        answer:
          'Yes. Mention your brand tone (professional, friendly, bold, minimalist) and the AI adapts the copy style.',
      },
      {
        question: 'Can I generate content for a specific industry?',
        answer:
          'Yes. Be specific about your industry (e.g. "dental clinic in Pune", "IT services company in Bengaluru") for accurate, relevant content.',
      },
    ],
    relatedSlugs: ['blog-generator', 'ad-copy', 'linkedin-bio'],
  },
]

export const toolSeoMap: Record<string, ToolSeoData> = Object.fromEntries(
  toolSeoData.map((t) => [t.slug, t])
)
