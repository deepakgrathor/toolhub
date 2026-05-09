export interface ToolEngineResult {
  output: string;
  structured?: Record<string, unknown>;
  creditsUsed: number;
  newBalance: number;
}

export interface ToolEngineContext {
  userId: string;
  toolSlug: string;
}
