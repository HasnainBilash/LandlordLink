// Reports → Insights in a browser, against freshly seeded test data.
// Seeded payments come 4 days after the 1st; flats were added 6 months ago.
// Rent of past months: ৳1,90,000 due, ৳1,51,000 paid (79%). Current leases
// bring in ৳53,000 a month.
import { BASE, launchBrowser } from "../lib/config.mjs";

const results = [];
const problems = [];

function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> ${String(detail).slice(0, 400)}`}`);
}

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
// Same as the seed: the 1st of the month, n months ago (UTC).
const monthStart = (n) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, 1));
const money = (amount) => `৳${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;
const date = (value) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" }).format(value);
const days = (count) => `${count} ${count === 1 ? "day" : "days"}`;
const monthName = (value) =>
  `${new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(value)} ${value.getUTCFullYear()}`;
const squash = (text) => text.replace(/\s+/g, " ").trim();

const browser = await launchBrowser();
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(20000);
page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") problems.push(message.text().slice(0, 200));
});

await page.goto(`${BASE}/login`);
await page.getByLabel("Email").fill("landlord@example.com");
await page.getByLabel("Password").fill("11111111");
await page.getByRole("button", { name: "Sign In" }).click();
await page.waitForURL(`${BASE}/dashboard`);

await page.goto(`${BASE}/dashboard/reports?tab=insights`);
await page.getByText("Who owes, and for how long").waitFor();

const rows = async (testId) =>
  (await page.getByTestId(testId).locator("tbody tr").allInnerTexts()).map(squash);
const main = squash(await page.locator("main").innerText());

// ---- Headline numbers
check("overdue ৳28,500", main.includes("Overdue ৳28,500 Unpaid from past months"), main.slice(0, 300));
check("79% of rent collected", main.includes("Rent collected 79% Of rent due, last 4 months"));
check("expected rent ৳1,26,363 over 3 months", main.includes("Expected rent ৳1,26,363 Next 3 months"));

// Every flat empty since it was added 6 months ago, except while leased.
const flats = [
  { rent: 15000, leases: [[monthStart(4).getTime() + 2 * DAY, now.getTime()]] }, // A101
  { rent: 18000, leases: [[monthStart(3).getTime() + 2 * DAY, now.getTime()]] }, // A102
  { rent: 20000, leases: [[monthStart(2).getTime() + 2 * DAY, now.getTime()]] }, // A201
  { rent: 16000, leases: [] }, // A202
  { rent: 16000, leases: [] }, // A203 (maintenance)
  { rent: 12000, leases: [[monthStart(3).getTime() + 2 * DAY, monthStart(0).getTime()]] }, // B101
  { rent: 12500, leases: [] }, // B102
];
const expectedMissed = flats.reduce((sum, flat) => {
  const occupied = flat.leases.reduce((total, [from, to]) => total + (to - from), 0);
  return sum + (flat.rent * ((now.getTime() - monthStart(6).getTime() - occupied) / DAY)) / 30;
}, 0);
const shownMissed = Number(main.match(/Missed while empty ৳([\d,]+)/)?.[1]?.replace(/,/g, ""));
check(
  "rent missed while flats stood empty",
  Math.abs(shownMissed - expectedMissed) < 5,
  `shown ${shownMissed}, expected about ${Math.round(expectedMissed)}`
);

// ---- Who owes, and for how long
check(
  "owed by age",
  main.includes("Due this month ৳28,000") &&
    main.includes("1 month overdue ৳19,500") &&
    main.includes("2 months overdue ৳9,000") &&
    main.includes("3+ months overdue ৳0")
);
const debtors = await rows("insights-debtors");
check(
  "debtors, oldest debt first",
  debtors[0] === "Overdue Tenant Test Tower A · Flat A102 ৳18,000 ৳18,000 ৳9,000 — ৳45,000" &&
    debtors[1] === "Partial Tenant Test Tower A · Flat A201 ৳10,000 ৳1,500 — — ৳11,500" &&
    debtors.length === 2,
  debtors.join(" | ")
);
check("former tenants' dues", main.includes("Former tenants owe ৳12,000 more — see Past dues"));

// ---- Rent paid by month (chart label)
const chart = await page.getByRole("img", { name: /Share of each month's rent paid/ }).getAttribute("aria-label");
check(
  "rent paid by month",
  chart.includes(`${monthName(monthStart(2))} 86%`) &&
    chart.includes(`${monthName(monthStart(1))} 54%`) &&
    chart.includes(`${monthName(monthStart(0))} 47%`),
  chart
);

// ---- Day-by-day trends (rebuilt by the seed for the last 90 days)
const dayLabel = (day) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const todayInDhaka = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
const yesterdayDate = new Date(`${todayInDhaka}T00:00:00Z`);
yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
const yesterday = yesterdayDate.toISOString().slice(0, 10);
// Yesterday ended at 18:00 UTC; B101's tenant left at the start of this month.
const yesterdayEnd = new Date(`${todayInDhaka}T00:00:00Z`).getTime() - 6 * 60 * 60 * 1000;
const occupiedYesterday = 3 + (monthStart(0).getTime() >= yesterdayEnd ? 1 : 0);

const owedChart = await page.getByRole("img", { name: /^Money owed per day:/ }).getAttribute("aria-label");
const occupancyChart = await page.getByRole("img", { name: /^Occupancy per day:/ }).getAttribute("aria-label");
check("owed trend ends yesterday", owedChart?.includes(` to ${dayLabel(yesterday)} ৳`), owedChart);
check(
  "occupancy trend ends yesterday",
  occupancyChart?.endsWith(` to ${dayLabel(yesterday)} ${Math.round((occupiedYesterday / 7) * 100)}%`),
  occupancyChart
);

// ---- Forecast
check(
  "forecast explains itself",
  main.includes("৳42,121 a month") &&
    main.includes("Your current leases bring in ৳53,000 a month. Over the last 4 months you collected 79% of the rent due") &&
    main.includes("Letting your 3 vacant flats would add up to ৳40,500 a month"),
  main.slice(main.indexOf("The next 3 months"), main.indexOf("The next 3 months") + 400)
);

// ---- Payment habits
const habits = await rows("insights-habits");
check(
  "payment habits, worst first",
  habits[0] === "Overdue Tenant Test Tower A · Flat A102 1 of 3 By the 5th ৳45,000 Often late" &&
    habits[1] === "Partial Tenant Test Tower A · Flat A201 2 of 2 By the 5th ৳11,500 New tenant" &&
    habits[2] === "Paid Tenant Test Tower A · Flat A101 4 of 4 By the 5th — Reliable",
  habits.join(" | ")
);

// ---- Empty flats
const empty = await rows("insights-empty-flats");
const sinceAdded = Math.floor((now.getTime() - monthStart(6).getTime()) / DAY);
const sinceB101 = Math.floor((now.getTime() - monthStart(0).getTime()) / DAY);
check(
  "empty flats with time empty and rent missed",
  empty.length === 4 &&
    empty.includes(`Flat A203 Test Tower A Maintenance ${date(monthStart(6))} ${days(sinceAdded)} ${money(Math.round((16000 * sinceAdded) / 30))}`) &&
    empty.includes(`Flat B102 Test Tower B Vacant ${date(monthStart(6))} ${days(sinceAdded)} ${money(Math.round((12500 * sinceAdded) / 30))}`) &&
    empty[3] === `Flat B101 Test Tower B Vacant ${date(monthStart(0))} ${days(sinceB101)} ${money(Math.round((12000 * sinceB101) / 30))}`,
  empty.join(" | ")
);
check("no re-lets yet", main.includes("No flat changed tenants in the last 12 months."));

// ---- Download menu gives a CSV file
try {
  await page.getByRole("button", { name: "Download" }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: /What's owed \(CSV\)/ }).click(),
  ]);
  check("download menu saves a CSV", /^landlordlink-owed-\d{4}-\d{2}-\d{2}\.csv$/.test(download.suggestedFilename()), download.suggestedFilename());
} catch (error) {
  check("download menu saves a CSV", false, error.message.split("\n")[0]);
}

// ---- Links go to the flat pages
try {
  await page.getByTestId("insights-debtors").getByRole("link", { name: "Overdue Tenant" }).click();
  await page.waitForURL(/\/dashboard\/flats\//);
  await page.getByRole("heading", { name: /A102/ }).first().waitFor();
  check("tenant name opens their flat", true);
} catch (error) {
  check("tenant name opens their flat", false, error.message.split("\n")[0]);
}

check("no browser errors", problems.length === 0, problems.join(" | "));

await browser.close();

console.log(`\n${results.filter((result) => result.ok).length}/${results.length} passed`);

// For e2e/run.mjs: a failed check fails the suite.
if (results.some((result) => !result.ok)) process.exitCode = 1;
