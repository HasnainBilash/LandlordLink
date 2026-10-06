import { z } from "zod";

import { formatDate, formatFlatNumber, formatMoney, toDateInputValue } from "@/lib/format";
import { remainingBalance } from "@/lib/payment-status";
import { prisma } from "@/lib/prisma";
import { reconcileRentForOwner } from "@/lib/reconcile-rent";
import { UTILITY_TYPE_LABELS } from "@/lib/utility-bill";
import { createNoticeSchema } from "@/lib/validations/notice";

import { MAX_ACTIONS_PER_QUESTION, saveProposedAction, type ProposedAction } from "./actions";
import {
  buildingArg,
  defineTool,
  monthLabel,
  normalizeFlatNumber,
  parseMonth,
  pickByName,
  resolveBuildings,
  type ToolContext,
} from "./tool-kit";

// Changes the assistant can prepare. None of these change anything: they
// find exactly what the landlord meant, check it, and save it as a pending
// change that the landlord must confirm in a popup (see ./actions.ts).

const TOO_MANY = {
  error: `That's more than ${MAX_ACTIONS_PER_QUESTION} changes at once. Ask the landlord to do the rest in a second message.`,
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string) {
  return DATE_PATTERN.test(value) && !Number.isNaN(new Date(value).getTime());
}

// Hands prepared changes to the chat and tells the model what to say.
function prepared(context: ToolContext, proposals: ProposedAction[], note?: string) {
  context.proposals.push(...proposals);

  return {
    status: "Prepared, not done yet. The landlord now sees it in a confirmation popup.",
    changes: proposals.map(
      (proposal) =>
        `${proposal.title}: ${proposal.details.map((detail) => `${detail.label} ${detail.value}`).join("; ")}`
    ),
    ...(note ? { note } : {}),
  };
}

const round = (value: number) => Math.round(value * 100) / 100;

const flatArg = z.string().optional().describe('Flat number, e.g. "203"');

// The one current tenant the landlord means, by name and/or flat.
async function findActiveLease(
  ownerId: string,
  { tenant, flat, building }: { tenant?: string; flat?: string; building?: string }
) {
  if (!tenant?.trim() && !flat?.trim()) {
    return { error: "Say which tenant (name) or which flat." };
  }

  const scope = await resolveBuildings(ownerId, building);
  if ("error" in scope) return scope;

  const leases = await prisma.lease.findMany({
    where: {
      status: "ACTIVE",
      flat: {
        deletedAt: null,
        ...(flat?.trim() ? { flatNumber: { equals: normalizeFlatNumber(flat), mode: "insensitive" } } : {}),
        floor: { buildingId: { in: scope.ids } },
      },
      ...(tenant?.trim()
        ? { tenant: { user: { name: { contains: tenant.trim(), mode: "insensitive" } } } }
        : {}),
    },
    take: 20,
    select: {
      id: true,
      tenant: { select: { user: { select: { name: true } } } },
      flat: { select: { flatNumber: true, floor: { select: { building: { select: { name: true } } } } } },
    },
  });

  const matches = tenant?.trim()
    ? pickByName(leases, tenant, (lease) => lease.tenant.user.name)
    : leases;

  const describe = (lease: (typeof leases)[number]) =>
    `${lease.tenant.user.name} (flat ${formatFlatNumber(lease.flat.flatNumber)}, ${lease.flat.floor.building.name})`;

  if (matches.length === 0) {
    return { error: `No current tenant matches${tenant ? ` "${tenant}"` : ""}${flat ? ` in flat ${flat}` : ""}.` };
  }

  if (matches.length > 1) {
    return { error: `Several current tenants match: ${matches.map(describe).join("; ")}. Ask which one.` };
  }

  const lease = matches[0];

  return {
    lease: {
      id: lease.id,
      tenantName: lease.tenant.user.name,
      place: `${formatFlatNumber(lease.flat.flatNumber)} · ${lease.flat.floor.building.name}`,
    },
  };
}

