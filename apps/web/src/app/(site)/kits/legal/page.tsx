import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { KitPage } from "@/components/brand/KitPage";

export const metadata: Metadata = {
  title: "CA/Legal Kit — AI Legal Drafting for Indian Businesses | SetuLix",
  description: "AI legal drafting tools for Indian businesses and CAs. Legal Notice, NDA Generator, Legal Disclaimer, GST Calculator. Fast, professional, affordable.",
};

const TOOLS = [
  { slug: "legal-notice", name: "Legal Notice", description: "Draft professional legal notices for disputes and recovery.", creditCost: 5, isFree: false },
  { slug: "nda-generator", name: "NDA Generator", description: "Generate Non-Disclosure Agreements tailored to Indian law.", creditCost: 5, isFree: false },
  { slug: "legal-disclaimer", name: "Legal Disclaimer", description: "Create website disclaimers, terms, and privacy policies.", creditCost: 5, isFree: false },
  { slug: "gst-calculator", name: "GST Calculator", description: "Calculate GST for any product or service instantly.", creditCost: 0, isFree: true },
  { slug: "tds-sheet", name: "TDS Sheet", description: "Generate TDS calculation sheets for salary and payments.", creditCost: 0, isFree: true },
];

const STEPS = [
  { title: "Choose Document Type", description: "Select the legal document or calculation tool you need." },
  { title: "Enter Your Details", description: "Provide party names, amounts, clauses, or jurisdiction details." },
  { title: "Get Draft in Seconds", description: "Receive a legally-structured draft ready for review and use." },
];

const USE_CASES = [
  { title: "Small Business Owners", description: "Send professional legal notices for payment recovery without expensive lawyer fees." },
  { title: "Freelancers & Agencies", description: "Protect your work with NDAs and disclaimers generated in minutes." },
  { title: "Chartered Accountants", description: "Speed up GST and TDS calculations for multiple clients with automated tools." },
  { title: "Startups", description: "Create website legal documents — privacy policy, T&C, and disclaimers — at launch." },
];

const FAQS = [
  { q: "Are the legal documents applicable in India?", a: "Yes, all legal templates are based on Indian legal framework — Indian Contract Act, IT Act, and GST regulations." },
  { q: "Should I review AI-generated legal documents?", a: "Yes, always. AI-generated drafts are a starting point. Consult a qualified legal professional for critical matters." },
  { q: "Is the GST Calculator always up to date?", a: "Yes, GST rates are kept current. You can also input custom rates if needed." },
  { q: "Can I use these NDAs for international clients?", a: "The NDA Generator defaults to Indian jurisdiction but you can specify international jurisdiction in the prompt." },
  { q: "How much does a legal notice draft cost?", a: "5 credits per generation. That's less than ₹10 compared to ₹1000+ for a lawyer's time." },
];

export default function LegalKitPage() {
  return (
    <KitPage
      kitId="legal"
      name="CA / Legal Kit"
      tagline="AI legal drafting for Indian businesses"
      Icon={Scale}
      tools={TOOLS}
      steps={STEPS}
      useCases={USE_CASES}
      faqs={FAQS}
    />
  );
}
