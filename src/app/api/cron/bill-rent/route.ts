import { isCronRequest, unauthorized } from "@/lib/cron";
import { billRentForAllLeases } from "@/lib/reconcile-rent";

// Nightly rent billing (schedule in vercel.json, just after midnight UTC,
// when a new rent month starts): creates the month's rent for every active
// lease and marks unpaid rent from past months overdue. Running it again
// changes nothing.
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronRequest(request)) return unauthorized();

  const billed = await billRentForAllLeases();

  return Response.json({ ok: true, ...billed });
}
