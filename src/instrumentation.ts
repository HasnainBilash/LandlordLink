import type { Instrumentation } from "next";

// Runs once when a server instance starts.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { checkEnv } = await import("./lib/env");
    checkEnv();
  }
}

// Every server error, as one JSON line that is easy to search in Vercel's
// logs. To send errors to Sentry or a similar service, report them here.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;

  console.error(
    JSON.stringify({
      level: "error",
      message: error instanceof Error ? error.message : String(error),
      digest,
      method: request.method,
      path: request.path,
      route: context.routePath,
      type: context.routeType,
    })
  );
};
