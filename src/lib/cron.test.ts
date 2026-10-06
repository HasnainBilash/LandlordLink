import { afterEach, describe, expect, it, vi } from "vitest";

import { isCronRequest } from "./cron";

function request(authorization?: string) {
  return new Request("https://example.com/api/cron/cleanup", {
    headers: authorization ? { authorization } : {},
  });
}

describe("isCronRequest", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts the exact bearer secret", () => {
    vi.stubEnv("CRON_SECRET", "s3cret-value");
    expect(isCronRequest(request("Bearer s3cret-value"))).toBe(true);
  });

  it("rejects a wrong or missing secret", () => {
    vi.stubEnv("CRON_SECRET", "s3cret-value");
    expect(isCronRequest(request("Bearer wrong"))).toBe(false);
    expect(isCronRequest(request("s3cret-value"))).toBe(false);
    expect(isCronRequest(request())).toBe(false);
  });

  it("rejects everything when no secret is configured", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(isCronRequest(request("Bearer "))).toBe(false);
  });
});
