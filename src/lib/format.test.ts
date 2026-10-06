import { describe, expect, it } from "vitest";

import {
  compareFlatNumbers,
  formatDate,
  formatFlatNumber,
  formatFloor,
  formatMoney,
  formatTime,
  getInitials,
  pluralize,
  toDateInputValue,
} from "./format";

describe("formatMoney", () => {
  it("uses the taka sign and lakh grouping", () => {
    expect(formatMoney(152000)).toBe("৳1,52,000");
    expect(formatMoney(3014950)).toBe("৳30,14,950");
    expect(formatMoney(500)).toBe("৳500");
  });

  it("shows paisa only when there are some", () => {
    expect(formatMoney(15000.5)).toBe("৳15,000.50");
    expect(formatMoney(15000)).toBe("৳15,000");
  });

  it("accepts numeric strings and Decimal-like values", () => {
    expect(formatMoney("12500")).toBe("৳12,500");
    expect(formatMoney({ toString: () => "26500.00" })).toBe("৳26,500");
  });

  it("puts the minus sign before the taka sign", () => {
    expect(formatMoney(-2500)).toBe("-৳2,500");
  });
});

describe("dates in Bangladesh time", () => {
  // 20:00 UTC on 5 Oct is already 6 Oct (02:00) in Dhaka.
  const lateEvening = new Date("2026-10-05T20:00:00Z");

  it("formatDate uses the Dhaka calendar day", () => {
    expect(formatDate(lateEvening)).toBe("6 Oct 2026");
  });

  it("formatTime uses Dhaka time", () => {
    expect(formatTime(lateEvening)).toBe("2:00 am");
  });

  it("toDateInputValue gives yyyy-mm-dd for date inputs", () => {
    expect(toDateInputValue(lateEvening)).toBe("2026-10-06");
  });
});

describe("floors and flats", () => {
  it("uses a floor's name when it has one", () => {
    expect(formatFloor({ name: "Ground floor", floorNumber: 0 })).toBe("Ground floor");
    expect(formatFloor({ name: null, floorNumber: 3 })).toBe("Floor 3");
  });

  it("labels deleted floors", () => {
    expect(formatFloor({ name: null, floorNumber: -1000004 })).toBe("Removed floor");
  });

  it("hides the tombstone suffix of deleted flat numbers", () => {
    expect(formatFlatNumber("203~a1b2c3d4")).toBe("203");
    expect(formatFlatNumber("A101")).toBe("A101");
  });

  it("sorts flat numbers naturally", () => {
    expect(["10", "2", "A10", "A9"].sort(compareFlatNumbers)).toEqual(["2", "10", "A9", "A10"]);
  });
});

describe("text helpers", () => {
  it("pluralizes", () => {
    expect(pluralize(1, "flat")).toBe("1 flat");
    expect(pluralize(3, "flat")).toBe("3 flats");
    expect(pluralize(2, "person", "people")).toBe("2 people");
  });

  it("makes initials for avatars", () => {
    expect(getInitials("Nusrat Jahan")).toBe("NJ");
    expect(getInitials("Abdullah Al Mamun")).toBe("AA");
    expect(getInitials("  ")).toBe("?");
  });
});
