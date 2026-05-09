import Link from "next/link";
import { Logo } from "./Logo";
import { BRAND } from "@toolhub/shared";

const KIT_LINKS = [
  { href: "/kits/creator", label: "Creator Kit" },
  { href: "/kits/sme", label: "SME Kit" },
  { href: "/kits/hr", label: "HR Kit" },
  { href: "/kits/legal", label: "CA/Legal Kit" },
  { href: "/kits/marketing", label: "Marketing Kit" },
];

const PAGE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {/* Left: brand */}
          <div>
            <Logo size="md" showSubtext href="/" />
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
              {BRAND.tagline}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Made with ♥ in India
            </p>
          </div>

          {/* Center: links */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pages</h4>
              <ul className="space-y-2">
                {PAGE_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Kits</h4>
              <ul className="space-y-2">
                {KIT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Contact</h4>
            <a href={`mailto:${BRAND.email}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
              {BRAND.email}
            </a>
            <a href={`mailto:${BRAND.supportEmail}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors block mt-1">
              {BRAND.supportEmail}
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {year} {BRAND.company}. All rights reserved.</p>
          <p className="text-center">
            {BRAND.name} is designed and developed by {BRAND.company} | {BRAND.founderTitle}: {BRAND.founder}
          </p>
        </div>
      </div>
    </footer>
  );
}
