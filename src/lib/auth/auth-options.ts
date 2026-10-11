import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { loginSchema } from "@/lib/validation/auth";
import { UserRole } from "@/types";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "MediFlow Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "doctor@mediflow.local" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const parseResult = loginSchema.safeParse(credentials);
        if (!parseResult.success) {
          return null;
        }

        const { email, password } = parseResult.data;

        await connectToDatabase();
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || !user.isActive) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.role = (token.role as UserRole) || "PATIENT";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "mediflow_default_development_secret_min_32_characters",
};
