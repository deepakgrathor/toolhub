"use client";

import { useState, useCallback, useRef } from "react";

export interface StreamingState {
  text: string;
  isStreaming: boolean;
  isDone: boolean;
  error: string | null;
  creditsUsed: number | null;
  newBalance: number | null;
}

const INITIAL: StreamingState = {
  text: "",
  isStreaming: false,
  isDone: false,
  error: null,
  creditsUsed: null,
  newBalance: null,
};

// Terminal marker format: \n\n[DONE:{...}] or \n\n[ERROR:{...}]
function parseTerminal(text: string): {
  clean: string;
  done: { creditsUsed: number; newBalance: number } | null;
  errorCode: string | null;
} {
  const doneMatch = text.match(/\n\n\[DONE:(\{[^}]+\})\]/);
  if (doneMatch) {
    try {
      const meta = JSON.parse(doneMatch[1]);
      return {
        clean: text.slice(0, text.indexOf("\n\n[DONE:")),
        done: meta,
        errorCode: null,
      };
    } catch {
      // fall through
    }
  }

  const errMatch = text.match(/\n\n\[ERROR:(\{[^}]+\})\]/);
  if (errMatch) {
    try {
      const meta = JSON.parse(errMatch[1]);
      return {
        clean: text.slice(0, text.indexOf("\n\n[ERROR:")),
        done: null,
        errorCode: meta.code ?? "generation_failed",
      };
    } catch {
      // fall through
    }
  }

  return { clean: text, done: null, errorCode: null };
}

export function useStreamingOutput() {
  const [state, setState] = useState<StreamingState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL);
  }, []);

  const startStream = useCallback(
    async (url: string, body: object): Promise<void> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({ ...INITIAL, isStreaming: true });

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (res.status === 402) {
          setState((s) => ({ ...s, isStreaming: false, error: "insufficient_credits" }));
          return;
        }

        if (!res.ok || !res.body) {
          setState((s) => ({ ...s, isStreaming: false, error: "generation_failed" }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          // Check if terminal marker arrived
          const { clean, done: meta, errorCode } = parseTerminal(accumulated);

          if (meta) {
            setState({
              text: clean,
              isStreaming: false,
              isDone: true,
              error: null,
              creditsUsed: meta.creditsUsed,
              newBalance: meta.newBalance,
            });
            return;
          }

          if (errorCode) {
            setState({
              text: clean,
              isStreaming: false,
              isDone: false,
              error: errorCode,
              creditsUsed: null,
              newBalance: null,
            });
            return;
          }

          // Still streaming — update text (strip any partial terminal marker)
          setState((s) => ({ ...s, text: accumulated }));
        }

        // Stream ended without terminal marker — treat as done
        setState((s) => ({ ...s, isStreaming: false, isDone: true }));
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
        setState((s) => ({
          ...s,
          isStreaming: false,
          error: "generation_failed",
        }));
      }
    },
    []
  );

  return { state, startStream, reset };
}
