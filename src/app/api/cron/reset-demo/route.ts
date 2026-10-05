import { timingSafeEqual } from "node:crypto";

import { resetDemoData } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";

// Rebuilds the public demo every night (schedule in vercel.json). Vercel
// Cron sends "Authorization: Bearer <CRON_SECRET>"; any other caller gets
// a 401, and so does everyone if CRON_SECRET isn't set.
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");

  if (!secret || !header) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);

  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await resetDemoData(prisma);

  return Response.json({ ok: true, ...summary });
}
