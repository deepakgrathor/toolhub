"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export function AuthModalOpener() {
  const params = useSearchParams();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  useEffect(() => {
    const auth = params.get("auth");
    if (auth === "signup") openAuthModal("signup");
    if (auth === "login") openAuthModal("login");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
