"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { LayoutDashboard, History, Gift, LogOut, User } from "lucide-react";
import { useProfileScore } from "@/hooks/useProfileScore";

interface UserDropdownProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

function ProfileRing({
  score,
  image,
  name,
}: {
  score: number;
  image?: string | null;
  name?: string | null;
}) {
  const r = 15.9;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const initials = name ? name[0]?.toUpperCase() : "U";

  return (
    <div className="relative w-9 h-9 shrink-0">
      <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r={r} fill="none" stroke="#7c3aed"
          strokeWidth="2.5"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-[3px] rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name ?? "User"} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] font-bold text-primary">{initials}</span>
        )}
      </div>
      {score > 0 && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold leading-none">
          {score}
        </div>
      )}
    </div>
  );
}

export function UserDropdown({ name, email, image }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const score = useProfileScore();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted/50 transition-colors"
        aria-label="User menu"
        title={`Profile ${score}% complete`}
      >
        <ProfileRing score={score} image={image} name={name} />
        <span className="hidden md:block text-sm font-medium text-foreground max-w-[120px] truncate">
          {name}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-surface shadow-lg z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
            {email && <p className="text-xs text-muted-foreground truncate">{email}</p>}
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              My Profile
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/history"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <History className="h-4 w-4 text-muted-foreground" />
              History
            </Link>
            <Link
              href="/dashboard#referral"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <Gift className="h-4 w-4 text-muted-foreground" />
              Refer &amp; Earn
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-border py-1">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
