import { z } from "zod";

import { auth } from "@/auth";
import { getAiProviders } from "@/lib/ai";
import { runAssistant } from "@/lib/ai/assistant";
import { AiBusyError } from "@/lib/ai/types";
import { countAssistantMessage, getAssistantQuota } from "@/lib/ai/usage";
import { rateLimit } from "@/lib/rate-limit";

// On top of the daily limit: messages per landlord per minute, so a burst
// can't use up the AI provider's per-minute quota for everyone.
const MESSAGES_PER_MINUTE = Number(process.env.ASSISTANT_PER_MINUTE_LIMIT) || 10;

// The landlord's AI assistant: one question in, one answer out. The chat
// history lives in the browser and comes along with each question.
export const maxDuration = 60;

const MAX_MESSAGE_LENGTH = 1000;

const requestSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
  // Earlier messages only give context, so long ones are shortened rather
  // than rejected (a long answer must not block the next question).
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().transform((text) => text.slice(0, 4000)),
      })
    )
    .max(50)
    .default([])
    .transform((history) => history.slice(-10)),
});

function reply(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status });
}

export async function POST(request: Request) {
  // JSON only, so other sites can't post here with a plain form.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return reply({ error: "Unsupported request." }, 415);
  }

  const session = await auth();

  if (!session?.user?.id) {
    return reply({ error: "Please sign in again." }, 401);
  }

  if (session.user.role !== "LANDLORD") {
    return reply({ error: "The assistant is only for landlords." }, 403);
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    const tooLong = parsed.error.issues.some(
      (issue) => issue.path[0] === "message" && issue.code === "too_big"
    );

    return reply(
      {
        error: tooLong
          ? `Please keep your message under ${MAX_MESSAGE_LENGTH.toLocaleString("en-IN")} characters.`
          : "That message couldn't be sent. Please try again.",
      },
      400
    );
  }

  const providers = getAiProviders();

  if (providers.length === 0) {
    return reply({ error: "The assistant isn't set up yet." }, 503);
  }

  const burst = await rateLimit(`assistant:${session.user.id}`, MESSAGES_PER_MINUTE, 60);

  if (!burst.allowed) {
    return reply({ error: "That's a lot of messages at once. Please wait a minute and try again." }, 429);
  }

  const quota = await getAssistantQuota(session.user);

  if (quota.remaining === 0) {
    return reply(
      { error: `You've used all ${quota.limit} assistant messages for today. It resets at midnight.`, remaining: 0 },
      429
    );
  }

  try {
    const answer = await runAssistant({
      providers,
      landlord: { id: session.user.id, name: session.user.name ?? "the landlord" },
      history: parsed.data.history,
      message: parsed.data.message,
    });

    const remaining = await countAssistantMessage(session.user.id, quota);

    // Prepared changes go to the confirm popup; nothing has changed yet.
    return reply({ reply: answer.reply, actions: answer.actions, remaining });
  } catch (error) {
    if (error instanceof AiBusyError) {
      return reply(
        {
          error: error.daily
            ? "The assistant has used up today's free AI quota. It will be back tomorrow."
            : "The assistant is busy right now. Please try again in a minute.",
        },
        503
      );
    }

    console.error("Assistant failed", error);
    return reply({ error: "Something went wrong. Please try again." }, 500);
  }
}