// The one pending join request the landlord means, by applicant and/or flat.
async function findPendingRequest(
  ownerId: string,
  { applicant, flat, building }: { applicant?: string; flat?: string; building?: string }
) {
  if (!applicant?.trim() && !flat?.trim()) {
    return { error: "Say whose request (applicant's name) or which flat." };
  }

  const scope = await resolveBuildings(ownerId, building);
  if ("error" in scope) return scope;

  const requests = await prisma.joinRequest.findMany({
    where: {
      status: "PENDING",
      buildingId: { in: scope.ids },
      flat: {
        deletedAt: null,
        ...(flat?.trim() ? { flatNumber: { equals: normalizeFlatNumber(flat), mode: "insensitive" } } : {}),
      },
      ...(applicant?.trim()
        ? { tenant: { user: { name: { contains: applicant.trim(), mode: "insensitive" } } } }
        : {}),
    },
    take: 20,
    select: {
      id: true,
      createdAt: true,
      tenant: { select: { user: { select: { name: true } } } },
      flat: {
        select: {
          id: true,
          flatNumber: true,
          monthlyRent: true,
          floor: { select: { building: { select: { name: true } } } },
        },
      },
    },
  });

  const matches = applicant?.trim()
    ? pickByName(requests, applicant, (request) => request.tenant.user.name)
    : requests;

  const describe = (request: (typeof requests)[number]) =>
    `${request.tenant.user.name} for flat ${formatFlatNumber(request.flat.flatNumber)}, ${request.flat.floor.building.name}`;

  if (matches.length === 0) {
    return { error: `No pending request matches${applicant ? ` "${applicant}"` : ""}${flat ? ` for flat ${flat}` : ""}.` };
  }

  if (matches.length > 1) {
    return { error: `Several pending requests match: ${matches.map(describe).join("; ")}. Ask which one.` };
  }

  const request = matches[0];

  return {
    request: {
      id: request.id,
      createdAt: request.createdAt,
      flatId: request.flat.id,
      listedRent: Number(request.flat.monthlyRent),
      applicant: request.tenant.user.name,
      place: `${formatFlatNumber(request.flat.flatNumber)} · ${request.flat.floor.building.name}`,
    },
  };
}

