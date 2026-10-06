import { describe, expect, it } from "vitest";

import { computePaymentStatus, remainingBalance, sumPayments } from "./payment-status";

const due = new Date("2026-09-01T00:00:00Z");
const before = new Date("2026-08-20T00:00:00Z");
const after = new Date("2026-09-15T00:00:00Z");

describe("computePaymentStatus", () => {
  it("is paid once payments cover the amount", () => {
    expect(computePaymentStatus({ amount: 1650, paidTotal: 1650, dueDate: due, now: after })).toBe("PAID");
  });

  it("is written off when the landlord gave up on it", () => {
    expect(
      computePaymentStatus({ amount: 1650, paidTotal: 0, dueDate: due, now: after, writtenOffAt: after })
    ).toBe("WRITTEN_OFF");
  });

  it("is partly paid when something was paid", () => {
    expect(computePaymentStatus({ amount: 1650, paidTotal: 500, dueDate: due, now: after })).toBe("PARTIAL");
  });

  it("is overdue after the due date, due before it", () => {
    expect(computePaymentStatus({ amount: 1650, paidTotal: 0, dueDate: due, now: after })).toBe("OVERDUE");
    expect(computePaymentStatus({ amount: 1650, paidTotal: 0, dueDate: due, now: before })).toBe("PENDING");
  });
});

describe("balances", () => {
  it("adds up payments, whatever numeric type the database returns", () => {
    expect(sumPayments([{ amount: 5000 }, { amount: "2500.50" }, { amount: { toString: () => "100" } }])).toBe(7600.5);
  });

  it("is what's left to pay", () => {
    expect(remainingBalance({ amount: 25000, payments: [{ amount: 12500 }] })).toBe(12500);
  });

  it("is never negative, even if overpaid", () => {
    expect(remainingBalance({ amount: 1000, payments: [{ amount: 1500 }] })).toBe(0);
  });

  it("is zero once written off", () => {
    expect(remainingBalance({ amount: 25000, payments: [], status: "WRITTEN_OFF" })).toBe(0);
    expect(remainingBalance({ amount: 1650, payments: [], writtenOffAt: new Date() })).toBe(0);
  });
});
