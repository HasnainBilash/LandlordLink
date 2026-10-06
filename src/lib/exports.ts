import { compareFlatNumbers, formatFlatNumber, formatFloor, toDateInputValue } from "@/lib/format";
import { DAY_MS, monthIndex, paidTowards } from "@/lib/insights";
import { prisma } from "@/lib/prisma";
import { reconcileRentForOwner } from "@/lib/reconcile-rent";
import { MONTH_NAMES } from "@/lib/rent";
import { UTILITY_TYPE_LABELS } from "@/lib/utility-bill";

// CSV downloads from Reports (for a spreadsheet or an accountant). Every
// function takes the signed-in landlord's own ID.

type Cell = string | number | null;

// Values are quoted when needed. Text that a spreadsheet would run as a
// formula (starting with =, +, -, @) gets a leading ' so it stays text —
// names and references are typed in by users. The byte-order mark makes
// Excel read the file as UTF-8 (৳, Bangla names).
export function toCsv(header: string[], rows: Cell[][]) {
  const cell = (value: Cell) => {
    if (value === null) return "";
    if (typeof value === "number") return String(value);

    const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return `﻿${[header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n")}\r\n`;
}

// Money as a plain number, which spreadsheets can add up.
const amount = (value: unknown) => Math.round(Number(value) * 100) / 100;

const UNPAID_RENT = ["PENDING", "OVERDUE", "PARTIAL"] as const;

function chargeLabel(charge: { month: number; year: number; type?: keyof typeof UTILITY_TYPE_LABELS }) {
  const what = charge.type ? UTILITY_TYPE_LABELS[charge.type] : "Rent";
  return `${what} — ${MONTH_NAMES[charge.month - 1]} ${charge.year}`;
}

const leaseSelect = {
  tenant: { select: { user: { select: { name: true } } } },
  flat: {
    select: {
      flatNumber: true,
      floor: { select: { name: true, floorNumber: true, building: { select: { name: true } } } },
    },
  },
} as const;

// Current tenants: where they live, their rent and what they owe.
export async function rentRollCsv(ownerId: string, now = new Date()) {
  await reconcileRentForOwner(ownerId);

  const leases = await prisma.lease.findMany({
    where: { status: "ACTIVE", flat: { floor: { building: { ownerId } } } },
    select: {
      ...leaseSelect,
      startDate: true,
      monthlyRent: true,
      deposit: true,
      rents: {
        where: { status: { in: [...UNPAID_RENT] } },
        select: { amount: true, dueDate: true, payments: { select: { amount: true, paidAt: true } } },
      },
      utilityBills: {
        where: { writtenOffAt: null },
        select: { amount: true, dueDate: true, payments: { select: { amount: true, paidAt: true } } },
      },
    },
  });

  const rows = leases
    .sort(
      (a, b) =>
        a.flat.floor.building.name.localeCompare(b.flat.floor.building.name) ||
        a.flat.floor.floorNumber - b.flat.floor.floorNumber ||
        compareFlatNumbers(a.flat.flatNumber, b.flat.flatNumber)
    )
    .map((lease) => {
      let owes = 0;
      let overdue = 0;

      for (const item of [...lease.rents, ...lease.utilityBills]) {
        const remaining = Number(item.amount) - paidTowards(item.amount, item.payments);
        if (remaining <= 0) continue;

        owes += remaining;
        if (monthIndex(item.dueDate) < monthIndex(now)) overdue += remaining;
      }

      return [
        lease.flat.floor.building.name,
        formatFloor(lease.flat.floor),
        formatFlatNumber(lease.flat.flatNumber),
        lease.tenant.user.name,
        toDateInputValue(lease.startDate),
        amount(lease.monthlyRent),
        lease.deposit === null ? null : amount(lease.deposit),
        amount(owes),
        amount(overdue),
      ];
    });

  return toCsv(
    ["Building", "Floor", "Flat", "Tenant", "Moved in", "Monthly rent", "Deposit", "Owes now", "Of which overdue"],
    rows
  );
}

// Every payment received in the last 12 months, newest first.
export async function paymentsCsv(ownerId: string, now = new Date()) {
  const ownLease = { lease: { flat: { floor: { building: { ownerId } } } } };

  const payments = await prisma.paymentHistory.findMany({
    where: {
      paidAt: { gte: new Date(now.getTime() - 365 * DAY_MS), lte: now },
      OR: [{ rent: ownLease }, { utilityBill: ownLease }],
    },
    orderBy: { paidAt: "desc" },
    select: {
      paidAt: true,
      amount: true,
      transactionRef: true,
      rent: { select: { month: true, year: true, lease: { select: leaseSelect } } },
      utilityBill: { select: { type: true, month: true, year: true, lease: { select: leaseSelect } } },
    },
  });

  const rows = payments.flatMap((payment) => {
    const charge = payment.rent ?? payment.utilityBill;
    if (!charge) return [];

    return [
      [
        toDateInputValue(payment.paidAt),
        charge.lease.flat.floor.building.name,
        formatFlatNumber(charge.lease.flat.flatNumber),
        charge.lease.tenant.user.name,
        chargeLabel(charge),
        amount(payment.amount),
        payment.transactionRef,
      ],
    ];
  });

  return toCsv(["Date", "Building", "Flat", "Tenant", "For", "Amount", "Reference"], rows);
}

// Each unpaid rent and bill, current and former tenants, oldest first.
export async function owedCsv(ownerId: string, now = new Date()) {
  await reconcileRentForOwner(ownerId);

  const leases = await prisma.lease.findMany({
    where: { flat: { floor: { building: { ownerId } } } },
    select: {
      ...leaseSelect,
      status: true,
      rents: {
        where: { status: { in: [...UNPAID_RENT] } },
        select: { month: true, year: true, amount: true, dueDate: true, payments: { select: { amount: true, paidAt: true } } },
      },
      utilityBills: {
        where: { writtenOffAt: null },
        select: {
          type: true,
          month: true,
          year: true,
          amount: true,
          dueDate: true,
          payments: { select: { amount: true, paidAt: true } },
        },
      },
    },
  });

  const items = leases.flatMap((lease) =>
    [...lease.rents, ...lease.utilityBills].flatMap((charge) => {
      const paid = paidTowards(charge.amount, charge.payments);
      const owed = Number(charge.amount) - paid;
      if (owed <= 0) return [];

      return [{ lease, charge, paid, owed }];
    })
  );

  const rows = items
    .sort((a, b) => a.charge.dueDate.getTime() - b.charge.dueDate.getTime())
    .map(({ lease, charge, paid, owed }) => [
      lease.flat.floor.building.name,
      formatFlatNumber(lease.flat.flatNumber),
      lease.tenant.user.name,
      lease.status === "ACTIVE" ? "Current" : "Former",
      chargeLabel(charge),
      toDateInputValue(charge.dueDate),
      amount(charge.amount),
      amount(paid),
      amount(owed),
      Math.max(0, monthIndex(now) - monthIndex(charge.dueDate)),
    ]);

  return toCsv(
    ["Building", "Flat", "Tenant", "Tenant is", "For", "Due", "Amount", "Paid", "Owed", "Months overdue"],
    rows
  );
}

export const EXPORTS = {
  "rent-roll": rentRollCsv,
  payments: paymentsCsv,
  owed: owedCsv,
} as const;

export type ExportKind = keyof typeof EXPORTS;