export const WRITE_TOOLS = [
  defineTool({
    name: "record_payment",
    description:
      "Prepare recording a payment a current tenant made, for rent or a utility bill. Nothing is saved until the landlord confirms it in a popup. Without a month, the amount goes to the oldest unpaid months first (split over several if needed); with a month, it must fit that month.",
    args: z.object({
      tenant: z.string().optional().describe("Tenant name or part of it"),
      flat: flatArg,
      building: buildingArg,
      amount: z.number().positive().describe("Amount paid, in taka"),
      month: z
        .string()
        .optional()
        .describe('Which month, e.g. "October 2026". Leave out to pay the oldest unpaid months first'),
      what: z.enum(["rent", "bill"]).optional().describe("Rent (default) or a utility bill"),
      billType: z
        .enum(["electricity", "gas", "water", "internet", "security", "other"])
        .optional()
        .describe("For a bill: which kind"),
      reference: z.string().max(100).optional().describe("bKash TrxID, receipt number or similar"),
    }),
    async run(args, context) {
      if (context.proposals.length >= MAX_ACTIONS_PER_QUESTION) return TOO_MANY;

      const found = await findActiveLease(context.ownerId, args);
      if ("error" in found) return found;

      const { lease } = found;
      const month = args.month ? parseMonth(args.month) : undefined;

      if (month === null) {
        return { error: `Couldn't read the month "${args.month}". Use a month and year, e.g. "October 2026".` };
      }

      // Make sure this month's rent exists and statuses are current.
      await reconcileRentForOwner(context.ownerId);

      const sameMonth = (item: { month: number; year: number }) =>
        !month || (item.month === month.month && (!month.year || item.year === month.year));

      type Unpaid = {
        type: "RENT" | "UTILITY_BILL";
        id: string;
        what: string;
        left: number;
        month: number;
        year: number;
      };

      let unpaid: Unpaid[];

      if (args.what === "bill") {
        const bills = await prisma.utilityBill.findMany({
          where: {
            leaseId: lease.id,
            writtenOffAt: null,
            ...(args.billType ? { type: args.billType.toUpperCase() as keyof typeof UTILITY_TYPE_LABELS } : {}),
          },
          orderBy: [{ year: "asc" }, { month: "asc" }],
          select: { id: true, type: true, month: true, year: true, amount: true, writtenOffAt: true, payments: { select: { amount: true } } },
        });

        unpaid = bills
          .map((bill) => ({
            type: "UTILITY_BILL" as const,
            id: bill.id,
            what: `${UTILITY_TYPE_LABELS[bill.type]} — ${monthLabel(bill.month, bill.year)}`,
            left: remainingBalance(bill),
            month: bill.month,
            year: bill.year,
          }))
          .filter((bill) => bill.left > 0);
      } else {
        const rents = await prisma.rent.findMany({
          where: { leaseId: lease.id, status: { in: ["PENDING", "OVERDUE", "PARTIAL"] } },
          orderBy: [{ year: "asc" }, { month: "asc" }],
          select: { id: true, month: true, year: true, amount: true, status: true, payments: { select: { amount: true } } },
        });

        unpaid = rents
          .map((rent) => ({
            type: "RENT" as const,
            id: rent.id,
            what: `Rent — ${monthLabel(rent.month, rent.year)}`,
            left: remainingBalance(rent),
            month: rent.month,
            year: rent.year,
          }))
          .filter((rent) => rent.left > 0);
      }

      const unpaidList = unpaid.map((item) => `${item.what} (${formatMoney(item.left)} left)`).join(", ");
      const candidates = unpaid.filter(sameMonth);

      if (candidates.length === 0) {
        return {
          error: unpaid.length
            ? `Nothing unpaid matches for ${lease.tenantName}. Unpaid: ${unpaidList}.`
            : `${lease.tenantName} has no unpaid ${args.what === "bill" ? "bills" : "rent"}.`,
        };
      }

      const amount = round(args.amount);
      const allocations: { item: Unpaid; part: number }[] = [];

      if (month) {
        // A named month: the amount has to fit it.
        const item = candidates[0];

        if (amount > item.left + 0.001) {
          return {
            error: `${formatMoney(amount)} is more than the ${formatMoney(item.left)} left on ${item.what}. Ask whether the rest is for other months (then leave the month out and it is split, oldest first). Unpaid: ${unpaidList}.`,
          };
        }

        allocations.push({ item, part: amount });
      } else {
        // Oldest unpaid months first, the way a landlord applies a payment.
        let rest = amount;

        for (const item of unpaid) {
          if (rest <= 0.001) break;
          const part = round(Math.min(rest, item.left));
          allocations.push({ item, part });
          rest = round(rest - part);
        }

        if (rest > 0.001) {
          const total = unpaid.reduce((sum, item) => sum + item.left, 0);

          return {
            error: `${formatMoney(amount)} is more than all ${lease.tenantName} owes (${formatMoney(total)}). Unpaid: ${unpaidList}.`,
          };
        }
      }

      if (context.proposals.length + allocations.length > MAX_ACTIONS_PER_QUESTION) return TOO_MANY;

      const reference = args.reference?.trim() || undefined;
      const split = allocations.length > 1;
      const proposals: ProposedAction[] = [];

      for (const { item, part } of allocations) {
        proposals.push(
          await saveProposedAction(
            context.ownerId,
            "record_payment",
            { target: { type: item.type, id: item.id }, amount: part, transactionRef: reference },
            {
              title: "Record payment",
              details: [
                { label: "Tenant", value: lease.tenantName },
                { label: "Flat", value: lease.place },
                { label: "For", value: item.what },
                {
                  label: "Amount",
                  value:
                    part === item.left
                      ? `${formatMoney(part)} (all that's left)`
                      : `${formatMoney(part)} of ${formatMoney(item.left)} left`,
                },
                ...(split
                  ? [{ label: "Note", value: `Part of a ${formatMoney(amount)} payment, split over ${allocations.length} months` }]
                  : []),
                ...(reference ? [{ label: "Reference", value: reference }] : []),
              ],
            }
          )
        );
      }

      return prepared(
        context,
        proposals,
        split ? `The ${formatMoney(amount)} was split over ${allocations.length} months, oldest first. Mention this.` : undefined
      );
    },
  }),

  defineTool({
    name: "approve_request",
    description:
      "Prepare approving a pending request to rent a flat, which creates the lease. Nothing changes until the landlord confirms it in a popup. Other pending requests for the same flat are declined when it is approved.",
    args: z.object({
      applicant: z.string().optional().describe("Name of the person who sent the request"),
      flat: flatArg,
      building: buildingArg,
      startDate: z.string().optional().describe("Lease start date as YYYY-MM-DD. Default: today"),
      monthlyRent: z.number().positive().optional().describe("Rent per month in taka. Default: the flat's listed rent"),
      deposit: z.number().min(0).optional().describe("Security deposit in taka, if any"),
    }),
    async run(args, context) {
      if (context.proposals.length >= MAX_ACTIONS_PER_QUESTION) return TOO_MANY;

      const found = await findPendingRequest(context.ownerId, args);
      if ("error" in found) return found;

      const { request } = found;
      const startDate = args.startDate?.trim() || toDateInputValue(new Date());

      if (!isValidDate(startDate)) {
        return { error: `"${args.startDate}" isn't a date. Use YYYY-MM-DD.` };
      }

      const monthlyRent = Math.round((args.monthlyRent ?? request.listedRent) * 100) / 100;

      const otherRequests = await prisma.joinRequest.count({
        where: { flatId: request.flatId, status: "PENDING", id: { not: request.id } },
      });

      const proposal = await saveProposedAction(
        context.ownerId,
        "approve_request",
        { requestId: request.id, startDate, monthlyRent, deposit: args.deposit },
        {
          title: "Approve request",
          details: [
            { label: "Applicant", value: request.applicant },
            { label: "Flat", value: request.place },
            { label: "Lease starts", value: formatDate(startDate) },
            { label: "Rent", value: `${formatMoney(monthlyRent)}/month` },
            { label: "Deposit", value: args.deposit ? formatMoney(args.deposit) : "None" },
            ...(otherRequests > 0
              ? [{ label: "Also", value: `Declines ${otherRequests} other request${otherRequests === 1 ? "" : "s"} for this flat` }]
              : []),
          ],
        }
      );

      return prepared(context, [proposal]);
    },
  }),

  defineTool({
    name: "reject_request",
    description:
      "Prepare rejecting a pending request to rent a flat. Nothing changes until the landlord confirms it in a popup.",
    args: z.object({
      applicant: z.string().optional().describe("Name of the person who sent the request"),
      flat: flatArg,
      building: buildingArg,
    }),
    async run(args, context) {
      if (context.proposals.length >= MAX_ACTIONS_PER_QUESTION) return TOO_MANY;

      const found = await findPendingRequest(context.ownerId, args);
      if ("error" in found) return found;

      const { request } = found;

      const proposal = await saveProposedAction(
        context.ownerId,
        "reject_request",
        { requestId: request.id },
        {
          title: "Reject request",
          details: [
            { label: "Applicant", value: request.applicant },
            { label: "Flat", value: request.place },
            { label: "Sent", value: formatDate(request.createdAt) },
          ],
        }
      );

      return prepared(context, [proposal]);
    },
  }),

  defineTool({
    name: "post_notice",
    description:
      "Prepare a notice for one building's notice board; tenants see it on their Home page. Nothing is posted until the landlord confirms it in a popup. For several buildings, prepare one notice per building.",
    args: z.object({
      building: z.string().min(1).describe("Building name"),
      title: z.string().describe("Short title, e.g. \"Water off on Friday\""),
      message: z.string().describe("The notice text"),
      audience: z
        .enum(["everyone", "tenants", "only_me"])
        .optional()
        .describe("Who sees it. Default: everyone"),
      expires: z.string().optional().describe("Last day to show it, as YYYY-MM-DD. Default: no end"),
    }),
    async run(args, context) {
      if (context.proposals.length >= MAX_ACTIONS_PER_QUESTION) return TOO_MANY;

      const scope = await resolveBuildings(context.ownerId, args.building);
      if ("error" in scope) return scope;

      if (scope.buildings.length > 1) {
        return {
          error: `Several buildings match "${args.building}": ${scope.buildings.map((building) => building.name).join(", ")}. Ask which one.`,
        };
      }

      const building = scope.buildings[0];
      const expires = args.expires?.trim() || undefined;

      if (expires && !isValidDate(expires)) {
        return { error: `"${args.expires}" isn't a date. Use YYYY-MM-DD.` };
      }

      if (expires && expires < toDateInputValue(new Date())) {
        return { error: `${formatDate(expires)} has already passed. Pick a later end date.` };
      }

      const audience = ({ everyone: "ALL", tenants: "TENANTS", only_me: "LANDLORDS" } as const)[
        args.audience ?? "everyone"
      ];

      const parsed = createNoticeSchema.safeParse({
        title: args.title,
        content: args.message,
        audience,
        expiresAt: expires,
      });

      if (!parsed.success) {
        return { error: parsed.error.issues.map((issue) => issue.message).join(" ") };
      }

      const proposal = await saveProposedAction(
        context.ownerId,
        "post_notice",
        {
          buildingId: building.id,
          title: parsed.data.title,
          content: parsed.data.content,
          audience,
          expiresAt: expires,
        },
        {
          title: "Post notice",
          details: [
            { label: "Building", value: building.name },
            { label: "Title", value: parsed.data.title },
            { label: "Message", value: parsed.data.content },
            {
              label: "Visible to",
              value: { ALL: "Everyone", TENANTS: "Tenants only", LANDLORDS: "Only you" }[audience],
            },
            { label: "Ends", value: expires ? formatDate(expires) : "Never" },
          ],
        }
      );

      return prepared(context, [proposal]);
    },
  }),
];
