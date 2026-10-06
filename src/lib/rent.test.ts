import { describe, expect, it } from "vitest";

import { getFirstBillableMonth, getMonthsBetween, getRentDueDate } from "./rent";

describe("getMonthsBetween", () => {
  it("includes both the first and the last month", () => {
    expect(getMonthsBetween(new Date("2026-08-03Z"), new Date("2026-10-05Z"))).toEqual([
      { month: 8, year: 2026 },
      { month: 9, year: 2026 },
      { month: 10, year: 2026 },
    ]);
  });

  it("crosses the new year", () => {
    expect(getMonthsBetween(new Date("2026-11-10Z"), new Date("2027-02-01Z"))).toEqual([
      { month: 11, year: 2026 },
      { month: 12, year: 2026 },
      { month: 1, year: 2027 },
      { month: 2, year: 2027 },
    ]);
  });

  it("is empty when the end is before the start", () => {
    expect(getMonthsBetween(new Date("2026-10-01Z"), new Date("2026-09-01Z"))).toEqual([]);
  });
});

describe("getRentDueDate", () => {
  it("is the 1st of the month, UTC", () => {
    expect(getRentDueDate(10, 2026).toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });
});

describe("getFirstBillableMonth", () => {
  it("bills the move-in month when moving in by the 20th", () => {
    expect(getFirstBillableMonth(new Date("2026-10-20Z"))).toEqual({ month: 10, year: 2026 });
  });

  it("makes the move-in month free after the 20th", () => {
    expect(getFirstBillableMonth(new Date("2026-10-21Z"))).toEqual({ month: 11, year: 2026 });
  });

  it("rolls over into the next year", () => {
    expect(getFirstBillableMonth(new Date("2026-12-28Z"))).toEqual({ month: 1, year: 2027 });
  });
});
