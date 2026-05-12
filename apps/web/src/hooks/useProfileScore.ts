"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function useProfileScore() {
  const { status } = useSession();
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d: { score?: number }) => {
        if (typeof d.score === "number") setScore(d.score);
      })
      .catch(() => {});
  }, [status]);

  return score;
}
