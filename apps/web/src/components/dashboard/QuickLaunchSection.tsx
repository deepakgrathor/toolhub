'use client'

import Link from 'next/link'
import {
  FileText, Video, MessageSquare, Hash,
  Receipt, Banknote, Globe, Briefcase,
  UserCheck, Star, Scale, Shield,
  Calculator, AlertCircle, Megaphone,
  Search, Mail, Linkedin
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface QuickTool {
  slug: string
  name: string
  icon: LucideIcon
  isFree: boolean
}

const KIT_TOOLS: Record<string, QuickTool[]> = {
  creator: [
    { slug: 'blog-generator', name: 'Blog Generator', icon: FileText, isFree: false },
    { slug: 'yt-script', name: 'YT Script', icon: Video, isFree: false },
    { slug: 'caption-generator', name: 'Caption', icon: MessageSquare, isFree: true },
    { slug: 'title-generator', name: 'Title Gen', icon: Hash, isFree: true },
  ],
  sme: [
    { slug: 'gst-invoice', name: 'GST Invoice', icon: Receipt, isFree: true },
    { slug: 'quotation-generator', name: 'Quotation', icon: FileText, isFree: true },
    { slug: 'salary-slip', name: 'Salary Slip', icon: Banknote, isFree: true },
    { slug: 'website-generator', name: 'Website Gen', icon: Globe, isFree: false },
  ],
  hr: [
    { slug: 'jd-generator', name: 'JD Generator', icon: Briefcase, isFree: false },
    { slug: 'resume-screener', name: 'Resume', icon: UserCheck, isFree: false },
    { slug: 'appraisal-draft', name: 'Appraisal', icon: Star, isFree: false },
    { slug: 'policy-generator', name: 'Policy Gen', icon: FileText, isFree: false },
  ],
  legal: [
    { slug: 'legal-notice', name: 'Legal Notice', icon: Scale, isFree: false },
    { slug: 'nda-generator', name: 'NDA Gen', icon: Shield, isFree: false },
    { slug: 'gst-calculator', name: 'GST Calc', icon: Calculator, isFree: true },
    { slug: 'legal-disclaimer', name: 'Disclaimer', icon: AlertCircle, isFree: false },
  ],
  marketing: [
    { slug: 'ad-copy', name: 'Ad Copy', icon: Megaphone, isFree: false },
    { slug: 'seo-auditor', name: 'SEO Auditor', icon: Search, isFree: false },
    { slug: 'linkedin-bio', name: 'LinkedIn Bio', icon: Linkedin, isFree: false },
    { slug: 'email-subject', name: 'Email Subject', icon: Mail, isFree: true },
  ],
}

const DEFAULT_TOOLS: QuickTool[] = [
  { slug: 'gst-invoice', name: 'GST Invoice', icon: Receipt, isFree: true },
  { slug: 'blog-generator', name: 'Blog Generator', icon: FileText, isFree: false },
  { slug: 'legal-notice', name: 'Legal Notice', icon: Scale, isFree: false },
  { slug: 'jd-generator', name: 'JD Generator', icon: Briefcase, isFree: false },
]

interface QuickLaunchSectionProps {
  kitSlug: string
}

export function QuickLaunchSection({ kitSlug }: QuickLaunchSectionProps) {
  const tools = KIT_TOOLS[kitSlug] ?? DEFAULT_TOOLS

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">
          Quick launch
        </h2>
        <Link
          href="/explore"
          className="text-xs text-primary hover:underline"
        >
          All tools →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tools.map(tool => (
          <Link href={`/tools/${tool.slug}`} key={tool.slug}>
            <div className="rounded-xl border border-border bg-card p-4
                            flex flex-col items-center gap-2
                            hover:border-primary/40 hover:bg-primary/5
                            transition-colors cursor-pointer h-full">
              <div className="h-9 w-9 rounded-lg bg-primary/10
                              flex items-center justify-center">
                <tool.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground
                               text-center leading-tight">
                {tool.name}
              </span>
              {tool.isFree && (
                <span className="text-[10px] font-medium
                                 text-primary bg-primary/10
                                 px-2 py-0.5 rounded-full">
                  Free
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
