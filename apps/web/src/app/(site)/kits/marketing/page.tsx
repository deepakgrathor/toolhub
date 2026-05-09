import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { KitPage } from "@/components/brand/KitPage";

export const metadata: Metadata = {
  title: "Marketing Kit — AI Marketing Tools for Indian Brands | SetuLix",
  description: "AI marketing tools for Indian brands and businesses. Ad Copy, Caption Generator, Email Subject, LinkedIn Bio, SEO Auditor, Hook Writer. Grow faster with AI.",
};

const TOOLS = [
  { slug: "ad-copy", name: "Ad Copy Writer", description: "Write high-converting ad copy for Facebook, Google, and Instagram.", creditCost: 5, isFree: false },
  { slug: "caption-generator", name: "Caption Generator", description: "Generate engaging captions for any social media platform.", creditCost: 3, isFree: false },
  { slug: "email-subject", name: "Email Subject", description: "Write compelling email subject lines that get opened.", creditCost: 3, isFree: false },
  { slug: "linkedin-bio", name: "LinkedIn Bio", description: "Craft a professional LinkedIn profile bio that stands out.", creditCost: 3, isFree: false },
  { slug: "seo-auditor", name: "SEO Auditor", description: "Get an AI-powered SEO audit and recommendations for any page.", creditCost: 10, isFree: false },
  { slug: "hook-writer", name: "Hook Writer", description: "Create attention-grabbing hooks for ads, reels, and posts.", creditCost: 3, isFree: false },
];

const STEPS = [
  { title: "Pick a Marketing Tool", description: "Choose from 6 AI tools covering ads, social media, email, and SEO." },
  { title: "Describe Your Brand", description: "Tell the AI about your product, audience, and tone of voice." },
  { title: "Get Campaign-Ready Content", description: "Copy, refine, and publish. Go from idea to live campaign in minutes." },
];

const USE_CASES = [
  { title: "D2C Brands", description: "Write ad copy and social captions for product launches without a marketing team." },
  { title: "Digital Marketing Agencies", description: "Produce content for 10 clients in the time it used to take for 2." },
  { title: "Local Businesses", description: "Promote your business on WhatsApp, Instagram, and Google with AI-written content." },
  { title: "Job Seekers & Professionals", description: "Craft a standout LinkedIn bio that attracts recruiters and opportunities." },
];

const FAQS = [
  { q: "Does the Ad Copy writer understand Indian audiences?", a: "Yes, you can specify your target audience (e.g., tier-2 Indian cities, young professionals) and the AI adapts the tone and language." },
  { q: "Can I generate content in Hindi?", a: "Yes! Specify Hindi, Hinglish, or regional languages in your prompt." },
  { q: "What makes the SEO Auditor different?", a: "It analyzes any URL and provides specific, actionable recommendations tailored to Indian search behavior and Google India." },
  { q: "How many captions can I generate with 50 credits?", a: "Caption Generator uses 3 credits — you can generate 16+ captions with a 50-credit pack." },
  { q: "Can I use the email subject line tool for newsletters?", a: "Absolutely. It works for any email marketing context — newsletters, promotional campaigns, and transactional emails." },
];

export default function MarketingKitPage() {
  return (
    <KitPage
      kitId="marketing"
      name="Marketing Kit"
      tagline="AI marketing tools for Indian brands"
      Icon={Megaphone}
      tools={TOOLS}
      steps={STEPS}
      useCases={USE_CASES}
      faqs={FAQS}
    />
  );
}
