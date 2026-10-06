import { z } from "zod";

// Checked once when the server starts (src/instrumentation.ts): a missing
// setting fails loudly with a clear message instead of as a confusing error
// on the first request.
const schema = z.object({
  DATABASE_URL: z
    .string({ error: "is missing (the Neon pooled connection string)" })
    .startsWith("postgres", "should be a postgresql:// connection string"),
  AUTH_SECRET: z.string({ error: "is missing (generate one with: npx auth secret)" }).min(1),
  DIRECT_URL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  AI_PROVIDER: z.enum(["fake"], { error: 'can only be "fake" (tests)' }).optional(),
  ASSISTANT_DAILY_LIMIT: z.coerce.number().int().positive().optional(),
  ASSISTANT_DEMO_DAILY_LIMIT: z.coerce.number().int().positive().optional(),
  ASSISTANT_PER_MINUTE_LIMIT: z.coerce.number().int().positive().optional(),
});

export function checkEnv() {
  const result = schema.safeParse(process.env);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")} ${issue.message}`)
      .join("\n");

    throw new Error(`Some settings are missing or wrong:\n${problems}\nSee .env.example and the README.`);
  }

  // Optional features that are switched off: worth a line in the logs.
  const env = result.data;
  const notes: string[] = [];

  if (env.AUTH_SECRET.length < 32) notes.push("AUTH_SECRET is short; use a long random value (npx auth secret).");
  if (!env.GEMINI_API_KEY && !env.AI_PROVIDER) notes.push("GEMINI_API_KEY is not set, so the AI assistant is off.");
  if (env.AI_PROVIDER === "fake") notes.push("AI_PROVIDER=fake: the assistant uses the test stand-in, not a real model.");
  if (process.env.VERCEL && !env.CRON_SECRET) notes.push("CRON_SECRET is not set, so the nightly jobs will be refused.");

  for (const note of notes) console.warn(`[settings] ${note}`);
}
