import { describe, expect, it } from "vitest";

import {
  addDays,
  ageOwed,
  agingBucket,
  buildingOnDay,
  daysBefore,
  dhakaDay,
  dhakaDayStart,
  collectionByMonth,
  collectionRate,
  emptySince,
  forecastRent,
  monthIndex,
  monthName,
  paidOffAt,
  paidTowards,
  punctuality,
  reletGaps,
  rentForDays,
  vacantDays,
} from "./insights";

const utc = (text: string) => new Date(`${text}T00:00:00Z`);
const now = new Date("2026-10-06T08:00:00Z");

// Rent for a month (due on the 1st), paid in the given payments.
function rent(month: string, amount: number, payments: [string, number][] = []) {
  return {
    amount,
    dueDate: utc(`${month}-01`),
    payments: payments.map(([date, paid]) => ({ amount: paid, paidAt: utc(date) })),
  };
}

describe("months", () => {
  it("subtract across a year end", () => {
    expect(monthIndex(utc("2027-01-01")) - monthIndex(utc("2026-12-31"))).toBe(1);
  });

  it("have names", () => {
    expect(monthName(monthIndex(utc("2026-09-15")))).toBe("September 2026");
  });
});

describe("payments", () => {
  it("are paid off when they first cover the amount", () => {
    const payments = [
      { amount: 5000, paidAt: utc("2026-09-12") },
      { amount: 5000, paidAt: utc("2026-09-03") },
      { amount: "2000.50", paidAt: utc("2026-09-20") },
    ];
    expect(paidOffAt(10000, payments)).toEqual(utc("2026-09-12"));
    expect(paidOffAt(12000.5, payments)).toEqual(utc("2026-09-20"));
    expect(paidOffAt(12001, payments)).toBeNull();
  });

  it("count no more than the amount", () => {
    expect(paidTowards(1000, [{ amount: 1500, paidAt: now }])).toBe(1000);
    expect(paidTowards("0.3", [{ amount: 0.1, paidAt: now }, { amount: 0.2, paidAt: now }])).toBe(0.3);
  });
});

describe("aging", () => {
  it("puts this month's rent in 'due this month', older rent by months overdue", () => {
    expect(agingBucket(utc("2026-10-01"), now)).toBe(0);
    expect(agingBucket(utc("2026-11-01"), now)).toBe(0);
    expect(agingBucket(utc("2026-09-01"), now)).toBe(1);
    expect(agingBucket(utc("2026-08-01"), now)).toBe(2);
    expect(agingBucket(utc("2026-07-01"), now)).toBe(3);
    expect(agingBucket(utc("2025-01-01"), now)).toBe(3);
  });

  it("adds up per bucket and per lease, skipping what's paid", () => {
    const aging = ageOwed(
      [
        { key: "a", remaining: 18000, dueDate: utc("2026-10-01") },
        { key: "a", remaining: 9000, dueDate: utc("2026-08-01") },
        { key: "b", remaining: 1500, dueDate: utc("2026-09-05") },
        { key: "b", remaining: 0, dueDate: utc("2026-01-01") },
      ],
      now
    );

    expect(aging.totals).toEqual([18000, 1500, 9000, 0]);
    expect(aging.total).toBe(28500);
    expect(aging.byKey.get("a")).toEqual({ buckets: [18000, 0, 9000, 0], total: 27000, oldestDue: utc("2026-08-01") });
    expect(aging.byKey.get("b")?.oldestDue).toEqual(utc("2026-09-05"));
  });
});

describe("punctuality", () => {
  it("counts months paid in full before they ended, and the usual pay day", () => {
    const result = punctuality(
      [
        rent("2026-06", 10000, [["2026-06-03", 10000]]),
        rent("2026-07", 10000, [["2026-07-02", 4000], ["2026-07-05", 6000]]),
        rent("2026-08", 10000, [["2026-09-04", 10000]]), // paid the next month
        rent("2026-09", 10000, [["2026-09-07", 10000]]),
        rent("2026-10", 10000), // this month: not over yet, not counted
      ],
      now
    );

    expect(result).toEqual({ months: 4, onTime: 3, typicalPayDay: 6, rating: "sometimes-late" });
  });

  it("rates reliable, often late, and new tenants", () => {
    const onTime = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09"].map((month) =>
      rent(month, 5000, [[`${month}-04`, 5000]])
    );
    expect(punctuality(onTime, now).rating).toBe("reliable");

    const unpaid = ["2026-07", "2026-08", "2026-09"].map((month) => rent(month, 5000));
    expect(punctuality(unpaid, now)).toEqual({ months: 3, onTime: 0, typicalPayDay: null, rating: "often-late" });

    expect(punctuality(onTime.slice(-2), now).rating).toBe("new");
  });

  it("only looks back the given number of months", () => {
    const old = rent("2025-06", 5000);
    expect(punctuality([old], now).months).toBe(0);
  });
});

describe("collection by month", () => {
  it("shows due and paid per rent month, this month last", () => {
    const rows = collectionByMonth(
      [
        rent("2026-09", 10000, [["2026-10-02", 10000]]),
        rent("2026-09", 8000, [["2026-09-03", 4000]]),
        rent("2026-10", 10000, [["2026-10-03", 12000]]), // overpaid: counts as 10,000
        rent("2026-01", 10000), // outside the 3 months
      ],
      now,
      3
    );

    expect(rows).toEqual([
      { label: "August 2026", due: 0, collected: 0, rate: null, isCurrent: false },
      { label: "September 2026", due: 18000, collected: 14000, rate: 14000 / 18000, isCurrent: false },
      { label: "October 2026", due: 10000, collected: 10000, rate: 1, isCurrent: true },
    ]);
  });
});

