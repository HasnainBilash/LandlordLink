import { z } from "zod";

import { formatMoney } from "@/lib/format";
import { computePaymentStatus, sumPayments } from "@/lib/payment-status";
import { prisma } from "@/lib/prisma";
import { MONTH_NAMES } from "@/lib/rent";
import { UTILITY_TYPE_LABELS } from "@/lib/utility-bill";

import type { ProposedAction } from "./actions";
import type { ToolSpec } from "./types";

// Shared by the assistant's tools. Every tool is scoped to the signed-in
// landlord: it takes names and flat numbers (never database IDs) and only
// searches that landlord's buildings. Results leave out contact details
// and national IDs — the model doesn't need them.

export type ToolContext = {
  ownerId: string;
  // Changes prepared while answering this question, for the confirm popup.
  proposals: ProposedAction[];
};

export function defineTool<Args extends z.ZodObject>(definition: {
  name: string;
  description: string;
  args: Args;
  run: (args: z.infer<Args>, context: ToolContext) => Promise<unknown>;
}) {
  // JSON Schema for the model, without the "$schema" key.
  const parameters: Record<string, unknown> = { ...z.toJSONSchema(definition.args) };
  delete parameters.$schema;

  return {
    spec: {
      name: definition.name,
      description: definition.description,
      parameters,
    } satisfies ToolSpec,

    async execute(rawArgs: unknown, context: ToolContext) {
      const parsed = definition.args.safeParse(rawArgs ?? {});

      if (!parsed.success) {
        return { error: `Invalid arguments: ${parsed.error.issues.map((issue) => issue.message).join("; ")}` };
      }

      return definition.run(parsed.data, context);
    },
  };
}

export const STATUS_WORDS: Record<string, string> = {
  PENDING: "due",
  PARTIAL: "partly paid",
  PAID: "paid",
  OVERDUE: "overdue",
  WRITTEN_OFF: "written off",
};

export const AUDIENCE_WORDS = {
  ALL: "everyone",
  TENANTS: "tenants only",
  LANDLORDS: "only the landlord",
} as const;

export function clip(text: string | null, max = 200) {
  if (!text) return undefined;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function monthLabel(month: number, year: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

type UnpaidBill = {
  type: keyof typeof UTILITY_TYPE_LABELS;
  month: number;
  year: number;
  amount: unknown;
  dueDate: Date;
  writtenOffAt: Date | null;
  payments: { amount: unknown }[];
};

export function describeBill(bill: UnpaidBill, now: Date) {
  const paidTotal = sumPayments(bill.payments);

  return {
    what: `${UTILITY_TYPE_LABELS[bill.type]} — ${monthLabel(bill.month, bill.year)}`,
    amount: formatMoney(Number(bill.amount)),
    paid: formatMoney(paidTotal),
    status:
      STATUS_WORDS[
        computePaymentStatus({
          amount: Number(bill.amount),
          paidTotal,
          dueDate: bill.dueDate,
          now,
          writtenOffAt: bill.writtenOffAt,
        })
      ],
  };
}

type BuildingScope =
  | { error: string }
  | { ids: string[]; buildings: { id: string; name: string }[] };

// The landlord's buildings the model asked about: all of them, or the ones
// whose name matches. An error lists the real names so the model can retry.
export async function resolveBuildings(ownerId: string, name?: string): Promise<BuildingScope> {
  const buildings = await prisma.building.findMany({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const matches = name?.trim() ? pickByName(buildings, name, (building) => building.name) : buildings;

  if (matches.length === 0) {
    return {
      error: `No building called "${name}". The landlord's buildings: ${buildings.map((building) => building.name).join(", ") || "none yet"}.`,
    };
  }

  return { ids: matches.map((building) => building.id), buildings: matches };
}

// Items whose name contains the query; an exact (case-insensitive) match
// wins, so "Nasrin Sultana" isn't confused with "Taslima Nasrin".
export function pickByName<T>(items: T[], query: string, nameOf: (item: T) => string) {
  const wanted = query.trim().toLowerCase();
  const exact = items.filter((item) => nameOf(item).toLowerCase() === wanted);

  return exact.length > 0 ? exact : items.filter((item) => nameOf(item).toLowerCase().includes(wanted));
}

// "203", "Flat 203", "flat no. 203" → "203".
export function normalizeFlatNumber(flat: string) {
  return flat.trim().replace(/^flat\s*(no\.?\s*)?/i, "");
}

// "October 2026", "oct", "2026-10", "10/2026" → { month, year? };
// null when it can't be read.
export function parseMonth(text: string): { month: number; year?: number } | null {
  const value = text.trim().toLowerCase();
  const year = value.match(/\b(20\d{2})\b/)?.[1];

  // Any word of 3+ letters that starts a month name: "oct", "sept",
  // "october" (the app itself writes "Sept").
  const words = value.split(/[^a-z]+/).filter((word) => word.length >= 3);
  const named = MONTH_NAMES.findIndex((name) =>
    words.some((word) => name.toLowerCase().startsWith(word))
  );

  let month = named >= 0 ? named + 1 : undefined;

  if (!month) {
    const yearFirst = value.match(/\b20\d{2}[-/.](\d{1,2})\b/);
    const monthFirst = value.match(/\b(\d{1,2})[-/.]20\d{2}\b/);
    month = Number((yearFirst ?? monthFirst)?.[1]) || undefined;
  }

  if (!month || month < 1 || month > 12) return null;

  return { month, year: year ? Number(year) : undefined };
}

export const buildingArg = z
  .string()
  .optional()
  .describe("Building name, if the question is about one building");
