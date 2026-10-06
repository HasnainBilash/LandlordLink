// Nightly demo reset: endpoint auth, data restored, sessions survive.
import { BASE, CRON_SECRET, launchBrowser } from "../lib/config.mjs";


const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false });
    console.log(`FAIL  ${name}  -> ${error.message.split("\n").slice(0, 6).join("\n        ")}`);
  }
}

async function callReset(header) {
  const started = Date.now();
  const res = await fetch(`${BASE}/api/cron/reset-demo`, {
    headers: header ? { authorization: header } : {},
  });
  return { status: res.status, body: await res.json().catch(() => null), ms: Date.now() - started };
}

await step("reset: no secret → 401", async () => {
  const r = await callReset(null);
  if (r.status !== 401) throw new Error(`status ${r.status}`);
});

await step("reset: wrong secret → 401", async () => {
  const r = await callReset("Bearer not-the-secret");
  if (r.status !== 401) throw new Error(`status ${r.status}`);
});

await step("reset: secret without Bearer → 401", async () => {
  const r = await callReset(CRON_SECRET);
  if (r.status !== 401) throw new Error(`status ${r.status}`);
});

const problems = [];
const browser = await launchBrowser();

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("404")) problems.push(m.text().slice(0, 200));
  });
  return page;
}

const landlord = await newPage();
const tenant = await newPage();

await step("demo landlord signs in", async () => {
  await landlord.goto(BASE);
  await landlord.getByRole("button", { name: /Try as landlord/ }).first().click();
  await landlord.waitForURL(`${BASE}/dashboard`);
  await landlord.getByRole("heading", { name: /collected in/ }).waitFor();
});

await step("demo tenant signs in", async () => {
  await tenant.goto(BASE);
  await tenant.getByRole("button", { name: /Try as tenant/ }).first().click();
  await tenant.waitForURL(`${BASE}/tenant`);
  await tenant.getByRole("heading", { name: /You owe|all paid up/ }).waitFor();
});

let oldBuildingUrl = "";
await step("visitor renames a demo building", async () => {
  await landlord.goto(`${BASE}/dashboard/buildings`);
  await landlord.getByRole("link", { name: /Green Valley Apartments/ }).click();
  await landlord.getByRole("heading", { name: "Green Valley Apartments" }).waitFor();
  oldBuildingUrl = landlord.url();
  await landlord.getByRole("button", { name: "Building actions" }).click();
  await landlord.getByRole("menuitem", { name: "Edit building" }).click();
  const dialog = landlord.getByRole("dialog");
  await dialog.getByLabel("Building name").fill("Messed Up By A Visitor");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await landlord.getByRole("heading", { name: "Messed Up By A Visitor" }).waitFor();
});

await step("reset with the secret → 200 and a summary", async () => {
  const r = await callReset(`Bearer ${CRON_SECRET}`);
  if (r.status !== 200) throw new Error(`status ${r.status}`);
  if (!r.body?.ok || r.body.buildings !== 3 || r.body.occupiedFlats !== 26) {
    throw new Error(JSON.stringify(r.body));
  }
  console.log(`      reset took ${r.ms}ms: ${JSON.stringify(r.body)}`);
});

await step("landlord still signed in after reset, rename undone", async () => {
  await landlord.goto(`${BASE}/dashboard/buildings`);
  if (!landlord.url().startsWith(`${BASE}/dashboard`)) throw new Error(`redirected to ${landlord.url()}`);
  await landlord.getByRole("link", { name: /Green Valley Apartments/ }).waitFor();
  const messed = await landlord.getByText("Messed Up By A Visitor").count();
  if (messed) throw new Error("renamed building still there");
});

await step("old building link shows Page not found (no crash)", async () => {
  await landlord.goto(oldBuildingUrl);
  await landlord.getByRole("heading", { name: "Page not found" }).waitFor();
});

await step("landlord home works after reset", async () => {
  await landlord.goto(`${BASE}/dashboard`);
  await landlord.getByRole("heading", { name: /collected in/ }).waitFor();
});

await step("tenant still signed in after reset, home loads", async () => {
  await tenant.goto(`${BASE}/tenant`);
  if (!tenant.url().startsWith(`${BASE}/tenant`)) throw new Error(`redirected to ${tenant.url()}`);
  await tenant.getByRole("heading", { name: /You owe/ }).waitFor();
  await tenant.getByText(/Flat \d+ · Green Valley Apartments/).first().waitFor();
});

await step("tenant notices show as New again after reset", async () => {
  await tenant.getByText("New", { exact: true }).first().waitFor();
});

await browser.close();

const passed = results.filter((r) => r.ok).length;
console.log(problems.length ? `\nBrowser console problems:\n  ${problems.join("\n  ")}` : "\nBrowser console problems:\n  none");
console.log(`\n${passed}/${results.length} passed`);

// For e2e/run.mjs: a failed check or a browser error fails the suite.
if (results.some((result) => !result.ok) || problems.length > 0) process.exitCode = 1;