describe("vacancy", () => {
  const flat = {
    createdAt: utc("2026-01-01"),
    leases: [
      { startDate: utc("2026-02-01"), endDate: utc("2026-05-01") },
      { startDate: utc("2026-06-01"), endDate: null },
    ],
  };

  it("counts days with no lease since the flat was added", () => {
    // Jan (31) + May (31) empty; leases cover the rest up to 1 October.
    expect(vacantDays(flat, utc("2025-10-01"), utc("2026-10-01"))).toBe(62);
  });

  it("handles overlapping leases and windows that start mid-lease", () => {
    const overlapping = {
      createdAt: utc("2026-01-01"),
      leases: [
        { startDate: utc("2026-01-01"), endDate: utc("2026-03-01") },
        { startDate: utc("2026-02-01"), endDate: utc("2026-04-01") },
      ],
    };
    expect(vacantDays(overlapping, utc("2026-02-15"), utc("2026-04-11"))).toBe(10);
  });

  it("knows when an empty flat became empty", () => {
    const empty = { createdAt: utc("2026-01-01"), leases: [{ startDate: utc("2026-02-01"), endDate: utc("2026-08-28") }] };
    expect(emptySince(empty)).toEqual(utc("2026-08-28"));
    expect(emptySince({ createdAt: utc("2026-03-01"), leases: [] })).toEqual(utc("2026-03-01"));
  });

  it("measures the gap between tenants", () => {
    expect(reletGaps([flat], utc("2025-10-06"))).toEqual([31]);
    expect(reletGaps([flat], utc("2026-07-01"))).toEqual([]);
  });

  it("prices empty days at the monthly rent", () => {
    expect(rentForDays(15000, 60)).toBe(30000);
  });
});

describe("Bangladesh days", () => {
  it("start at 18:00 UTC the day before", () => {
    expect(dhakaDay(new Date("2026-10-05T17:59:00Z"))).toBe("2026-10-05");
    expect(dhakaDay(new Date("2026-10-05T18:00:00Z"))).toBe("2026-10-06");
    expect(dhakaDayStart("2026-10-06")).toEqual(new Date("2026-10-05T18:00:00Z"));
  });

  it("count back across month ends", () => {
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30");
    expect(daysBefore("2026-10-02", 3)).toEqual(["2026-09-29", "2026-09-30", "2026-10-01"]);
  });
});

describe("a building on a given day", () => {
  const history = {
    flats: [
      { id: "f1", createdAt: utc("2026-01-01"), deletedAt: null },
      { id: "f2", createdAt: utc("2026-01-01"), deletedAt: null },
      { id: "f3", createdAt: utc("2026-09-20"), deletedAt: null }, // added later
      { id: "f4", createdAt: utc("2026-01-01"), deletedAt: utc("2026-03-01") }, // deleted
    ],
    leases: [
      { flatId: "f1", startDate: utc("2026-02-01"), endDate: null },
      { flatId: "f2", startDate: utc("2026-02-01"), endDate: utc("2026-09-30") }, // moved out
    ],
    charges: [
      rent("2026-09", 10000, [["2026-09-05", 10000]]), // paid
      { ...rent("2026-10", 10000, [["2026-10-06", 4000]]), writtenOffAt: null }, // partly paid on the 6th
      { ...rent("2026-08", 8000), writtenOffAt: utc("2026-10-03") }, // written off on the 3rd
      { amount: 1500, dueDate: utc("2026-10-15"), writtenOffAt: null, payments: [] }, // bill not due yet
    ].map((charge) => ({ writtenOffAt: null, ...charge })),
  };

  it("counts flats, occupied flats, what's owed and what came in", () => {
    // 5 October: October's rent is due; August's was written off on the 3rd.
    expect(buildingOnDay(history, utc("2026-10-05"), utc("2026-10-06"))).toEqual({
      flats: 3,
      occupied: 1,
      owed: 10000,
      collected: 0,
    });

    // 6 October: ৳4,000 paid that day.
    expect(buildingOnDay(history, utc("2026-10-06"), utc("2026-10-07"))).toEqual({
      flats: 3,
      occupied: 1,
      owed: 6000,
      collected: 4000,
    });
  });

  it("knows the past", () => {
    // 1 September: f3 not added yet, f2 still let; August rent due and unpaid.
    expect(buildingOnDay(history, utc("2026-09-01"), utc("2026-09-02"))).toEqual({
      flats: 2,
      occupied: 2,
      owed: 18000,
      collected: 0,
    });
  });
});

describe("collection rate", () => {
  it("weighs months by how much rent was due", () => {
    const month = (due: number, collected: number) => ({ label: "", due, collected, rate: null, isCurrent: false });
    expect(collectionRate([month(90000, 90000), month(10000, 0)])).toBe(0.9);
    expect(collectionRate([month(0, 0)])).toBeNull();
  });
});

describe("forecast", () => {
  it("scales current rent by the recent collection rate", () => {
    expect(forecastRent(100000, 0.9)).toEqual({ months: 3, rate: 0.9, perMonth: 90000, total: 270000 });
  });

  it("never expects more than the rent, and assumes full payment without history", () => {
    expect(forecastRent(100000, 1.2).rate).toBe(1);
    expect(forecastRent(50000, null).total).toBe(150000);
  });
});
