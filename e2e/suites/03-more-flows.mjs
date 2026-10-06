// More flows in a browser: deletes that must be blocked, ending a lease that
// still owes rent (→ past dues), late payments, registering and requesting a
// flat right away. Saves a few screenshots. Expects freshly seeded test data.
import { BASE, launchBrowser, outputPath } from "../lib/config.mjs";

const results = [];
const consoleProblems = [];

function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> ${detail}`}`);
}

async function step(name, fn) {
  try {
    await fn();
    check(name, true);
  } catch (error) {
    // Up to 6 lines: Playwright lists the matching elements under the message.
    check(name, false, String(error.message ?? error).split("\n").slice(0, 6).join("\n        "));
  }
}

const browser = await launchBrowser();

async function newPage(label, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      consoleProblems.push(`[${label}] ${msg.type()}: ${msg.text().slice(0, 300)}`);
    }
  });
  page.on("pageerror", (error) => consoleProblems.push(`[${label}] pageerror: ${error.message}`));
  return page;
}

async function login(page, email) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("11111111");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/(dashboard|tenant)/);
}

const toast = (page, text) => page.locator("[data-sonner-toast]").filter({ hasText: text }).first();
const shot = (page, name) => page.screenshot({ path: `${outputPath(`${name}.png`)}`, fullPage: true });

const page = await newPage("landlord");
await login(page, "landlord@example.com");
await shot(page, "01-landlord-home");

await page.goto(`${BASE}/dashboard/buildings`);
await shot(page, "02-buildings");
await page.getByRole("link", { name: /Test Tower A/ }).click();
await page.getByRole("heading", { name: "Test Tower A" }).waitFor();
const towerAUrl = page.url();
await shot(page, "03-building-units");

await step("deleting a flat with a tenant is blocked", async () => {
  await page.getByRole("link", { name: /Flat A101/ }).click();
  await page.getByRole("heading", { name: /Flat A101/ }).waitFor();
  await page.getByRole("button", { name: "Delete flat" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete flat" }).click();
  await toast(page, "Someone is living in this flat").waitFor();
  await page.keyboard.press("Escape");
});

await step("edit flat: status is locked while leased", async () => {
  await page.getByRole("button", { name: "Edit" }).click();
  const dialog = page.getByRole("dialog");
  const disabled = await dialog.getByLabel("Status").isDisabled();
  if (!disabled) throw new Error("status select is editable on a leased flat");
  await page.keyboard.press("Escape");
});

await step("end a lease that still owes rent → shows in past dues", async () => {
  await page.goto(towerAUrl);
  await page.getByRole("link", { name: /Flat A102/ }).click();
  await page.getByRole("heading", { name: /Flat A102/ }).waitFor();
  await shot(page, "04-flat-page");
  await page.getByRole("button", { name: "End lease" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "End lease" }).click();
  await toast(page, "Lease ended. The tenant still owes ৳45,000").waitFor();
  await page.goto(`${BASE}/dashboard/reports?tab=past-dues`);
  await page.getByText("Overdue Tenant").waitFor();
  await page.getByText("Ended Tenant").waitFor();
  await shot(page, "05-past-dues");
});

await step("record a late payment from a former tenant", async () => {
  const card = page.locator("div[data-slot='card']").filter({ hasText: "Ended Tenant" });
  await card.getByRole("button", { name: "Record payment" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Save payment" }).click();
  await toast(page, "Payment of ৳12,000 recorded.").waitFor();
  await card.waitFor({ state: "detached" });
});

await page.goto(`${BASE}/dashboard/reports`);
await shot(page, "06-reports");

await step("delete a building with no tenants", async () => {
  await page.goto(`${BASE}/dashboard/buildings`);
  await page.getByRole("link", { name: /Test Tower B/ }).click();
  await page.getByRole("heading", { name: "Test Tower B" }).waitFor();
  await page.getByRole("button", { name: "Building actions" }).click();
  await page.getByRole("menuitem", { name: "Delete building" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete building" }).click();
  await toast(page, "Deleted Test Tower B.").waitFor();
  await page.waitForURL(`${BASE}/dashboard/buildings`);
  const stillThere = await page.getByRole("link", { name: /Test Tower B/ }).count();
  if (stillThere) throw new Error("Tower B still listed");
});

await step("building with tenants can't be deleted", async () => {
  await page.goto(towerAUrl);
  await page.getByRole("button", { name: "Building actions" }).click();
  await page.getByRole("menuitem", { name: "Delete building" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete building" }).click();
  await toast(page, "This building still has").waitFor();
});

// New tenant signs up and requests without filling a profile first.
const tenant = await newPage("tenant");
let towerACode = "";

await step("read Tower A's access code", async () => {
  await page.goto(towerAUrl);
  towerACode = (await page.locator("p.font-mono").first().innerText()).trim();
  if (!/^[A-Z2-9]{8}$/.test(towerACode)) throw new Error(`bad code ${towerACode}`);
});

await step("register a new tenant and request a flat right away", async () => {
  const email = `brand.new.${Date.now()}@example.com`;

  await tenant.goto(`${BASE}/register`);
  await tenant.getByLabel("Full Name").fill("Brand New Tenant");
  await tenant.getByLabel("Email").fill(email);
  await tenant.getByLabel("Password", { exact: true }).fill("11111111");
  await tenant.getByLabel(/Confirm/).fill("11111111");
  await tenant.getByRole("radio", { name: "Tenant" }).check();
  await tenant.getByRole("button", { name: "Create Account" }).click();
  await tenant.waitForURL(/\/login/);

  await tenant.getByLabel("Email").fill(email);
  await tenant.getByLabel("Password").fill("11111111");
  await tenant.getByRole("button", { name: "Sign In" }).click();
  await tenant.waitForURL(`${BASE}/tenant`);
  await shot(tenant, "07-tenant-home-empty");

  await tenant.goto(`${BASE}/tenant/buildings?code=${towerACode}`);
  await tenant.waitForURL(/\/tenant\/buildings\/[a-z0-9]+\/flats\?code=/);
  await shot(tenant, "08-tenant-building-flats");
  const card = tenant.locator("article").filter({ hasText: "Flat A202" });
  await card.getByRole("button", { name: "Request" }).click();
  await tenant.getByRole("dialog").getByRole("button", { name: "Send request" }).click();
  await toast(tenant, "Request sent for flat A202.").waitFor();
});

const resident = await newPage("resident");

await step("screenshots: tenant home with a flat", async () => {
  await login(resident, "partial@example.com");
  await resident.getByText("Water supply off on Friday").waitFor();
  await shot(resident, "09-tenant-home");
  await resident.getByRole("link", { name: /Flat A201/ }).click();
  await resident.getByRole("heading", { name: /Flat A201/ }).waitFor();
  await shot(resident, "10-tenant-flat");
});

const phone = await newPage("phone", { width: 390, height: 844 });

await step("screenshots: phone", async () => {
  await login(phone, "landlord@example.com");
  await shot(phone, "11-phone-home");
  await phone.goto(towerAUrl);
  await phone.getByRole("heading", { name: "Test Tower A" }).waitFor();
  await shot(phone, "12-phone-building");
  await phone.getByRole("button", { name: "Open menu" }).click();
  await phone.getByRole("dialog").waitFor();
  await phone.screenshot({ path: outputPath("13-phone-menu.png") });
});

await browser.close();

console.log("\nBrowser console problems:");
console.log(consoleProblems.length ? consoleProblems.join("\n") : "  none");

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);

// For e2e/run.mjs: a failed check or a browser error fails the suite.
if (results.some((result) => !result.ok) || consoleProblems.length > 0) process.exitCode = 1;
