import type { NextAuthConfig } from "next-auth";

// Lightweight config shared by the proxy and the full Auth.js instance.
// It must not import Prisma, bcrypt or anything heavy: the proxy runs on
// every request and only needs to decode the JWT.
export default {
  providers: [],

  // Trust the request's Host header. Vercel sets this automatically;
  // without it, `npm start` (local production mode) rejects every
  // session request with "UntrustedHost".
  trustHost: true,

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

    // Allow same-origin redirects (e.g. back to the page that required
    // login); anything else falls back to the home page.
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
} satisfies NextAuthConfig;
