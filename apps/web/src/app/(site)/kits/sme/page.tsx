import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { KitPage } from "@/components/brand/KitPage";

export const metadata: Metadata = {
  title: "SME Kit — Free Business Tools for Indian SMEs | SetuLix",
  description: "Free business tools for Indian SMEs. GST Invoice, Expense Tracker, Quotation Generator, QR Code, WhatsApp Bulk, Salary Slip and more. Completely free.",
};

const TOOLS = [
  { slug: "gst-invoice", name: "GST Invoice", description: "Generate professional GST-compliant invoices instantly.", creditCost: 0, isFree: true },
  { slug: "expense-tracker", name: "Expense Tracker", description: "Track and export business expenses in Excel format.", creditCost: 0, isFree: true },
  { slug: "quotation-generator", name: "Quotation Generator", description: "Create professional business quotations as PDF.", creditCost: 0, isFree: true },
  { slug: "salary-slip", name: "Salary Slip", description: "Generate formatted salary slips for employees.", creditCost: 0, isFree: true },
  { slug: "offer-letter", name: "Offer Letter", description: "Create professional job offer letters instantly.", creditCost: 0, isFree: true },
  { slug: "qr-generator", name: "QR Generator", description: "Generate QR codes for UPI, links, or any text.", creditCost: 0, isFree: true },
  { slug: "whatsapp-bulk", name: "WhatsApp Bulk", description: "Create bulk WhatsApp message templates easily.", creditCost: 0, isFree: true },
];

const STEPS = [
  { title: "Pick Your Tool", description: "Select from 7 free business tools designed for Indian SMEs." },
  { title: "Fill in Details", description: "Enter your business and customer information. No login needed for basic tools." },
  { title: "Download & Use", description: "Export as PDF or Excel. Professional documents in seconds." },
];

const USE_CASES = [
  { title: "Retail & Shop Owners", description: "Generate GST invoices and quotations for customers instantly — no accountant needed." },
  { title: "Freelancers & Consultants", description: "Send professional proposals, offer letters, and track your project expenses." },
  { title: "Small Manufacturers", description: "Create quotations, salary slips, and invoices for your SME without expensive software." },
  { title: "HR Managers", description: "Generate offer letters and salary slips for new hires in minutes." },
];

const FAQS = [
  { q: "Are all SME Kit tools really free?", a: "Yes! All 7 tools in the SME Kit are completely free, forever. No credits needed." },
  { q: "Are the invoices GST compliant?", a: "Yes. Our GST Invoice generator follows Indian GST format with CGST, SGST, and IGST breakdowns." },
  { q: "Can I add my company logo?", a: "Yes, you can upload your company logo and it will appear on invoices and quotations." },
  { q: "Do I need to create an account?", a: "No, most SME tools work without an account. Login is only needed to save your history." },
  { q: "In what format can I download?", a: "PDF for invoices, quotations, and offer letters. Excel/CSV for expense tracking." },
];

export default function SmеKitPage() {
  return (
    <KitPage
      kitId="sme"
      name="SME Kit"
      tagline="Free business tools for Indian SMEs"
      Icon={Building2}
      tools={TOOLS}
      steps={STEPS}
      useCases={USE_CASES}
      faqs={FAQS}
    />
  );
}
