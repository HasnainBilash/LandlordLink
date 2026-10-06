import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { ipFromHeaders, waitText } = await import("./rate-limit");

describe("ipFromHeaders", () => {
  it("takes the first address of x-forwarded-for", () => {
    expect(ipFromHeaders(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(ipFromHeaders(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(ipFromHeaders(new Headers())).toBe("unknown");
  });
});

describe("waitText", () => {
  it("rounds up to whole minutes", () => {
    expect(waitText(30)).toBe("a minute");
    expect(waitText(61)).toBe("2 minutes");
    expect(waitText(15 * 60)).toBe("15 minutes");
  });
});
