import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

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

  return NextResponse.next();
});

export const config = {
  // Skip API routes, Next internals and any static file (anything with
  // a file extension, e.g. images in /public).
  matcher: ["/((?!api|_next/static|_next/image|.*\\.[\\w]+$).*)"],
};
