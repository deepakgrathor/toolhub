"use client";

import { useState, useEffect, useRef } from "react";

export type JobStatus = "queued" | "processing" | "done" | "failed";

interface JobStatusState {
  status: JobStatus;
  result: Record<string, unknown> | undefined;
  error: string | undefined;
  isLoading: boolean;
}

export function useJobStatus(jobId: string | null): JobStatusState {
  const [status, setStatus] = useState<JobStatus>("queued");
  const [result, setResult] = useState<Record<string, unknown> | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) {
      setStatus("queued");
      setResult(undefined);
      setError(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}/status`);
        if (!res.ok) return;

        const data = await res.json();
        setStatus(data.status);

        if (data.result !== undefined) setResult(data.result);
        if (data.error !== undefined) setError(data.error);

        if (data.status === "done" || data.status === "failed") {
          setIsLoading(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch {
        // Network error — keep polling
      }
    };

    poll(); // Immediate first check
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId]);

  return { status, result, error, isLoading };
}
