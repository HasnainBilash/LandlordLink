import { describe, expect, it, vi } from "vitest";

// toCsv needs no database; the module imports Prisma for the exports.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { toCsv } = await import("./exports");

describe("CSV", () => {
  it("starts with a byte-order mark and ends rows with CRLF", () => {
    expect(toCsv(["Tenant", "Owes"], [["Nusrat Jahan", 12500]])).toBe("﻿Tenant,Owes\r\nNusrat Jahan,12500\r\n");
  });

  it("quotes commas, quotes and line breaks", () => {
    expect(toCsv(["A"], [["House 12, Road 5"], ['Say "hi"'], ["two\nlines"]])).toBe(
      '﻿A\r\n"House 12, Road 5"\r\n"Say ""hi"""\r\n"two\nlines"\r\n'
    );
  });

  it("keeps text that looks like a formula as text", () => {
    expect(toCsv(["A"], [["=HYPERLINK(\"x\")"], ["+880 1700"], ["-5"], ["@sum"]])).toBe(
      "﻿A\r\n\"'=HYPERLINK(\"\"x\"\")\"\r\n'+880 1700\r\n'-5\r\n'@sum\r\n"
    );
  });

  it("leaves numbers (also negative) and empty cells alone", () => {
    expect(toCsv(["A", "B", "C"], [[-1500.5, null, 0]])).toBe("﻿A,B,C\r\n-1500.5,,0\r\n");
  });
});
