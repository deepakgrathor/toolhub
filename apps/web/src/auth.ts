import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectDB, User, applyReferral } from "@toolhub/db";
import { generateReferralCode } from "@toolhub/shared";
import { getSiteConfigValue } from "@/lib/site-config-cache";
import type { NextAuthConfig } from "next-auth";

const config: NextAuthConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        await connectDB();
        const user = await User.findOne({ email }).select("+password");
        if (!user || !user.password) return null;
        if (user.isBanned) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        if (user.isDeleted) {
          throw new Error("This account has been deleted. Contact support@setulix.com to restore it.");
        }

        await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          credits: user.credits,
          onboardingCompleted: user.onboardingCompleted ?? false,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile }) {
      // Reject Google sign-ins where the email has not been verified by Google
      if (account?.provider === "google") {
        const googleProfile = profile as { email_verified?: boolean } | undefined;
        if (!googleProfile?.email_verified) {
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      if (account && user) {
        if (account.provider === "google") {
          await connectDB();
          let dbUser = await User.findOne({ email: user.email });

          if (dbUser?.isDeleted) {
            // Block deleted users from signing in via Google
            token.id = "";
            token.isDeleted = true;
            return token;
          }

          if (!dbUser) {
            // First Google login — create user with referral code
            const referralCode = generateReferralCode();
            const welcomeCredits = await getSiteConfigValue('welcome_bonus_credits', 10) as number;
            dbUser = await User.create({
              name: user.name ?? "User",
              email: user.email!,
              image: user.image,
              authProvider: "google",
              role: "user",
              credits: welcomeCredits,
              referralCode,
              onboardingCompleted: false,
              lastSeen: new Date(),
            });

            // Apply referral bonus if ref cookie is present
            try {
              const cookieStore = cookies();
              const refCode = cookieStore.get("ref")?.value;
              if (refCode) {
                await applyReferral(dbUser._id.toString(), refCode);
              }
            } catch {
              // cookies() unavailable in this context — skip silently
            }
          } else {
            await User.findByIdAndUpdate(dbUser._id, {
              lastSeen: new Date(),
              ...(user.image ? { image: user.image } : {}),
            });
          }

          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.credits = dbUser.credits;
          token.image = user.image ?? dbUser.image ?? null;
          token.onboardingCompleted = dbUser.onboardingCompleted ?? false;
        } else {
          token.id = user.id;
          token.role = user.role ?? "user";
          token.credits = user.credits ?? 0;
          token.image = user.image ?? null;
          token.onboardingCompleted = user.onboardingCompleted ?? false;
        }
      }
      // Check plan expiry on each token refresh
      if (token.id && !token.isDeleted) {
        try {
          await connectDB();
          const dbUser = await User.findById(token.id).select("plan planExpiry");
          if (
            dbUser &&
            dbUser.plan !== "free" &&
            dbUser.planExpiry &&
            dbUser.planExpiry < new Date()
          ) {
            // Plan expired — reset to free
            await User.findByIdAndUpdate(token.id, {
              plan: "free",
              planExpiry: null,
            });
            const { getRedis } = await import("@toolhub/shared");
            const redis = getRedis();
            await redis.del(`plan:${token.id}`);
            await redis.del(`sidebar:${token.id}`);
          }
        } catch {
          // Non-blocking — never fail auth for this
        }
      }

      // Allow client-side session updates (onboarding, avatar)
      if (trigger === "update") {
        const s = session as { onboardingCompleted?: boolean; image?: string };
        if (s.onboardingCompleted !== undefined) {
          token.onboardingCompleted = s.onboardingCompleted;
        }
        if (s.image !== undefined) {
          token.image = s.image;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.credits = token.credits as number;
        session.user.onboardingCompleted = (token.onboardingCompleted as boolean) ?? false;
        if (token.image) {
          session.user.image = token.image as string;
        }
      }
      return session;
    },
  },

  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },

  pages: {
    signIn: "/",
  },

  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
