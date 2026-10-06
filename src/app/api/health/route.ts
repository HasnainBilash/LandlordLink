import { prisma } from "@/lib/prisma";

// Health check for uptime monitors and for checking a deploy by hand.
//
//   GET /api/health              the app is up (no database query — safe
//                                to call every few minutes; a database
//                                check that often would keep Neon's free
//                                tier from ever going to sleep)
//   GET /api/health?check=db     also runs SELECT 1; 503 if the database
//                                can't be reached
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
  const checkDatabase = new URL(request.url).searchParams.get("check") === "db";

  if (!checkDatabase) {
    return Response.json({ ok: true, version }, { headers: NO_STORE });
  }

  const started = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json(
      { ok: true, version, database: { ok: true, ms: Date.now() - started } },
      { headers: NO_STORE }
    );
  } catch {
    return Response.json(
      { ok: false, version, database: { ok: false } },
      { status: 503, headers: NO_STORE }
    );
  }
}
