import type { LucideIcon } from "lucide-react";
import {
  FileText, Video, Image, Heading, Zap, MessageSquare,
  Receipt, Wallet, ClipboardList, Globe, QrCode,
  MessageCircle, Banknote, FileSearch, Briefcase,
  Mail, TrendingUp, Shield, Calculator, Table2,
  Gavel, Lock, AlertCircle, AtSign, Linkedin,
  BarChart2, BadgeDollarSign,
  Sparkles, Building2, Users, Scale, Megaphone,
} from "lucide-react";

export interface ToolEntry {
  slug: string;
  name: string;
  Icon: LucideIcon;
  category: string;
  outcome: string;
  isFree: boolean;
}

export interface CategoryEntry {
  id: string;
  label: string;
  count: number;
  Icon: LucideIcon | null;
}

export const CATEGORIES: CategoryEntry[] = [
  { id: "all",       label: "All Tools",  count: 27, Icon: null      },
  { id: "creator",   label: "Creator",    count: 6,  Icon: Sparkles  },
  { id: "sme",       label: "SME",        count: 7,  Icon: Building2 },
  { id: "hr",        label: "HR",         count: 5,  Icon: Users     },
  { id: "legal",     label: "Legal",      count: 5,  Icon: Scale     },
  { id: "marketing", label: "Marketing",  count: 4,  Icon: Megaphone },
];

export const TOOLS: ToolEntry[] = [
  // Creator (6)
  { slug: "blog-generator",      name: "Blog Generator",      Icon: FileText,        category: "creator",   outcome: "Publish faster, rank higher",         isFree: false },
  { slug: "yt-script",           name: "YT Script Writer",    Icon: Video,           category: "creator",   outcome: "Script a video in 2 minutes",         isFree: false },
  { slug: "thumbnail-ai",        name: "Thumbnail AI",        Icon: Image,           category: "creator",   outcome: "Stop the scroll every time",          isFree: false },
  { slug: "title-generator",     name: "Title Generator",     Icon: Heading,         category: "creator",   outcome: "3× more clicks guaranteed",      isFree: false },
  { slug: "hook-writer",         name: "Hook Writer",         Icon: Zap,             category: "creator",   outcome: "First line that pulls readers in",    isFree: false },
  { slug: "caption-generator",   name: "Caption Generator",   Icon: MessageSquare,   category: "creator",   outcome: "Post without staring at a blank box", isFree: false },
  // SME (7)
  { slug: "gst-invoice",         name: "GST Invoice",         Icon: Receipt,         category: "sme",       outcome: "Invoice sent in under 60 seconds",    isFree: true  },
  { slug: "expense-tracker",     name: "Expense Tracker",     Icon: Wallet,          category: "sme",       outcome: "Know where every rupee went",         isFree: true  },
  { slug: "quotation-generator", name: "Quotation Generator", Icon: ClipboardList,   category: "sme",       outcome: "Win clients with clean quotes",       isFree: true  },
  { slug: "website-generator",   name: "Website Generator",   Icon: Globe,           category: "sme",       outcome: "Full website copy in one click",      isFree: false },
  { slug: "qr-generator",        name: "QR Generator",        Icon: QrCode,          category: "sme",       outcome: "Instant QR, no app needed",          isFree: true  },
  { slug: "gst-calculator",      name: "GST Calculator",      Icon: Calculator,      category: "sme",       outcome: "Right tax, zero confusion",           isFree: true  },
  { slug: "salary-slip",         name: "Salary Slip",         Icon: Banknote,        category: "sme",       outcome: "Salary slips done in seconds",        isFree: true  },
  // HR (5)
  { slug: "jd-generator",        name: "JD Generator",        Icon: Briefcase,       category: "hr",        outcome: "Hire faster with sharp JDs",          isFree: false },
  { slug: "resume-screener",     name: "Resume Screener",     Icon: FileSearch,      category: "hr",        outcome: "Shortlist in minutes, not hours",     isFree: false },
  { slug: "appraisal-draft",     name: "Appraisal Draft",     Icon: TrendingUp,      category: "hr",        outcome: "Fair reviews, written fast",          isFree: false },
  { slug: "policy-generator",    name: "Policy Generator",    Icon: Shield,          category: "hr",        outcome: "HR policies, zero legal risk",        isFree: false },
  { slug: "offer-letter",        name: "Offer Letter",        Icon: Mail,            category: "hr",        outcome: "Professional letters, every time",    isFree: true  },
  // Legal (5)
  { slug: "legal-notice",        name: "Legal Notice",        Icon: Gavel,           category: "legal",     outcome: "Dispute-ready in 5 minutes",          isFree: false },
  { slug: "nda-generator",       name: "NDA Generator",       Icon: Lock,            category: "legal",     outcome: "Protect your IP instantly",           isFree: false },
  { slug: "legal-disclaimer",    name: "Legal Disclaimer",    Icon: AlertCircle,     category: "legal",     outcome: "Stay compliant on every page",        isFree: false },
  { slug: "tds-sheet",           name: "TDS Sheet",           Icon: Table2,          category: "legal",     outcome: "TDS sorted, audit-ready",             isFree: true  },
  { slug: "whatsapp-bulk",       name: "WhatsApp Bulk",       Icon: MessageCircle,   category: "legal",     outcome: "Reach 100s with one template",        isFree: false },
  // Marketing (4)
  { slug: "ad-copy",             name: "Ad Copy",             Icon: BadgeDollarSign, category: "marketing", outcome: "Copy that converts, not confuses",    isFree: false },
  { slug: "email-subject",       name: "Email Subject",       Icon: AtSign,          category: "marketing", outcome: "Open rates that actually move",       isFree: false },
  { slug: "linkedin-bio",        name: "LinkedIn Bio",        Icon: Linkedin,        category: "marketing", outcome: "Profile that gets you hired",         isFree: false },
  { slug: "seo-auditor",         name: "SEO Auditor",         Icon: BarChart2,       category: "marketing", outcome: "Fix what Google penalises",           isFree: false },
];
