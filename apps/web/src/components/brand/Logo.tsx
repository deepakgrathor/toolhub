import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showSubtext?: boolean;
  href?: string;
  className?: string;
}

const sizeMap = {
  sm: { icon: 18, text: "text-base", sub: "text-[10px]" },
  md: { icon: 22, text: "text-lg", sub: "text-xs" },
  lg: { icon: 32, text: "text-3xl", sub: "text-sm" },
};

function SetuLixIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      {/* Geometric S shape made of two rectangles */}
      <rect x="4" y="4" width="18" height="8" rx="3" fill="#7c3aed" />
      <rect x="10" y="12" width="18" height="8" rx="3" fill="#7c3aed" opacity="0.7" />
      <rect x="4" y="20" width="18" height="8" rx="3" fill="#7c3aed" />
    </svg>
  );
}

export function Logo({ size = "md", showSubtext = false, href = "/dashboard", className }: LogoProps) {
  const s = sizeMap[size];

  const content = (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2">
        <SetuLixIcon size={s.icon} />
        <span className={cn("font-bold tracking-tight leading-none", s.text)}>
          <span className="text-foreground">Setu</span>
          <span className="text-primary">Lix</span>
        </span>
      </div>
      {showSubtext && (
        <span className={cn("text-muted-foreground mt-0.5 pl-[calc(var(--icon-size)+8px)]", s.sub)}>
          by SetuLabsAI
        </span>
      )}
    </div>
  );

  return (
    <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
      {content}
    </Link>
  );
}
