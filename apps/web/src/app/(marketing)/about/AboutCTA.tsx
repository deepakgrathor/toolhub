"use client";

import { useAuthStore } from "@/store/auth-store";

export default function AboutCTA() {
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  return (
    <button
      onClick={() => openAuthModal("signup")}
      className="bg-white text-primary font-bold px-8 py-3.5 rounded-xl
        hover:opacity-90 transition-opacity shadow-md"
    >
      Start free today
    </button>
  );
}
