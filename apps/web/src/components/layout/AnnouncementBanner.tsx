"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface AnnouncementBannerProps {
  text: string;
}

const DISMISS_KEY = "announcement_dismissed";

export function AnnouncementBanner({ text }: AnnouncementBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show unless dismissed in this session
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="relative z-50 flex items-center justify-center gap-3 bg-[#7c3aed] px-4 py-2 text-sm text-white">
      <span className="text-center leading-snug">{text}</span>
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-white/20 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
