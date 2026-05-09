import type { LucideIcon } from "lucide-react";
import {
  FileText, Video, Image, Heading, Zap, MessageSquare,
  Receipt, Wallet, ClipboardList, Globe, QrCode, MessageCircle,
  Banknote, FileSearch, Briefcase, Mail, TrendingUp, Shield,
  Calculator, Table2, Gavel, Lock, AlertCircle, AtSign,
  Linkedin, BarChart2, BadgeDollarSign,
  LayoutGrid, Sparkles, Building2, Users, Scale, Megaphone,
  Wrench,
} from "lucide-react";

// ── Tool icons — keyed by slug ───────────────────────────────────────────────
const TOOL_ICONS: Record<string, LucideIcon> = {
  // Creator Kit
  "blog-generator":     FileText,
  "yt-script":          Video,
  "thumbnail-ai":       Image,
  "title-generator":    Heading,
  "hook-writer":        Zap,
  "caption-generator":  MessageSquare,

  // SME Kit
  "gst-invoice":        Receipt,
  "expense-tracker":    Wallet,
  "quotation-generator": ClipboardList,
  "website-generator":  Globe,
  "qr-generator":       QrCode,
  "whatsapp-bulk":      MessageCircle,
  "salary-slip":        Banknote,

  // HR Kit
  "resume-screener":    FileSearch,
  "jd-generator":       Briefcase,
  "offer-letter":       Mail,
  "appraisal-draft":    TrendingUp,
  "policy-generator":   Shield,

  // CA / Legal Kit
  "gst-calculator":     Calculator,
  "tds-sheet":          Table2,
  "legal-notice":       Gavel,
  "nda-generator":      Lock,
  "legal-disclaimer":   AlertCircle,

  // Marketing Kit
  "email-subject":      AtSign,
  "linkedin-bio":       Linkedin,
  "seo-auditor":        BarChart2,
  "ad-copy":            BadgeDollarSign,
};

// ── Kit icons — keyed by kit slug ────────────────────────────────────────────
export const kitIcons: Record<string, LucideIcon> = {
  all:        LayoutGrid,
  creator:    Sparkles,
  sme:        Building2,
  hr:         Users,
  "ca-legal": Scale,
  marketing:  Megaphone,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the LucideIcon component for a tool slug. Falls back to Wrench. */
export function getToolIcon(slug: string): LucideIcon {
  return TOOL_ICONS[slug] ?? Wrench;
}

/** Returns the LucideIcon component for a kit slug. Falls back to LayoutGrid. */
export function getKitIcon(kit: string): LucideIcon {
  return kitIcons[kit] ?? LayoutGrid;
}
