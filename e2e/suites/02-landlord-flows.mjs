// Everyday flows in a browser: adding and editing buildings, floors and
// flats, payments, approving a request, notices, write-offs, quick setup, a
// tenant finding a flat by access code, and the phone menu. Expects freshly
// seeded test data.
import { BASE, launchBrowser } from "../lib/config.mjs";

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
    check(name, false, String(error.message ?? error).split("\n")[0]);
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
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("11111111");
  await page.getByRole("button", { name: "Sign In" }).click();
}

const toast = (page, text) => page.locator("[data-sonner-toast]").filter({ hasText: text }).first();

// ---------------------------------------------------------------- landlord
const page = await newPage("landlord");
let towerBCode = "";

await step("login returns to the page you came from", async () => {
  await page.goto(`${BASE}/dashboard/reports`);
  await page.waitForURL(/\/login\?callbackUrl=/);
  await login(page, "landlord@example.com");
  await page.waitForURL(`${BASE}/dashboard/reports`);
});

await step("open Test Tower A from Buildings", async () => {
  await page.goto(`${BASE}/dashboard/buildings`);
  await page.getByRole("link", { name: /Test Tower A/ }).click();
  await page.getByRole("heading", { name: "Test Tower A" }).waitFor();
});
const towerAUrl = page.url();

