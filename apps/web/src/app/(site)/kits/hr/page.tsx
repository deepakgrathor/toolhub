import type { Metadata } from "next";
import { Users } from "lucide-react";
import { KitPage } from "@/components/brand/KitPage";

export const metadata: Metadata = {
  title: "HR Kit — AI-Powered HR Tools for Indian Teams | SetuLix",
  description: "AI-powered HR tools for Indian businesses. JD Generator, Resume Screener, Appraisal Draft, Policy Generator, and Offer Letter. Automate your HR workflows.",
};

const TOOLS = [
  { slug: "jd-generator", name: "JD Generator", description: "Write detailed job descriptions for any role in seconds.", creditCost: 5, isFree: false },
  { slug: "resume-screener", name: "Resume Screener", description: "AI screens resumes against job requirements automatically.", creditCost: 5, isFree: false },
  { slug: "offer-letter", name: "Offer Letter", description: "Generate professional offer letters for new hires.", creditCost: 0, isFree: true },
  { slug: "appraisal-draft", name: "Appraisal Draft", description: "Write employee performance appraisal reports with AI.", creditCost: 5, isFree: false },
  { slug: "policy-generator", name: "Policy Generator", description: "Generate HR policies — leave, work-from-home, code of conduct.", creditCost: 5, isFree: false },
];

const STEPS = [
  { title: "Select HR Tool", description: "Choose from 5 AI-powered HR tools built for Indian workplace norms." },
  { title: "Provide Context", description: "Enter role details, company info, or employee data as needed." },
  { title: "Get Draft Instantly", description: "Receive a professional HR document ready to customize and send." },
];

const USE_CASES = [
  { title: "Startups Hiring Fast", description: "Write JDs and generate offer letters for 10 roles in the time it used to take for one." },
  { title: "HR Teams at Scale", description: "Screen hundreds of resumes and draft appraisals without manual effort." },
  { title: "SME Owners Without an HR", description: "Create professional HR policies and documents without an HR department." },
  { title: "Recruitment Agencies", description: "Quickly generate tailored JDs for multiple clients and positions." },
];

const FAQS = [
  { q: "Does the JD Generator understand Indian job roles?", a: "Yes. It's trained on Indian workplace context, including roles specific to Indian industries and job portals." },
  { q: "Can the Resume Screener handle bulk resumes?", a: "Currently it screens one resume at a time against a JD. Bulk screening is on our roadmap." },
  { q: "Is the Offer Letter tool free?", a: "Yes, Offer Letter is completely free. Other HR tools use 5 credits each." },
  { q: "Can I customize the generated documents?", a: "Yes, all outputs are editable text that you can copy and modify in any document editor." },
  { q: "Does the policy generator follow Indian labor law?", a: "It generates policy drafts based on common Indian workplace practices. Always have a legal professional review compliance-sensitive documents." },
];

export default function HrKitPage() {
  return (
    <KitPage
      kitId="hr"
      name="HR Kit"
      tagline="AI-powered HR tools for Indian teams"
      Icon={Users}
      tools={TOOLS}
      steps={STEPS}
      useCases={USE_CASES}
      faqs={FAQS}
    />
  );
}
