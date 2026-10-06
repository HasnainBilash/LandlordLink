import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Content-Security-Policy with a fresh nonce per request: only scripts that
// Next.js (or the root layout) mark with the nonce can run, so an injected
// script can't. Styles allow inline because components set style
// attributes (a nonce can't cover those).
function contentSecurityPolicy(nonce: string, isHttps: boolean) {
  const isDev = process.env.NODE_ENV === "development";

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isHttps ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const pathname = req.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  // The landing page is public; it sends signed-in users to their home.
  const isPublicPage = pathname === "/";

  if (!isLoggedIn && !isAuthPage && !isPublicPage) {
    const loginUrl = new URL("/login", req.url);

    if (pathname !== "/") {
      loginUrl.searchParams.set(
        "callbackUrl",
        `${pathname}${req.nextUrl.search}`
      );
    }

    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isLoggedIn && role === "TENANT" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/tenant", req.url));
  }

  if (isLoggedIn && role === "LANDLORD" && pathname.startsWith("/tenant")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce, req.nextUrl.protocol === "https:");

  // Next.js reads the nonce from the request's CSP header and puts it on
  // its own scripts; the root layout reads x-nonce for the theme script.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  return response;
});

export const config = {
  // Skip API routes, Next internals and any static file (anything with
  // a file extension, e.g. images in /public).
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[\\w]+$).*)"],
};
