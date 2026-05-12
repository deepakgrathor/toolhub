import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      credits: number;
      onboardingCompleted: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    credits?: number;
    onboardingCompleted?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    credits?: number;
    image?: string | null;
    onboardingCompleted?: boolean;
  }
}
