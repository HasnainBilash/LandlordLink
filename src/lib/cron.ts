import { timingSafeEqual } from "node:crypto";

// Vercel Cron calls our jobs with "Authorization: Bearer <CRON_SECRET>".
// Anything else is refused — and everything is, if CRON_SECRET isn't set.
export function isCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");

  if (!secret || !header) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);

  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
