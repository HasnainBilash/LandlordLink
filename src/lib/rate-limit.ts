import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

// Fixed-window rate limits stored in Postgres, so every server instance
// (serverless functions don't share memory) counts against the same
// numbers. Times are compared in UTC, like Prisma stores them.

type Counter = { count: number; resetAt: Date };

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function secondsUntil(date: Date) {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 1000));
}

// Counts one attempt for `key` and says whether it is still within
// `limit` per window. One atomic statement, so concurrent requests count
// correctly.
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const [row] = await prisma.$queryRaw<Counter[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, (NOW() AT TIME ZONE 'UTC') + make_interval(secs => ${windowSeconds}::double precision))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."resetAt" <= (NOW() AT TIME ZONE 'UTC') THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimit"."resetAt" <= (NOW() AT TIME ZONE 'UTC')
          THEN (NOW() AT TIME ZONE 'UTC') + make_interval(secs => ${windowSeconds}::double precision)
        ELSE "RateLimit"."resetAt"
      END
    RETURNING "count", "resetAt"`;

  return { allowed: row.count <= limit, retryAfterSeconds: secondsUntil(row.resetAt) };
}

// Whether `key` already used up `limit` in its current window, without
// counting anything (e.g. check failed sign-ins before trying a password).
export async function isRateLimited(key: string, limit: number): Promise<RateLimitResult> {
  const [row] = await prisma.$queryRaw<Counter[]>`
    SELECT "count", "resetAt" FROM "RateLimit"
    WHERE "key" = ${key} AND "resetAt" > (NOW() AT TIME ZONE 'UTC')`;

  return {
    allowed: !row || row.count < limit,
    retryAfterSeconds: row ? secondsUntil(row.resetAt) : 0,
  };
}

// The visitor's IP address. On Vercel x-forwarded-for is set by the
// platform (not the client); "unknown" groups requests that have none.
export function ipFromHeaders(source: Headers) {
  return (
    source.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    source.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function clientIp() {
  return ipFromHeaders(await headers());
}

// "a minute" / "12 minutes", for messages.
export function waitText(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "a minute" : `${minutes} minutes`;
}
