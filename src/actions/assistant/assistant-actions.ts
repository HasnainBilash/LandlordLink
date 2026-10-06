"use server";

import { auth } from "@/auth";
import { runAction } from "@/lib/ai/actions";
import { prisma } from "@/lib/prisma";

import type { ActionResult } from "@/types/action-result";

function failure(message: string): ActionResult {
  return { success: false, message, errors: {} };
}

// Why an action can't run (any more).
async function explainUnavailable(id: string, userId: string) {
  const action = await prisma.assistantAction.findFirst({
    where: { id, userId },
    select: { status: true, expiresAt: true },
  });

  if (!action) return "This change isn't available.";
  if (action.status === "DONE") return "This change was already made.";
  if (action.status === "RUNNING") return "This change is already being made.";
  if (action.status === "CANCELLED") return "This change was cancelled.";
  if (action.status === "FAILED") return "This change didn't go through. Ask the assistant again.";
  return "This confirmation has expired. Ask the assistant again.";
}

// The landlord confirmed a change the assistant prepared: run it, once.
export async function confirmAssistantAction(id: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return failure("Unauthorized.");
  }

  const userId = session.user.id;

  // Claiming it is one atomic update, so a double click or a replayed
  // request can't run the same change twice.
  const claimed = await prisma.assistantAction.updateMany({
    where: { id, userId, status: "PENDING", expiresAt: { gt: new Date() } },
    data: { status: "RUNNING", decidedAt: new Date() },
  });

  if (claimed.count === 0) {
    return failure(await explainUnavailable(id, userId));
  }

  const action = await prisma.assistantAction.findUniqueOrThrow({
    where: { id },
    select: { kind: true, payload: true },
  });

  let result: ActionResult;

  try {
    result = await runAction(action.kind, action.payload);
  } catch (error) {
    console.error("Assistant action failed", error);
    result = failure("Something went wrong. Nothing was changed.");
  }

  await prisma.assistantAction.update({
    where: { id },
    data: { status: result.success ? "DONE" : "FAILED", result: result.message },
  });

  return result;
}

export async function cancelAssistantAction(id: string): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "LANDLORD") {
    return failure("Unauthorized.");
  }

  await prisma.assistantAction.updateMany({
    where: { id, userId: session.user.id, status: "PENDING" },
    data: { status: "CANCELLED", decidedAt: new Date() },
  });

  return { success: true, message: "Cancelled — nothing was changed.", errors: {} };
}
