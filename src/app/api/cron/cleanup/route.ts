import { isCronRequest, unauthorized } from "@/lib/cron";
import { toDateInputValue } from "@/lib/format";
import { prisma } from "@/lib/prisma";

// Nightly housekeeping (schedule in vercel.json): removes rows that have
// done their job, so these tables stay small.
export const maxDuration = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
  if (!isCronRequest(request)) return unauthorized();

  const now = Date.now();

  const [rateLimits, assistantUsage, assistantActions] = await prisma.$transaction([
    // Expired rate-limit windows.
    prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date(now) } } }),
    // Daily assistant counters older than a month.
    prisma.assistantUsage.deleteMany({ where: { day: { lt: toDateInputValue(new Date(now - 30 * DAY_MS)) } } }),
    // Changes the assistant prepared, kept 90 days as a record.
    prisma.assistantAction.deleteMany({ where: { createdAt: { lt: new Date(now - 90 * DAY_MS) } } }),
  ]);

  return Response.json({
    ok: true,
    removed: {
      rateLimits: rateLimits.count,
      assistantUsage: assistantUsage.count,
      assistantActions: assistantActions.count,
    },
  });
}
