import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectDB, User, applyReferral } from "@toolhub/db";
import { generateReferralCode, FREE_CREDITS_ON_SIGNUP, getRedis } from "@toolhub/shared";
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
        adminToken: { label: "Admin Token", type: "text" },
      },
      async authorize(credentials) {
        const adminToken = credentials?.adminToken as string | undefined;

        // Admin OTP flow: verify the short-lived token from Redis
        if (adminToken) {
          try {
            const redis = getRedis();
            const email = await redis.get<string>(`setulix:admin:login:${adminToken}`);
            if (!email) return null;

            // One-time use — delete immediately
            await redis.del(`setulix:admin:login:${adminToken}`);

            await connectDB();
            const user = await User.findOne({ email });
            if (!user || user.role !== "admin") return null;

            await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });

            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              image: user.image,
              role: user.role,
              credits: user.credits,
            };
          } catch {
            return null;
          }
        }

        // Regular email + password flow
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        await connectDB();
        const user = await User.findOne({ email }).select("+password");
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          credits: user.credits,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        if (account.provider === "google") {
          await connectDB();
          let dbUser = await User.findOne({ email: user.email });

          if (!dbUser) {
            // First Google login — create user with referral code
            const referralCode = generateReferralCode();
            dbUser = await User.create({
              name: user.name ?? "User",
              email: user.email!,
              image: user.image,
              authProvider: "google",
              role: "user",
              credits: FREE_CREDITS_ON_SIGNUP,
              referralCode,
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
        } else {
          token.id = user.id;
          token.role = user.role ?? "user";
          token.credits = user.credits ?? 0;
          token.image = user.image ?? null;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.credits = token.credits as number;
        if (token.image) {
          session.user.image = token.image as string;
        }
      }
      return session;
    },
  },

  session: { strategy: "jwt" },

  pages: {
    signIn: "/",
  },

  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
