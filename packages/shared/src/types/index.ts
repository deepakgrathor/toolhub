// ── User ─────────────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Tool ─────────────────────────────────────────────────────────────────────

export type AIModel =
  | "gpt-4o-mini"
  | "gpt-4o"
  | "claude-haiku-3-5"
  | "claude-sonnet-4-5"
  | "gemini-flash-2.0"
  | "gemini-pro"
  | "dall-e-3";

export interface Tool {
  id: string;
  slug: string;
  name: string;
  description: string;
  kit: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolConfig {
  toolId: string;
  slug: string;
  creditCost: number;
  aiModel: AIModel;
  isActive: boolean;
  updatedAt: Date;
}

// ── Credit Pack ───────────────────────────────────────────────────────────────

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceInr: number;
  razorpayPlanId: string;
  isFeatured: boolean;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Tool Output ───────────────────────────────────────────────────────────────

export interface ToolOutput {
  id: string;
  userId: string;
  toolSlug: string;
  inputSummary: string;
  outputUrl?: string;
  creditsUsed: number;
  createdAt: Date;
}

// ── Credit Transaction ────────────────────────────────────────────────────────

export type TransactionType = "purchase" | "usage" | "refund" | "manual";

export interface CreditTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: Date;
}

// ── Site Config ───────────────────────────────────────────────────────────────

export interface SiteConfig {
  defaultTheme: "dark" | "light";
  maintenanceMode: boolean;
  announcementText?: string;
  showAnnouncement: boolean;
}

// ── API Responses ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
