"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  toolName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ToolErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ToolErrorBoundary] ${this.props.toolName ?? "Tool"} crashed:`, error, info);

    // Posthog error capture if available
    if (
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      typeof window !== "undefined" &&
      (window as unknown as { posthog?: { capture: (event: string, props: object) => void } }).posthog
    ) {
      const ph = (window as unknown as { posthog: { capture: (event: string, props: object) => void } }).posthog;
      ph.capture("tool_error", {
        tool: this.props.toolName ?? "unknown",
        error: error.message,
        stack: error.stack?.slice(0, 500),
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-md w-full rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 mx-auto">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-foreground">
                {this.props.toolName ? `${this.props.toolName} crashed` : "Something went wrong"}
              </h2>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. Your credits were not deducted.
              </p>
              {this.state.error?.message && (
                <p className="text-xs text-muted-foreground/60 font-mono bg-muted rounded-md px-3 py-2 mt-2 break-all">
                  {this.state.error.message.slice(0, 150)}
                </p>
              )}
            </div>

            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 mx-auto rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
