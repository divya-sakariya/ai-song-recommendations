import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Enter your email and password.");
        }

        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user || !user.passwordHash) {
          throw new Error("No account found with that email and password.");
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          throw new Error("No account found with that email and password.");
        }

        return { id: user._id.toString(), email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // First-time Google sign-in: provision a User record so the app has a
      // stable userId for consent logs / future Reel history (AUTH-01).
      if (account?.provider === "google" && user.email) {
        await connectToDatabase();
        const existing = await User.findOne({ email: user.email.toLowerCase() });
        if (!existing) {
          await User.create({
            email: user.email.toLowerCase(),
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            authProvider: "google",
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email.toLowerCase() });
        if (dbUser) token.userId = dbUser._id.toString();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as string | undefined;
      }
      return session;
    },
  },
};
