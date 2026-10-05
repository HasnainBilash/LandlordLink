import { cache } from "react";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";

import authConfig from "./auth.config";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";

const nextAuth = NextAuth({
  ...authConfig,

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

  events: {
    async signIn({ user }) {
      if (!user.id) return;

      await logActivity({
        userId: user.id,
        action: "LOGIN",
        entity: "User",
        entityId: user.id,
        description: "Signed in.",
      });
    },
  },
});

export const { handlers, signIn, signOut } = nextAuth;

// Layouts, pages and server actions all call auth(); cache() makes the
// session decode happen once per request instead of once per call.
export const auth = cache(() => nextAuth.auth());
