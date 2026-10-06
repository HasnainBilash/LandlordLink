// End-to-end tests: starts a throwaway database (PGlite, in memory),
// creates the tables, builds and starts the app, runs every suite in
// e2e/suites against it, then shuts everything down.
//
//   npm run test:e2e                     build, then run all suites
//   npm run test:e2e -- --skip-build     reuse the last build
//   npm run test:e2e -- assistant        only suites whose name matches
//
// Needs a browser: npx playwright-core install chromium
// (or set E2E_BROWSER_CHANNEL=msedge / chrome to use one you have).
// Full logs of each suite go to e2e/output/<suite>.log.

import { spawn, spawnSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";
import { connect, createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { outputPath } from "./lib/config.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SUITES_DIR = fileURLToPath(new URL("./suites/", import.meta.url));

const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3100);
const DB_PORT = Number(process.env.E2E_DB_PORT ?? 54329);
const DATABASE = `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres?sslmode=disable&connection_limit=1`;

// The app under test: offline fake AI (no quota used), test-only secrets,
// and limits that leave room for the suites' bursts.
const env = {
  ...process.env,
  NODE_ENV: "production",
  DATABASE_URL: `${DATABASE}&pgbouncer=true`,
  DIRECT_URL: DATABASE,
  AUTH_SECRET: "e2e-auth-secret-not-for-production-0123456789",
  CRON_SECRET: "e2e-cron-secret",
  AI_PROVIDER: "fake",
  ASSISTANT_DAILY_LIMIT: "4",
  ASSISTANT_DEMO_DAILY_LIMIT: "500",
  ASSISTANT_PER_MINUTE_LIMIT: "100",
  E2E_BASE_URL: `http://localhost:${APP_PORT}`,
};

const bin = (relative) => path.join(ROOT, "node_modules", relative);
const BIN = {
  database: bin("@electric-sql/pglite-socket/dist/scripts/server.js"),
  prisma: bin("prisma/build/index.js"),
  next: bin("next/dist/bin/next"),
  tsx: bin("tsx/dist/cli.mjs"),
};

// What each suite expects to find (applied before it runs).
const PREPARE = {
  "01-": ["demo", "tests"],
  "03-": ["tests"],
  "04-": ["tests"],
  "05-": ["tests"],
  "08-": ["tests"],
  "09-": ["tests"],
  "10-": ["tests"],
};

const children = [];

function log(message) {
  console.log(message);
}

// On GitHub Actions a failure also becomes an annotation on the run's page,
// readable there (and through the API) without opening the logs.
function annotate(title, message) {
  if (process.env.GITHUB_ACTIONS !== "true") return;

  const data = (text) => text.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
  const property = (text) => data(text).replace(/:/g, "%3A").replace(/,/g, "%2C");

  console.log(`::error title=${property(title)}::${data(message)}`);
}

function startProcess(args) {
  const child = spawn(process.execPath, args, { cwd: ROOT, env, stdio: "ignore" });
  children.push(child);
  return child;
}

function runStep(label, args) {
  const result = spawnSync(process.execPath, args, { cwd: ROOT, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

  if (result.status !== 0) {
    throw new Error(`${label} failed:\n${result.stdout}\n${result.stderr}`);
  }
}

function stopAll() {
  for (const child of children) {
    if (child.exitCode !== null || child.killed) continue;

    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      child.kill("SIGTERM");
    }
  }
}

function portIsFree(port) {
  return new Promise((resolve) => {
    const server = createServer()
      .once("error", () => resolve(false))
      .once("listening", () => server.close(() => resolve(true)))
      .listen(port);
  });
}

async function waitFor(label, test, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await test()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${label}.`);
}

const portAccepts = (port) =>
  new Promise((resolve) => {
    const socket = connect(port, "127.0.0.1")
      .once("connect", () => socket.end(() => resolve(true)))
      .once("error", () => resolve(false));
  });

const appResponds = () =>
  fetch(env.E2E_BASE_URL).then(
    (response) => response.ok,
    () => false
  );

function seed(kind) {
  const script = kind === "demo" ? "prisma/seed-demo-landlord.ts" : "prisma/seed-test-accounts.ts";
  runStep(`Seeding ${kind} data`, [BIN.tsx, script]);
}

async function main() {
  const args = process.argv.slice(2);
  const skipBuild = args.includes("--skip-build");
  const filters = args.filter((arg) => !arg.startsWith("--"));

  for (const port of [APP_PORT, DB_PORT]) {
    if (!(await portIsFree(port))) {
      throw new Error(`Port ${port} is in use. Stop what runs there, or set E2E_APP_PORT / E2E_DB_PORT.`);
    }
  }

  log("Starting a throwaway database…");
  startProcess([BIN.database, "--db=memory://", `--port=${DB_PORT}`, "--max-connections=10"]);
  await waitFor("the database", () => portAccepts(DB_PORT));

  log("Creating the tables…");
  runStep("prisma migrate deploy", [BIN.prisma, "migrate", "deploy"]);

  if (!skipBuild) {
    log("Building the app (a minute or two)…");
    runStep("next build", [BIN.next, "build"]);
  }

  log("Starting the app…");
  startProcess([BIN.next, "start", "-p", String(APP_PORT)]);
  await waitFor("the app", appResponds);

  const prisma = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
  const suites = readdirSync(SUITES_DIR)
    .filter((file) => file.endsWith(".mjs"))
    .filter((file) => filters.length === 0 || filters.some((filter) => file.includes(filter)))
    .sort();

  log(`\nRunning ${suites.length} suite${suites.length === 1 ? "" : "s"}:\n`);

  // Every run starts from fresh demo and test data.
  seed("demo");
  seed("tests");

  let failed = 0;

  for (const suite of suites) {
    for (const kind of PREPARE[suite.slice(0, 3)] ?? []) {
      if (suite !== suites[0]) seed(kind);
    }

    // Each suite gets fresh rate-limit counters.
    await prisma.$executeRawUnsafe('DELETE FROM "RateLimit"');

    const started = Date.now();
    const result = spawnSync(process.execPath, [path.join(SUITES_DIR, suite)], {
      cwd: ROOT,
      env,
      encoding: "utf8",
      timeout: 15 * 60 * 1000,
      maxBuffer: 64 * 1024 * 1024,
    });

    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    writeFileSync(outputPath(`${suite.replace(".mjs", "")}.log`), output);

    const summary =
      output.match(/\d+\/\d+ passed|No sideways scrolling on \d+ pages|Sideways scrolling found/g)?.pop() ?? "crashed";
    const ok = result.status === 0;
    if (!ok) failed += 1;

    log(`${ok ? "PASS" : "FAIL"}  ${suite.padEnd(24)} ${summary.padEnd(32)} ${Math.round((Date.now() - started) / 1000)}s`);

    if (!ok) {
      const details = output.split("\n").filter((line) => /^FAIL|Error|problems/.test(line)).slice(0, 10);
      for (const line of details) log(`        ${line}`);
      annotate(`e2e ${suite}`, details.join("\n") || summary);
    }
  }

  await prisma.$disconnect();

  log(failed === 0 ? "\nAll suites passed." : `\n${failed} suite${failed === 1 ? "" : "s"} failed — see e2e/output/*.log`);
  return failed === 0;
}

process.on("SIGINT", () => {
  stopAll();
  process.exit(130);
});

main()
  .then((ok) => {
    process.exitCode = ok ? 0 : 1;
  })
  .catch((error) => {
    console.error(`\n${error.message}`);
    annotate("e2e runner", error.message.slice(0, 2000));
    process.exitCode = 1;
  })
  .finally(stopAll);
