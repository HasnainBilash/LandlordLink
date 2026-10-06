import { cache } from "react";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";

import authConfig from "./auth.config";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/log-activity";
import { ipFromHeaders, isRateLimited, rateLimit } from "@/lib/rate-limit";

// Too many sign-in attempts; the login form says to wait.
export class TooManySignInAttempts extends CredentialsSignin {
  code = "rate_limited";
}

const SIGN_IN_WINDOW_SECONDS = 15 * 60;
// Failed attempts per IP and email. Only failures count, so the right
// password (e.g. the demo buttons) never locks anyone out.
const FAILED_SIGN_INS_PER_WINDOW = 8;
// All attempts per IP, failed or not.
const SIGN_INS_PER_IP_PER_WINDOW = 60;

// Checked when no account matches, so an unknown email takes as long as a
// wrong password and response times don't reveal who has an account.
const DUMMY_PASSWORD_HASH = "$2b$12$mfLRG9ESNvjoxil3bmYeVui0TNGvHTWgF9/js.QFsLH8EOT9EnJs2";

async function findUserByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) return user;

  // Accounts registered before emails were stored in lowercase.
  return prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
}

const nextAuth = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email: {},
        password: {},
      },

      // Every sign-in goes through here, whether from the login form or a
      // direct POST to /api/auth/callback/credentials, so the limits live
      // here too.
      async authorize(credentials, request) {
        const email =
          typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password || password.length > 128) {
          return null;
        }

        const ip = ipFromHeaders(request.headers);
        const failuresKey = `sign-in-failed:${ip}:${email}`;

        const [failures, attempts] = await Promise.all([
          isRateLimited(failuresKey, FAILED_SIGN_INS_PER_WINDOW),
          rateLimit(`sign-in:${ip}`, SIGN_INS_PER_IP_PER_WINDOW, SIGN_IN_WINDOW_SECONDS),
        ]);

        if (!failures.allowed || !attempts.allowed) {
          throw new TooManySignInAttempts();
        }

        const user = await findUserByEmail(email);

        const passwordMatch = await bcrypt.compare(
          password,
          user && !user.deletedAt ? user.passwordHash : DUMMY_PASSWORD_HASH
        );

        if (!user || user.deletedAt || !passwordMatch) {
          await rateLimit(failuresKey, FAILED_SIGN_INS_PER_WINDOW, SIGN_IN_WINDOW_SECONDS);
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
