import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright-core";

// Shared settings for the end-to-end suites. e2e/run.mjs starts the app
// and sets these; they can also be set by hand to run one suite against a
// server you started yourself.

export const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";

export const CRON_SECRET = process.env.CRON_SECRET ?? "e2e-cron-secret";

// Screenshots go to e2e/output (git-ignored).
const OUTPUT = new URL("../output/", import.meta.url);
mkdirSync(OUTPUT, { recursive: true });

export function outputPath(name) {
  return fileURLToPath(new URL(name, OUTPUT));
}

// Playwright's Chromium by default (npx playwright-core install chromium).
// Set E2E_BROWSER_CHANNEL=msedge or chrome to use an installed browser.
export function launchBrowser() {
  return chromium.launch({
    channel: process.env.E2E_BROWSER_CHANNEL || undefined,
    headless: true,
  });
}
