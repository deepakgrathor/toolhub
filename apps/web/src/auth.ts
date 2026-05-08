import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB, User } from "@toolhub/db";
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
            dbUser = await User.create({
              name: user.name ?? "User",
              email: user.email!,
              image: user.image,
              authProvider: "google",
              role: "user",
              credits: 10,
              lastSeen: new Date(),
            });
          } else {
            await User.findByIdAndUpdate(dbUser._id, {
              lastSeen: new Date(),
              ...(user.image ? { image: user.image } : {}),
            });
          }

          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.credits = dbUser.credits;
        } else {
          token.id = user.id;
          token.role = user.role ?? "user";
          token.credits = user.credits ?? 0;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.credits = token.credits as number;
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