await step("edit building name via ⋯ menu", async () => {
  await page.getByRole("button", { name: "Building actions" }).click();
  await page.getByRole("menuitem", { name: "Edit building" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Building name").fill("Test Tower A Edited");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await toast(page, "Building saved.").waitFor();
  await page.getByRole("heading", { name: "Test Tower A Edited" }).waitFor();
  await dialog.waitFor({ state: "hidden" });
});

await step("rename it back", async () => {
  await page.getByRole("button", { name: "Building actions" }).click();
  await page.getByRole("menuitem", { name: "Edit building" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Building name").fill("Test Tower A");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("heading", { name: "Test Tower A", exact: true }).waitFor();
});

await step("validation error shows in the form", async () => {
  await page.getByRole("button", { name: "Building actions" }).click();
  await page.getByRole("menuitem", { name: "Edit building" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Address").fill("abc");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await dialog.getByText("Address must be at least 5 characters.").waitFor();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
});

await step("add floor 3", async () => {
  await page.getByRole("button", { name: "Add floor" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Floor number").fill("3");
  await dialog.getByRole("button", { name: "Add floor" }).click();
  await toast(page, "Added Floor 3.").waitFor();
  await page.getByRole("heading", { name: "Floor 3", exact: true }).waitFor();
});

// (Duplicate floor numbers are not exercised here: the local PGlite test
// server drops the connection on unique-constraint errors instead of
// returning them, so that path is only testable against real Postgres.)

const floor3 = page.locator("section").filter({ has: page.getByRole("heading", { name: "Floor 3", exact: true }) });

await step("add flats 301–302 to floor 3", async () => {
  await floor3.getByRole("button", { name: "Add flats" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: "Several flats" }).click();
  await dialog.getByLabel("From flat number").fill("301");
  await dialog.getByLabel("To flat number").fill("302");
  await dialog.getByLabel("Bedrooms").fill("2");
  await dialog.getByLabel("Bathrooms").fill("1");
  await dialog.getByLabel("Rent / month (৳)").fill("15000");
  await dialog.getByRole("button", { name: "Create flats" }).click();
  await toast(page, "Added 2 flats.").waitFor();
  await floor3.getByText("Flat 301").waitFor();
  await floor3.getByText("Flat 302").waitFor();
});

await step("delete floor 3 (no tenants)", async () => {
  await floor3.getByRole("button", { name: "Floor 3 actions" }).click();
  await page.getByRole("menuitem", { name: "Delete floor" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete floor" }).click();
  await toast(page, "Deleted Floor 3.").waitFor();
  await page.getByRole("heading", { name: "Floor 3", exact: true }).waitFor({ state: "detached" });
});

await step("re-create floor 3 after deleting it (number reuse)", async () => {
  await page.getByRole("button", { name: "Add floor" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Floor number").fill("3");
  await dialog.getByRole("button", { name: "Add floor" }).click();
  await toast(page, "Added Floor 3.").waitFor();
});

await step("floor with tenants can't be deleted", async () => {
  const floor1 = page.locator("section").filter({ has: page.getByRole("heading", { name: "Floor 1", exact: true }) });
  await floor1.getByRole("button", { name: "Floor 1 actions" }).click();
  await page.getByRole("menuitem", { name: "Delete floor" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete floor" }).click();
  await toast(page, "This floor still has 2 active leases").waitFor();
  await page.keyboard.press("Escape");
});

await step("record a partial payment on A102", async () => {
  await page.getByRole("link", { name: /Flat A102/ }).click();
  await page.getByRole("heading", { name: /Flat A102/ }).waitFor();
  await page.getByRole("button", { name: "Record payment" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Amount (৳)").fill("5000");
  await dialog.getByRole("button", { name: "Save payment" }).click();
  await toast(page, "Payment of ৳5,000 recorded.").waitFor();
  await dialog.waitFor({ state: "hidden" });
  await page.getByText("৳5,000 paid").waitFor();
});

await step("flat page balance went down by ৳5,000 (৳40,000)", async () => {
  await page.getByText("৳40,000").first().waitFor();
});

await step("approve the pending request for A202", async () => {
  await page.goto(`${towerAUrl}?tab=requests`);
  await page.getByRole("button", { name: "Approve" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Approve & create lease" }).click();
  await toast(page, "Approved. Pending Tenant now has a lease for flat A202.").waitFor();
  await page.getByText("No requests here").waitFor();
});

await step("A202 is now occupied by Pending Tenant", async () => {
  await page.goto(towerAUrl);
  const tile = page.getByRole("link", { name: /Flat A202/ });
  await tile.getByText("Pending Tenant").waitFor();
  await tile.getByText("Occupied").waitFor();
});

await step("post, then delete, a notice", async () => {
  await page.goto(`${towerAUrl}?tab=notices`);
  await page.getByRole("button", { name: "New notice" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill("Lift maintenance on Sunday");
  await dialog.getByLabel("Message").fill("The lift will be off from 9am to 1pm.");
  await dialog.getByRole("button", { name: "Publish notice" }).click();
  await toast(page, "Notice published.").waitFor();
  const item = page.locator("li").filter({ hasText: "Lift maintenance on Sunday" });
  await item.waitFor();
  await item.getByRole("button", { name: "Delete notice" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await toast(page, "Notice deleted.").waitFor();
  await item.waitFor({ state: "detached" });
});

await step("write off the former tenant's balance", async () => {
  await page.goto(`${BASE}/dashboard/reports?tab=past-dues`);
  await page.getByRole("button", { name: "Write off" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Write off" }).click();
  await toast(page, "Wrote off ৳12,000 owed by Ended Tenant.").waitFor();
  await page.getByText("No past dues").waitFor();
});

await step("add a new building → its page opens with an access code", async () => {
  await page.goto(`${BASE}/dashboard/buildings`);
  await page.getByRole("button", { name: "Add building" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Building name").fill("Lakeview Court");
  await dialog.getByLabel("Address").fill("House 7, Road 2, Dhanmondi");
  await dialog.getByLabel("City").fill("Dhaka");
  await dialog.getByRole("button", { name: "Add building" }).click();
  await page.waitForURL(/\/dashboard\/buildings\/[^/?]+$/);
  await page.getByRole("heading", { name: "Lakeview Court" }).waitFor();
  const code = (await page.locator("p.font-mono").first().innerText()).trim();
  if (!/^[A-Z2-9]{8}$/.test(code)) throw new Error(`no access code (${code})`);
});

await step("quick setup on Test Tower B", async () => {
  await page.goto(`${BASE}/dashboard/buildings`);
  await page.getByRole("link", { name: /Test Tower B/ }).click();
  await page.getByRole("heading", { name: "Test Tower B" }).waitFor();
  towerBCode = (await page.locator("p.font-mono").first().innerText()).trim();
  await page.getByRole("button", { name: "Building actions" }).click();
  await page.getByRole("menuitem", { name: "Quick setup" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("From floor").fill("2");
  await dialog.getByLabel("To floor").fill("3");
  await dialog.getByLabel("Flats per floor").fill("2");
  await dialog.getByLabel("Bedrooms").fill("2");
  await dialog.getByLabel("Bathrooms").fill("1");
  await dialog.getByLabel("Rent / month (৳)").fill("12000");
  await dialog.getByRole("button", { name: "Create floors & flats" }).click();
  await toast(page, "Created 2 floors and 4 flats.").waitFor();
  await page.getByText("Flat 301").waitFor();
});

await step("log out from the account menu", async () => {
  await page.getByRole("button", { name: /Test Landlord/ }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await page.waitForURL(/\/login/);
});

// ---------------------------------------------------------------- tenant
const tenant = await newPage("tenant");

await step("new tenant: find Tower B by access code and request B102", async () => {
  await tenant.goto(`${BASE}/login`);
  await login(tenant, "newtenant@example.com");
  await tenant.waitForURL(`${BASE}/tenant`);
  await tenant.getByText("You don't have a flat yet").waitFor();
  await tenant.getByRole("link", { name: "Find a flat" }).first().click();
  await tenant.getByLabel("Access code").fill(towerBCode);
  await tenant.getByRole("button", { name: "Go to building" }).click();
  await tenant.waitForURL(/\/tenant\/buildings\/[a-z0-9]+\/flats\?code=/);
  const card = tenant.locator("article").filter({ hasText: "Flat B102" });
  await card.getByRole("button", { name: "Request" }).click();
  const dialog = tenant.getByRole("dialog");
  const prefilled = await dialog.getByLabel("Building access code").inputValue();
  if (prefilled !== towerBCode) throw new Error(`code not prefilled (${prefilled})`);
  await dialog.getByLabel("Message to the landlord (optional)").fill("Can I move in next month?");
  await dialog.getByRole("button", { name: "Send request" }).click();
  await toast(tenant, "Request sent for flat B102.").waitFor();
  await card.getByText("Requested").waitFor();
});

await step("tenant sees the request under My requests", async () => {
  await tenant.goto(`${BASE}/tenant/requests`);
  await tenant.getByText("Flat B102 · Test Tower B").waitFor();
});

const resident = await newPage("resident");

await step("tenant with a flat sees new notices, and the badge clears", async () => {
  await resident.goto(`${BASE}/login`);
  await login(resident, "paid@example.com");
  await resident.waitForURL(`${BASE}/tenant`);
  await resident.getByText("Water supply off on Friday").waitFor();
  await resident.getByText("New", { exact: true }).first().waitFor();
  // markNoticesViewed + refresh clears the nav badge; "New" stays for this visit.
  await resident.waitForTimeout(2500);
  const badge = await resident.locator("aside nav a[href='/tenant'] span.rounded-full").count();
  if (badge !== 0) throw new Error("nav badge still shown");
});

// ---------------------------------------------------------------- phone
const phone = await newPage("phone", { width: 390, height: 844 });

await step("phone: menu opens and navigates", async () => {
  await phone.goto(`${BASE}/login`);
  await login(phone, "landlord@example.com");
  await phone.waitForURL(`${BASE}/dashboard`);
  await phone.getByRole("button", { name: "Open menu" }).click();
  await phone.getByRole("dialog").getByRole("link", { name: "Buildings" }).click();
  await phone.waitForURL(`${BASE}/dashboard/buildings`);
  await phone.getByRole("dialog").waitFor({ state: "hidden" });
});

await step("phone: no horizontal scrolling on building page", async () => {
  await phone.goto(towerAUrl);
  await phone.getByRole("heading", { name: "Test Tower A" }).waitFor();
  const overflow = await phone.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  if (overflow > 1) throw new Error(`page is ${overflow}px wider than the screen`);
});

await browser.close();

console.log("\nBrowser console problems:");
console.log(consoleProblems.length ? consoleProblems.join("\n") : "  none");

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;

// For e2e/run.mjs: a failed check fails the suite.
if (results.some((result) => !result.ok)) process.exitCode = 1;
