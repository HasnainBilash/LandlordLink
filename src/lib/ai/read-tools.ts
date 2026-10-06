import type { FlatStatus, JoinRequestStatus } from "@prisma/client";
import { z } from "zod";

import { getNeedsAttention } from "@/actions/report/get-needs-attention";
import { getPortfolioReport } from "@/actions/report/get-portfolio-report";
import { getPastDues } from "@/actions/rent/get-past-dues";
import {
  compareFlatNumbers,
  formatDate,
  formatFlatNumber,
  formatFloor,
  formatMoney,
  formatTime,
} from "@/lib/format";
import { getOutstandingByLease } from "@/lib/lease-balance";
import { remainingBalance, sumPayments } from "@/lib/payment-status";
import { prisma } from "@/lib/prisma";
import { reconcileRentForOwner } from "@/lib/reconcile-rent";

import {
  AUDIENCE_WORDS,
  STATUS_WORDS,
  buildingArg,
  clip,
  defineTool,
  describeBill,
  monthLabel,
  resolveBuildings,
} from "./tool-kit";

// What the assistant can look up (read-only).
export const READ_TOOLS = [
  defineTool({
    name: "get_overview",
    description:
      "Summary of all the landlord's buildings: flats, occupancy, money collected (this month and all time), unpaid rent and bills, rent due vs collected for the last 6 months, pending requests, how many tenants are behind on rent and how much former tenants still owe.",
    args: z.object({}),
    async run() {
      const [report, attention] = await Promise.all([getPortfolioReport(), getNeedsAttention()]);

      if (!report) return { error: "No data." };

      const { occupancy } = report;

      return {
        buildings: report.buildings.map((building) => ({
          name: building.name,
          flats: building.totalFlats,
          occupied: building.occupied,
          vacant: building.vacant,
          underMaintenance: building.maintenance,
          occupancy: `${Math.round(building.occupancyRate)}%`,
          collectedAllTime: formatMoney(building.revenue),
          unpaidRent: formatMoney(building.outstandingRent),
          unpaidBills: formatMoney(building.outstandingUtilityBills),
        })),
        allBuildings: {
          flats: occupancy.total,
          occupied: occupancy.occupied,
          vacant: occupancy.vacant,
          underMaintenance: occupancy.maintenance,
          occupancy: `${occupancy.total > 0 ? Math.round((occupancy.occupied / occupancy.total) * 100) : 0}%`,
          collectedThisMonth: formatMoney(report.revenue.thisMonth),
          collectedAllTime: formatMoney(report.revenue.allTime),
          unpaidRent: formatMoney(report.outstanding.rent),
          unpaidBills: formatMoney(report.outstanding.utilityBills),
        },
        lastSixMonths: report.monthly.map((month) => ({
          month: month.label,
          rentDue: formatMoney(month.due),
          collected: formatMoney(month.collected),
        })),
        pendingRequests: attention.pendingRequests,
        tenantsBehindOnRent: attention.overdueFlats.length,
        formerTenantsWhoStillOwe: attention.pastDues.tenants,
        formerTenantsOweInTotal: formatMoney(attention.pastDues.amount),
      };
    },
  }),

  defineTool({
    name: "list_unpaid",
    description:
      "Current tenants who still owe rent or utility bills (including this month's rent if it isn't fully paid), with what each owes and for which months. Optionally for one building.",
    args: z.object({ building: buildingArg }),
    async run({ building }, { ownerId }) {
      const scope = await resolveBuildings(ownerId, building);
      if ("error" in scope) return scope;

      await reconcileRentForOwner(ownerId);

      const leases = await prisma.lease.findMany({
        where: { status: "ACTIVE", flat: { floor: { buildingId: { in: scope.ids } } } },
        select: {
          tenant: { select: { user: { select: { name: true } } } },
          flat: { select: { flatNumber: true, floor: { select: { building: { select: { name: true } } } } } },
          rents: {
            where: { status: { in: ["PENDING", "OVERDUE", "PARTIAL"] } },
            orderBy: [{ year: "asc" }, { month: "asc" }],
            select: { month: true, year: true, amount: true, status: true, payments: { select: { amount: true } } },
          },
          utilityBills: {
            where: { writtenOffAt: null },
            orderBy: [{ year: "asc" }, { month: "asc" }],
            select: {
              type: true,
              month: true,
              year: true,
              amount: true,
              dueDate: true,
              writtenOffAt: true,
              payments: { select: { amount: true } },
            },
          },
        },
      });

      const now = new Date();
      // Same calendar (UTC) as rent billing.
      const isThisMonth = (item: { month: number; year: number }) =>
        item.month === now.getUTCMonth() + 1 && item.year === now.getUTCFullYear();

      const tenants = leases
        .map((lease) => {
          const items = [
            ...lease.rents.map((rent) => ({
              what: `Rent — ${monthLabel(rent.month, rent.year)}`,
              month: rent.month,
              year: rent.year,
              left: remainingBalance(rent),
              status: STATUS_WORDS[rent.status],
            })),
            ...lease.utilityBills.map((bill) => {
              const { what, status } = describeBill(bill, now);
              return { what, month: bill.month, year: bill.year, left: remainingBalance(bill), status };
            }),
          ].filter((item) => item.left > 0);

          const total = items.reduce((sum, item) => sum + item.left, 0);
          const thisMonth = items.filter(isThisMonth).reduce((sum, item) => sum + item.left, 0);

          return {
            tenant: lease.tenant.user.name,
            building: lease.flat.floor.building.name,
            flat: formatFlatNumber(lease.flat.flatNumber),
            total,
            thisMonth,
            items,
          };
        })
        .filter((tenant) => tenant.total > 0)
        .sort((a, b) => b.total - a.total);

      // Split per tenant so "who hasn't paid this month?" and "who is
      // behind?" are easy to answer correctly.
      return {
        thisMonth: monthLabel(now.getUTCMonth() + 1, now.getUTCFullYear()),
        tenantsWhoOwe: tenants.length,
        totalOwed: formatMoney(tenants.reduce((sum, tenant) => sum + tenant.total, 0)),
        tenants: tenants.map((tenant) => ({
          tenant: tenant.tenant,
          building: tenant.building,
          flat: tenant.flat,
          owesInTotal: formatMoney(tenant.total),
          unpaidThisMonth: formatMoney(tenant.thisMonth),
          overdueFromEarlierMonths: formatMoney(tenant.total - tenant.thisMonth),
          unpaid: tenant.items.map((item) => ({
            what: item.what,
            left: formatMoney(item.left),
            status: item.status,
          })),
        })),
      };
    },
  }),

  defineTool({
    name: "find_tenant",
    description:
      "Look up current and former tenants by name (or part of it): building, flat, rent, lease dates, deposit and what they owe.",
    args: z.object({ name: z.string().min(1).describe("Tenant name or part of it") }),
    async run({ name }, { ownerId }) {
      await reconcileRentForOwner(ownerId);

      const leases = await prisma.lease.findMany({
        where: {
          flat: { floor: { building: { ownerId } } },
          tenant: { user: { name: { contains: name.trim(), mode: "insensitive" } } },
        },
        orderBy: { startDate: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          monthlyRent: true,
          deposit: true,
          tenant: { select: { occupation: true, user: { select: { name: true } } } },
          flat: {
            select: {
              flatNumber: true,
              floor: { select: { floorNumber: true, name: true, building: { select: { name: true } } } },
            },
          },
        },
      });

      if (leases.length === 0) return { found: 0, note: `No tenant matching "${name}".` };

      const owed = await getOutstandingByLease(leases.map((lease) => lease.id));

      return {
        found: leases.length,
        tenants: leases.map((lease) => ({
          tenant: lease.tenant.user.name,
          occupation: lease.tenant.occupation ?? undefined,
          status:
            lease.status === "ACTIVE"
              ? "current tenant"
              : `moved out${lease.endDate ? ` on ${formatDate(lease.endDate)}` : ""}`,
          building: lease.flat.floor.building.name,
          floor: formatFloor(lease.flat.floor),
          flat: formatFlatNumber(lease.flat.flatNumber),
          rent: `${formatMoney(Number(lease.monthlyRent))}/month`,
          leaseSince: formatDate(lease.startDate),
          deposit: lease.deposit ? formatMoney(Number(lease.deposit)) : "none",
          owes: formatMoney(owed.get(lease.id) ?? 0),
        })),
      };
    },
  }),

  defineTool({
    name: "get_flat",
    description:
      "Details of one flat: status, size, rent, current tenant, the last months of rent and bills (paid or not), what is owed, and pending requests for it.",
    args: z.object({
      flat: z.string().min(1).describe('Flat number, e.g. "203"'),
      building: z
        .string()
        .optional()
        .describe("Building name; needed when several buildings have this flat number"),
    }),
    async run({ flat: flatNumber, building }, { ownerId }) {
      const scope = await resolveBuildings(ownerId, building);
      if ("error" in scope) return scope;

      const number = flatNumber.trim().replace(/^flat\s*/i, "");

      const flats = await prisma.flat.findMany({
        where: {
          deletedAt: null,
          flatNumber: { equals: number, mode: "insensitive" },
          floor: { deletedAt: null, buildingId: { in: scope.ids } },
        },
        select: {
          id: true,
          flatNumber: true,
          bedrooms: true,
          bathrooms: true,
          monthlyRent: true,
          status: true,
          floor: { select: { floorNumber: true, name: true, building: { select: { name: true } } } },
        },
      });

      if (flats.length === 0) {
        return { error: `No flat ${number}${building ? ` in ${building}` : ""}.` };
      }

      if (flats.length > 1) {
        return {
          error: `Flat ${number} exists in several buildings: ${flats.map((flat) => flat.floor.building.name).join(", ")}. Ask which one.`,
        };
      }

      const flat = flats[0];

      await reconcileRentForOwner(ownerId);

      const [lease, pendingRequests] = await Promise.all([
        prisma.lease.findFirst({
          where: { flatId: flat.id, status: "ACTIVE" },
          select: {
            id: true,
            startDate: true,
            monthlyRent: true,
            deposit: true,
            tenant: { select: { occupation: true, user: { select: { name: true } } } },
            rents: {
              orderBy: [{ year: "desc" }, { month: "desc" }],
              take: 6,
              select: { month: true, year: true, amount: true, status: true, payments: { select: { amount: true } } },
            },
            utilityBills: {
              orderBy: [{ year: "desc" }, { month: "desc" }],
              take: 4,
              select: {
                type: true,
                month: true,
                year: true,
                amount: true,
                dueDate: true,
                writtenOffAt: true,
                payments: { select: { amount: true } },
              },
            },
          },
        }),
        prisma.joinRequest.findMany({
          where: { flatId: flat.id, status: "PENDING" },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, message: true, tenant: { select: { user: { select: { name: true } } } } },
        }),
      ]);

      const owed = lease ? (await getOutstandingByLease([lease.id])).get(lease.id) ?? 0 : 0;
      const now = new Date();

      return {
        building: flat.floor.building.name,
        floor: formatFloor(flat.floor),
        flat: formatFlatNumber(flat.flatNumber),
        status: flat.status.toLowerCase(),
        size: `${flat.bedrooms} bed, ${flat.bathrooms} bath`,
        listedRent: `${formatMoney(Number(flat.monthlyRent))}/month`,
        tenant: lease
          ? {
              name: lease.tenant.user.name,
              occupation: lease.tenant.occupation ?? undefined,
              since: formatDate(lease.startDate),
              rent: `${formatMoney(Number(lease.monthlyRent))}/month`,
              deposit: lease.deposit ? formatMoney(Number(lease.deposit)) : "none",
            }
          : null,
        owes: formatMoney(owed),
        recentRent: (lease?.rents ?? []).map((rent) => ({
          month: monthLabel(rent.month, rent.year),
          amount: formatMoney(Number(rent.amount)),
          paid: formatMoney(sumPayments(rent.payments)),
          status: STATUS_WORDS[rent.status],
        })),
        recentBills: (lease?.utilityBills ?? []).map((bill) => describeBill(bill, now)),
        pendingRequests: pendingRequests.map((request) => ({
          from: request.tenant.user.name,
          sent: formatDate(request.createdAt),
          message: clip(request.message),
        })),
      };
    },
  }),

  defineTool({
    name: "list_flats",
    description:
      "Flats with their status (vacant, occupied or under maintenance), size, rent and current tenant. Optionally only one building and/or one status.",
    args: z.object({
      building: buildingArg,
      status: z.enum(["vacant", "occupied", "maintenance"]).optional(),
    }),
    async run({ building, status }, { ownerId }) {
      const scope = await resolveBuildings(ownerId, building);
      if ("error" in scope) return scope;

      const flats = await prisma.flat.findMany({
        where: {
          deletedAt: null,
          floor: { deletedAt: null, buildingId: { in: scope.ids } },
          ...(status ? { status: status.toUpperCase() as FlatStatus } : {}),
        },
        take: 300,
        select: {
          flatNumber: true,
          status: true,
          monthlyRent: true,
          bedrooms: true,
          bathrooms: true,
          floor: { select: { floorNumber: true, name: true, building: { select: { name: true } } } },
          leases: {
            where: { status: "ACTIVE" },
            take: 1,
            select: { monthlyRent: true, tenant: { select: { user: { select: { name: true } } } } },
          },
        },
      });

      flats.sort(
        (a, b) =>
          a.floor.building.name.localeCompare(b.floor.building.name) ||
          compareFlatNumbers(a.flatNumber, b.flatNumber)
      );

      return {
        count: flats.length,
        flats: flats.map((flat) => {
          const lease = flat.leases[0];

          return {
            building: flat.floor.building.name,
            floor: formatFloor(flat.floor),
            flat: formatFlatNumber(flat.flatNumber),
            status: flat.status.toLowerCase(),
            size: `${flat.bedrooms} bed, ${flat.bathrooms} bath`,
            rent: `${formatMoney(Number(lease?.monthlyRent ?? flat.monthlyRent))}/month`,
            tenant: lease?.tenant.user.name,
          };
        }),
      };
    },
  }),

  defineTool({
    name: "list_requests",
    description:
      "Requests from people who want to rent one of the landlord's flats. Pending requests are waiting for the landlord's decision.",
    args: z.object({
      status: z
        .enum(["pending", "approved", "rejected", "ended"])
        .optional()
        .describe("Which requests; default pending"),
      building: buildingArg,
    }),
    async run({ status = "pending", building }, { ownerId }) {
      const scope = await resolveBuildings(ownerId, building);
      if ("error" in scope) return scope;

      const requests = await prisma.joinRequest.findMany({
        where: {
          status: status.toUpperCase() as JoinRequestStatus,
          buildingId: { in: scope.ids },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          createdAt: true,
          message: true,
          tenant: { select: { occupation: true, user: { select: { name: true } } } },
          building: { select: { name: true } },
          flat: { select: { flatNumber: true, monthlyRent: true, floor: { select: { floorNumber: true, name: true } } } },
        },
      });

      return {
        status,
        count: requests.length,
        requests: requests.map((request) => ({
          from: request.tenant.user.name,
          occupation: request.tenant.occupation ?? undefined,
          building: request.building.name,
          floor: formatFloor(request.flat.floor),
          flat: formatFlatNumber(request.flat.flatNumber),
          flatRent: `${formatMoney(Number(request.flat.monthlyRent))}/month`,
          sent: formatDate(request.createdAt),
          message: clip(request.message),
        })),
      };
    },
  }),

  defineTool({
    name: "get_past_dues",
    description:
      "Former tenants (lease ended) who still owe rent or bills, with what is unpaid.",
    args: z.object({}),
    async run() {
      const pastDues = await getPastDues();

      return {
        formerTenantsWhoOwe: pastDues.length,
        totalOwed: formatMoney(pastDues.reduce((sum, lease) => sum + lease.total, 0)),
        tenants: pastDues.map((lease) => ({
          tenant: lease.tenantName,
          building: lease.flat.floor.building.name,
          flat: formatFlatNumber(lease.flat.flatNumber),
          livedThere: `${formatDate(lease.startDate)} – ${lease.endDate ? formatDate(lease.endDate) : "?"}`,
          owes: formatMoney(lease.total),
          unpaid: lease.rows.map((row) => ({
            what: row.label,
            left: formatMoney(row.amount - row.paidTotal),
            status: STATUS_WORDS[row.status],
          })),
        })),
      };
    },
  }),

  defineTool({
    name: "list_notices",
    description: "The latest notices posted to the landlord's buildings.",
    args: z.object({ building: buildingArg }),
    async run({ building }, { ownerId }) {
      const scope = await resolveBuildings(ownerId, building);
      if ("error" in scope) return scope;

      const notices = await prisma.notice.findMany({
        where: { buildingId: { in: scope.ids } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          title: true,
          content: true,
          audience: true,
          createdAt: true,
          expiresAt: true,
          building: { select: { name: true } },
        },
      });

      const now = new Date();

      return {
        count: notices.length,
        notices: notices.map((notice) => ({
          title: notice.title,
          building: notice.building.name,
          visibleTo: AUDIENCE_WORDS[notice.audience],
          posted: formatDate(notice.createdAt),
          expires: notice.expiresAt
            ? `${notice.expiresAt < now ? "expired" : "until"} ${formatDate(notice.expiresAt)}`
            : undefined,
          text: clip(notice.content, 300),
        })),
      };
    },
  }),

  defineTool({
    name: "get_recent_activity",
    description:
      "The latest things that happened in the landlord's buildings and account (payments, approvals, notices, changes), newest first.",
    args: z.object({
      limit: z.number().int().min(1).max(30).optional().describe("How many entries; default 15"),
    }),
    async run({ limit = 15 }, { ownerId }) {
      const logs = await prisma.activityLog.findMany({
        where: { OR: [{ userId: ownerId }, { building: { ownerId } }] },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          action: true,
          description: true,
          createdAt: true,
          user: { select: { name: true } },
          building: { select: { name: true } },
        },
      });

      return {
        entries: logs.map((log) => ({
          when: `${formatDate(log.createdAt)}, ${formatTime(log.createdAt)}`,
          what: log.description ?? log.action.toLowerCase(),
          by: log.user.name,
          building: log.building?.name,
        })),
      };
    },
  }),
];
