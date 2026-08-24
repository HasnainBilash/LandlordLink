import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";

export default {
  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as "LANDLORD" | "TENANT";
      }

      return session;
    },
    async redirect({ baseUrl }) {
      return baseUrl;
    }
  },

  events: {
    async signIn({ user }) {
      if (!user.id) return;

      await logActivity({
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
      });
    },
  },
} satisfies NextAuthConfig;