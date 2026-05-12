"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { AutofillData } from "@/lib/autofill";

let _cache: AutofillData | null = null;
let _fetching = false;
let _callbacks: ((data: AutofillData | null) => void)[] = [];
let _cachedUserId: string | null = null;

export function useAutofill(): { data: AutofillData | null; isLoading: boolean } {
  const { data: session, status } = useSession();
  const [data, setData] = useState<AutofillData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    if (status === "unauthenticated") {
      setData(null);
      setIsLoading(false);
      return;
    }

    const userId = session?.user?.id;
    if (!userId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    // Invalidate module cache if user changed
    if (userId !== _cachedUserId) {
      _cache = null;
      _fetching = false;
      _callbacks = [];
      _cachedUserId = userId;
    }

    if (_cache !== null) {
      setData(_cache);
      setIsLoading(false);
      return;
    }

    if (_fetching) {
      _callbacks.push((d) => {
        setData(d);
        setIsLoading(false);
      });
      return;
    }

    _fetching = true;
    setIsLoading(true);

    fetch("/api/user/autofill")
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<{ data: AutofillData }>;
      })
      .then((json) => {
        const d = json?.data ?? null;
        _cache = d;
        _fetching = false;
        setData(d);
        setIsLoading(false);
        _callbacks.forEach((cb) => cb(d));
        _callbacks = [];
      })
      .catch(() => {
        _fetching = false;
        setData(null);
        setIsLoading(false);
        _callbacks.forEach((cb) => cb(null));
        _callbacks = [];
      });
  }, [status, session?.user?.id]);

  return { data, isLoading };
}
