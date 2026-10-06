import { afterEach, describe, expect, it, vi } from "vitest";

import { checkEnv } from "./env";

describe("checkEnv", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("passes with the required settings", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@host/db");
    vi.stubEnv("AUTH_SECRET", "x".repeat(44));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(() => checkEnv()).not.toThrow();
  });

  it("names the missing setting", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@host/db");
    vi.stubEnv("AUTH_SECRET", undefined);

    expect(() => checkEnv()).toThrow(/AUTH_SECRET/);
  });

  it("rejects a database URL that isn't Postgres", () => {
    vi.stubEnv("DATABASE_URL", "mysql://user:pass@host/db");
    vi.stubEnv("AUTH_SECRET", "x".repeat(44));

    expect(() => checkEnv()).toThrow(/DATABASE_URL/);
  });

  it("only allows the fake AI provider", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@host/db");
    vi.stubEnv("AUTH_SECRET", "x".repeat(44));
    vi.stubEnv("AI_PROVIDER", "openai");

    expect(() => checkEnv()).toThrow(/AI_PROVIDER/);
  });
});
