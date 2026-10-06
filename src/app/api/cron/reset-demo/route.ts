import { isCronRequest, unauthorized } from "@/lib/cron";
import { resetDemoData } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";

// Rebuilds the public demo every night (schedule in vercel.json).
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronRequest(request)) return unauthorized();

  const summary = await resetDemoData(prisma);

  return Response.json({ ok: true, ...summary });
}
