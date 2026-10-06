// Phone-width check: no page may scroll sideways. Lists the elements that
// stick out past the right edge.
import { BASE, launchBrowser } from "../lib/config.mjs";

const WIDTH = 360; // narrower than most phones, to catch near misses
const browser = await launchBrowser();
const failures = [];
let checked = 0;

async function check(page, label) {
  await page.waitForLoadState("networkidle");
  const result = await page.evaluate((width) => {
    const offenders = [];
    for (const el of document.querySelectorAll("body *")) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.right <= width + 1) continue;
      // Skip children of elements that scroll on purpose (tables, tab bars).
      let parent = el.parentElement;
      let insideScroller = false;
      while (parent) {
        const overflowX = getComputedStyle(parent).overflowX;
        if (overflowX === "auto" || overflowX === "scroll" || overflowX === "hidden") {
          insideScroller = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (insideScroller) continue;
      offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} → ${Math.round(rect.right)}px`);
    }
    return { scrollWidth: document.documentElement.scrollWidth, offenders: offenders.slice(0, 5) };
  }, WIDTH);

  checked += 1;
  if (result.scrollWidth > WIDTH || result.offenders.length) {
    failures.push(`${label}: page ${result.scrollWidth}px wide\n    ${result.offenders.join("\n    ")}`);
  }
}

async function visit(page, path, label = path) {
  await page.goto(`${BASE}${path}`);
  await check(page, label);
}

async function signedIn(role) {
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 780 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  await page.goto(BASE);
  await page.getByRole("button", { name: role === "landlord" ? /Try as landlord/ : /Try as tenant/ }).first().click();
  await page.waitForURL(role === "landlord" ? `${BASE}/dashboard` : `${BASE}/tenant`);
  return page;
}

// Public pages
{
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 780 } });
  const page = await ctx.newPage();
  await visit(page, "/", "landing");
  await visit(page, "/login");
  await visit(page, "/register");
}

// Landlord
{
  const page = await signedIn("landlord");
  await visit(page, "/dashboard");
  await visit(page, "/dashboard/buildings");
  await page.getByRole("link", { name: /Green Valley Apartments/ }).click();
  await page.getByRole("heading", { name: "Green Valley Apartments" }).waitFor();
  const building = new URL(page.url()).pathname;
  await check(page, "building: floors & flats");
  for (const tab of ["requests", "notices", "activity"]) {
    await visit(page, `${building}?tab=${tab}`, `building: ${tab}`);
  }
  await visit(page, building);
  await page.getByRole("link", { name: /Flat 203/ }).click();
  await page.getByRole("heading", { name: /Flat 203/ }).waitFor();
  await check(page, "flat (occupied)");
  await page.getByRole("button", { name: "Record payment" }).first().click();
  await page.getByRole("dialog").waitFor();
  await check(page, "record payment dialog");
  await page.keyboard.press("Escape");
  await visit(page, building);
  await page.getByRole("link", { name: /Flat 204/ }).click();
  await page.getByRole("heading", { name: /Flat 204/ }).waitFor();
  await check(page, "flat (vacant)");
  await visit(page, "/dashboard/requests");
  await visit(page, "/dashboard/requests?status=ALL", "requests: all");
  await visit(page, "/dashboard/reports");
  await visit(page, "/dashboard/reports?tab=past-dues", "reports: past dues");
  await visit(page, "/dashboard/reports?tab=activity", "reports: activity");
  await visit(page, "/dashboard/flats/missing", "404 in app");
}

// Tenant
{
  const page = await signedIn("tenant");
  await visit(page, "/tenant");
  await visit(page, "/tenant/buildings");
  await page.getByRole("link", { name: /Sunset Residency/ }).click();
  await page.getByRole("heading", { name: "Sunset Residency" }).waitFor();
  await check(page, "tenant: building flats");
  await visit(page, "/tenant");
  await page.getByRole("link", { name: "Rent & bills" }).click();
  await page.getByRole("heading", { name: /Flat 203/ }).waitFor();
  await check(page, "tenant: flat");
  await visit(page, "/tenant/requests");
  await visit(page, "/tenant/profile");
}

await browser.close();
console.log(failures.length ? `Sideways scrolling found:\n  ${failures.join("\n  ")}` : `No sideways scrolling on ${checked} pages`);

// For e2e/run.mjs: a failed check fails the suite.
if (failures.length > 0) process.exitCode = 1;
