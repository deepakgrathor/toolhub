import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { KitPage } from "@/components/brand/KitPage";

export const metadata: Metadata = {
  title: "Creator Kit — AI Tools for Indian Content Creators | SetuLix",
  description: "6 AI tools for Indian content creators. Generate blogs, YouTube scripts, thumbnails, titles, hooks, and captions with AI. Free to start.",
};

const TOOLS = [
  { slug: "blog-generator", name: "Blog Generator", description: "Generate SEO-optimized blog posts for any topic in seconds.", creditCost: 5, isFree: false },
  { slug: "yt-script", name: "YT Script Writer", description: "Write engaging YouTube video scripts with hooks and CTAs.", creditCost: 5, isFree: false },
  { slug: "thumbnail-ai", name: "Thumbnail AI", description: "Generate eye-catching thumbnail concepts for your videos.", creditCost: 10, isFree: false },
  { slug: "title-generator", name: "Title Generator", description: "Create click-worthy titles for blogs, videos, and social posts.", creditCost: 3, isFree: false },
  { slug: "hook-writer", name: "Hook Writer", description: "Write powerful opening hooks that grab attention instantly.", creditCost: 3, isFree: false },
  { slug: "caption-generator", name: "Caption Generator", description: "Generate catchy captions for Instagram, LinkedIn, and more.", creditCost: 3, isFree: false },
];

const STEPS = [
  { title: "Choose a Tool", description: "Pick from 6 AI creator tools based on what you need to create today." },
  { title: "Enter Your Details", description: "Provide your topic, niche, or keywords. The AI handles the rest." },
  { title: "Generate & Export", description: "Get your content in seconds. Copy, download, or refine as needed." },
];

const USE_CASES = [
  { title: "Indian YouTube Creators", description: "Write scripts for finance, tech, education, and entertainment channels in Hindi and English." },
  { title: "Instagram Influencers", description: "Generate captions, hooks, and content ideas that drive engagement." },
  { title: "Bloggers & Writers", description: "Create long-form SEO blogs for Indian topics and audiences in minutes." },
  { title: "Digital Marketing Agencies", description: "Produce content at scale for multiple clients without hiring more writers." },
];

const FAQS = [
  { q: "Are these tools free to use?", a: "Some tools have a free preview. Full generation requires credits starting at just ₹99 for 50 credits." },
  { q: "Can I generate content in Hindi?", a: "Yes! Specify the language in your prompt and the AI will generate content in Hindi, Hinglish, or any Indian language." },
  { q: "How many credits does each tool use?", a: "Credits vary by tool. Blog Generator uses 5 credits, Thumbnail AI uses 10 credits. All costs are shown before generation." },
  { q: "Can I use this for client work?", a: "Absolutely. SetuLix is perfect for agencies and freelancers producing content for multiple clients." },
  { q: "Do credits expire?", a: "No, your credits never expire. Buy once, use whenever you need." },
];

export default function CreatorKitPage() {
  return (
    <KitPage
      kitId="creator"
      name="Creator Kit"
      tagline="6 AI tools for Indian content creators"
      Icon={Sparkles}
      tools={TOOLS}
      steps={STEPS}
      useCases={USE_CASES}
      faqs={FAQS}
    />
  );
}
