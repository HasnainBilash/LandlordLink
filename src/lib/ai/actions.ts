import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { approveJoinRequest } from "@/actions/join-request/approve-join-request";
import { rejectJoinRequest } from "@/actions/join-request/reject-join-request";
import { createNotice } from "@/actions/notice/create-notice";
import { recordPayment } from "@/actions/payment/record-payment";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result";

// Changes the assistant can prepare. The assistant never makes a change
// itself: each one is saved as a pending AssistantAction and shown to the
// landlord, and only runs — through the same server actions as the app's
// own buttons, with the same checks — once they confirm it.

const ACTION_TTL_MS = 15 * 60 * 1000;

// Changes one question may prepare.
export const MAX_ACTIONS_PER_QUESTION = 5;

export type ActionDisplay = {
  title: string;
  details: { label: string; value: string }[];
};

// What the chat shows (no database IDs).
export type ProposedAction = ActionDisplay & {
  id: string;
  kind: ActionKind;
  expiresAt: string;
};

// Payloads are checked again before an action runs.
const PAYLOADS = {
  record_payment: z.object({
    target: z.object({ type: z.enum(["RENT", "UTILITY_BILL"]), id: z.string() }),
    amount: z.number().positive(),
    transactionRef: z.string().optional(),
  }),
  approve_request: z.object({
    requestId: z.string(),
    startDate: z.string(),
    monthlyRent: z.number().positive(),
    deposit: z.number().min(0).optional(),
  }),
  reject_request: z.object({ requestId: z.string() }),
  post_notice: z.object({
    buildingId: z.string(),
    title: z.string(),
    content: z.string(),
    audience: z.enum(["ALL", "TENANTS", "LANDLORDS"]),
    expiresAt: z.string().optional(),
  }),
};

export type ActionKind = keyof typeof PAYLOADS;

export type ActionPayload<Kind extends ActionKind> = z.infer<(typeof PAYLOADS)[Kind]>;

export async function saveProposedAction<Kind extends ActionKind>(
  ownerId: string,
  kind: Kind,
  payload: ActionPayload<Kind>,
  display: ActionDisplay
): Promise<ProposedAction> {
  const action = await prisma.assistantAction.create({
    data: {
      userId: ownerId,
      kind,
      payload: payload as Prisma.InputJsonValue,
      summary: display as Prisma.InputJsonValue,
      expiresAt: new Date(Date.now() + ACTION_TTL_MS),
    },
    select: { id: true, expiresAt: true },
  });

  return { id: action.id, kind, ...display, expiresAt: action.expiresAt.toISOString() };
}

function form(values: Record<string, string | number | undefined>) {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value === undefined ? "" : String(value));
  }

  return data;
}

// Runs a confirmed action through the app's own server action.
export async function runAction(kind: string, rawPayload: unknown): Promise<ActionResult> {
  switch (kind) {
    case "record_payment": {
      const payload = PAYLOADS.record_payment.parse(rawPayload);
      return recordPayment(
        payload.target,
        form({ amount: payload.amount, transactionRef: payload.transactionRef })
      );
    }

    case "approve_request": {
      const payload = PAYLOADS.approve_request.parse(rawPayload);
      return approveJoinRequest(
        payload.requestId,
        form({ startDate: payload.startDate, monthlyRent: payload.monthlyRent, deposit: payload.deposit })
      );
    }

    case "reject_request": {
      const payload = PAYLOADS.reject_request.parse(rawPayload);
      return rejectJoinRequest(payload.requestId);
    }

    case "post_notice": {
      const payload = PAYLOADS.post_notice.parse(rawPayload);
      return createNotice(
        payload.buildingId,
        form({
          title: payload.title,
          content: payload.content,
          audience: payload.audience,
          expiresAt: payload.expiresAt,
        })
      );
    }

    default:
      return { success: false, message: "The assistant can't make that change.", errors: {} };
  }
}
