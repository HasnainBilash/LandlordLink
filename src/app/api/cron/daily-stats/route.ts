import { isCronRequest, unauthorized } from "@/lib/cron";
import { recordDailyStats } from "@/lib/daily-stats";

// Nightly data job (schedule in vercel.json, an hour after rent billing):
// records how every building stood at the end of yesterday, and fills in
// any of the last 90 days that are missing. Running it again changes
// nothing but yesterday's numbers.
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronRequest(request)) return unauthorized();

  const result = await recordDailyStats();

  return Response.json({ ok: true, ...result });
}
