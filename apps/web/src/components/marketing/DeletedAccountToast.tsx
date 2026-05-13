"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function DeletedAccountToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("deleted") === "true") {
      toast.info("Account deleted. Sorry to see you go.");
    }
  }, [searchParams]);

  return null;
}
