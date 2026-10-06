import { isDemoEmail } from "@/lib/demo";
import { toDateInputValue } from "@/lib/format";
import { prisma } from "@/lib/prisma";

// Daily message limits for the assistant, so one account can't use up the
// AI provider's quota. Days follow Bangladesh time.
const DEFAULT_DAILY_LIMIT = 50;
// The public demo account is shared by every visitor.
const DEFAULT_DEMO_DAILY_LIMIT = 100;

function limitFromEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export async function getAssistantQuota(user: { id: string; email?: string | null }) {
  const limit = isDemoEmail(user.email)
    ? limitFromEnv("ASSISTANT_DEMO_DAILY_LIMIT", DEFAULT_DEMO_DAILY_LIMIT)
    : limitFromEnv("ASSISTANT_DAILY_LIMIT", DEFAULT_DAILY_LIMIT);

  const day = toDateInputValue(new Date());

  const usage = await prisma.assistantUsage.findUnique({
    where: { userId_day: { userId: user.id, day } },
    select: { messages: true },
  });

  const used = usage?.messages ?? 0;

  return { day, limit, remaining: Math.max(limit - used, 0) };
}

// Counts one answered message; returns how many are left today.
export async function countAssistantMessage(userId: string, quota: { day: string; limit: number }) {
  const usage = await prisma.assistantUsage.upsert({
    where: { userId_day: { userId, day: quota.day } },
    create: { userId, day: quota.day, messages: 1 },
    update: { messages: { increment: 1 } },
    select: { messages: true },
  });

  return Math.max(quota.limit - usage.messages, 0);
}
