import { describe, expect, it } from "vitest";

import { normalizeFlatNumber, parseMonth, pickByName } from "./tool-kit";

describe("parseMonth", () => {
  it("reads month names, with or without a year", () => {
    expect(parseMonth("October 2026")).toEqual({ month: 10, year: 2026 });
    expect(parseMonth("october")).toEqual({ month: 10, year: undefined });
    expect(parseMonth("Sept 2026")).toEqual({ month: 9, year: 2026 });
    expect(parseMonth("Aug")).toEqual({ month: 8, year: undefined });
  });

  it("reads numeric forms", () => {
    expect(parseMonth("2026-10")).toEqual({ month: 10, year: 2026 });
    expect(parseMonth("10/2026")).toEqual({ month: 10, year: 2026 });
  });

  it("returns null when it can't tell", () => {
    expect(parseMonth("next week")).toBeNull();
    expect(parseMonth("2026-13")).toBeNull();
  });
});

describe("pickByName", () => {
  const tenants = [{ name: "Nasrin Sultana" }, { name: "Taslima Nasrin" }, { name: "Nusrat Jahan" }];
  const nameOf = (tenant: { name: string }) => tenant.name;

  it("matches part of a name, ignoring case", () => {
    expect(pickByName(tenants, "nusrat", nameOf)).toEqual([{ name: "Nusrat Jahan" }]);
  });

  it("returns every partial match when several fit", () => {
    expect(pickByName(tenants, "Nasrin", nameOf)).toHaveLength(2);
  });

  it("prefers an exact match over partial ones", () => {
    expect(pickByName(tenants, "nasrin sultana", nameOf)).toEqual([{ name: "Nasrin Sultana" }]);
  });
});

describe("normalizeFlatNumber", () => {
  it("drops a leading 'flat' or 'flat no.'", () => {
    expect(normalizeFlatNumber("Flat 203")).toBe("203");
    expect(normalizeFlatNumber("flat no. A101")).toBe("A101");
    expect(normalizeFlatNumber(" 402 ")).toBe("402");
  });
});
