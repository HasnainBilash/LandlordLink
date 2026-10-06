// Read paths over HTTP: every landlord and tenant page opens, shows the
// expected numbers for freshly seeded test data, and leaks nothing (password
// hashes, other landlords' buildings, access codes to tenants), plus the CSV
// downloads.
import { BASE } from "../lib/config.mjs";
import { login, get, plain } from "../lib/harness.mjs";

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> ${detail}`}`);
}

const has = (text, needle) => text.includes(needle);
const BCRYPT = /\$2[aby]\$\d\d\$/;

// ---------- Landlord ----------
const landlord = await login("landlord@example.com");

let r = await get(landlord, "/dashboard");
let t = plain(r.text);
check("home 200", r.status === 200, r.status);
check("home: pending request item", has(t, "1 join request waiting for you"), t.slice(0, 400));
check("home: overdue tenant ৳27,000", has(t, "Overdue Tenant is behind on rent") && has(t, "৳27,000"));
check("home: past dues ৳12,000", has(t, "1 former tenant still owes you") && has(t, "৳12,000"));
check("home: B101 no longer listed as current overdue", !has(t, "Ended Tenant is behind"));
check("home: occupancy 43%", has(t, "43%"));
check("home: collected ৳25,000", has(t, "৳25,000"));
check("home: outstanding ৳56,500", has(t, "৳56,500"));
check("home: loads under 3s", r.ms < 3000, `${r.ms}ms`);

r = await get(landlord, "/dashboard/buildings");
t = plain(r.text);
check("buildings 200", r.status === 200, r.status);
check("buildings: both towers", has(t, "Test Tower A") && has(t, "Test Tower B"));
check("buildings: request badge", has(t, "1 request"));
const buildingIds = [...r.text.matchAll(/href="\/dashboard\/buildings\/([a-z0-9]+)"/g)].map((m) => m[1]);
const towerA = buildingIds[1] ?? buildingIds[0];

// Find Tower A by name order: buildings are newest first, Tower B created after A.
const cards = [...r.text.matchAll(/href="\/dashboard\/buildings\/([a-z0-9]+)"[\s\S]*?<p[^>]*>([^<]+)<\/p>/g)].map((m) => ({ id: m[1], name: m[2] }));
const a = cards.find((c) => c.name.includes("Test Tower A"))?.id ?? towerA;
const b = cards.find((c) => c.name.includes("Test Tower B"))?.id;
check("found tower ids", Boolean(a && b), JSON.stringify(cards));

r = await get(landlord, `/dashboard/buildings/${a}`);
t = plain(r.text);
check("building A 200", r.status === 200, r.status);
check("building A: units visible", has(t, "Flat A101") && has(t, "Flat A102") && has(t, "Flat A201"));
check("building A: tenant names on tiles", has(t, "Paid Tenant") && has(t, "Overdue Tenant"));
check("building A: overdue badge", has(t, "Overdue"));
check("building A: outstanding ৳55,000", has(t, "৳55,000"));
check("building A: 3 / 5 rented", has(t, "3 / 5"));
check("building A: access code shown", /[A-Z2-9]{8}/.test(t));
check("building A: no password hashes", !BCRYPT.test(r.text));
const flatIds = Object.fromEntries(
  [...r.text.replace(/<!-- -->/g, "").matchAll(/href="\/dashboard\/flats\/([a-z0-9]+)"[\s\S]*?Flat (A\d{3})/g)].map((m) => [m[2], m[1]])
);
check("flat ids found", Boolean(flatIds.A102 && flatIds.A202), JSON.stringify(flatIds));

r = await get(landlord, `/dashboard/buildings/${a}?tab=requests`);
t = plain(r.text);
check("building A requests tab", r.status === 200 && has(t, "Pending Tenant") && has(t, "Approve"));

r = await get(landlord, `/dashboard/buildings/${a}?tab=notices`);
t = plain(r.text);
check("building A notices tab", r.status === 200 && has(t, "Water supply off on Friday") && has(t, "Expired"));

r = await get(landlord, `/dashboard/buildings/${a}?tab=activity`);
check("building A activity tab", r.status === 200);

r = await get(landlord, `/dashboard/flats/${flatIds.A102}`);
t = plain(r.text);
check("flat A102 200", r.status === 200, r.status);
check("flat A102: tenant + end lease", has(t, "Overdue Tenant") && has(t, "End lease"));
check("flat A102: balance ৳45,000", has(t, "৳45,000"));
check("flat A102: overdue + partly paid rows", has(t, "Overdue") && has(t, "Partly paid"));
check("flat A102: no password hashes", !BCRYPT.test(r.text));
check("flat A102: no passwordHash field", !r.text.includes("passwordHash"));

r = await get(landlord, `/dashboard/flats/${flatIds.A202}`);
t = plain(r.text);
check("flat A202 (vacant, pending request)", r.status === 200 && has(t, "Pending Tenant") && has(t, "Approve"));
check("flat A202: no password hashes", !BCRYPT.test(r.text));

r = await get(landlord, "/dashboard/requests");
t = plain(r.text);
check("requests inbox", r.status === 200 && has(t, "Pending Tenant"));
check("requests inbox: no password hashes", !BCRYPT.test(r.text));

r = await get(landlord, "/dashboard/requests?status=ALL");
t = plain(r.text);
check("requests all", r.status === 200 && has(t, "Paid Tenant") && has(t, "Ended Tenant"));

r = await get(landlord, "/dashboard/reports");
t = plain(r.text);
check("reports overview 200", r.status === 200, r.status);
check("reports: all-time ৳1,76,000", has(t, "৳1,76,000"));
check("reports: outstanding ৳56,500", has(t, "৳56,500"));
check("reports: Tower A ৳1,52,000", has(t, "৳1,52,000"));

r = await get(landlord, "/dashboard/reports?tab=past-dues");
t = plain(r.text);
check("past dues tab", r.status === 200 && has(t, "Ended Tenant") && has(t, "৳12,000") && has(t, "Write off"));

// Insights opens (its numbers are checked in a browser by 09-insights:
// the streamed HTML isn't in reading order).
r = await get(landlord, "/dashboard/reports?tab=insights");
t = plain(r.text);
check("insights tab 200", r.status === 200 && has(t, "৳28,500") && has(t, "Overdue Tenant"), r.status);

r = await get(landlord, "/dashboard/reports?tab=activity");
check("activity tab", r.status === 200);

// CSV downloads (Reports → Download)
r = await get(landlord, "/api/export/rent-roll");
const csvLines = r.text.trim().split("\r\n");
// text() drops the byte-order mark, so look at the raw bytes for it.
const csvBytes = new Uint8Array(
  await (
    await fetch(`${BASE}/api/export/rent-roll`, {
      headers: { cookie: [...landlord.entries()].map(([name, value]) => `${name}=${value}`).join("; ") },
    })
  ).arrayBuffer()
);
check(
  "rent roll: a CSV file",
  r.status === 200 &&
    csvBytes[0] === 0xef && csvBytes[1] === 0xbb && csvBytes[2] === 0xbf &&
    r.headers.get("content-type")?.startsWith("text/csv") &&
    /^attachment; filename="landlordlink-rent-roll-\d{4}-\d{2}-\d{2}\.csv"$/.test(r.headers.get("content-disposition") ?? ""),
  `${r.status} ${r.headers.get("content-type")} ${r.headers.get("content-disposition")}`
);
check(
  "rent roll: current tenants with rent, deposit, owed and overdue",
  csvLines[0] === "Building,Floor,Flat,Tenant,Moved in,Monthly rent,Deposit,Owes now,Of which overdue" &&
    csvLines.length === 4 &&
    /^Test Tower A,Floor 1,A102,Overdue Tenant,\d{4}-\d{2}-\d{2},18000,36000,45000,27000$/.test(csvLines[2]) &&
    /^Test Tower A,Floor 2,A201,Partial Tenant,\d{4}-\d{2}-\d{2},20000,40000,11500,1500$/.test(csvLines[3]),
  csvLines.join(" | ")
);

r = await get(landlord, "/api/export/owed");
check(
  "what's owed: every unpaid item, former tenants too",
  r.status === 200 &&
    r.text.includes("Building,Flat,Tenant,Tenant is,For,Due,Amount,Paid,Owed,Months overdue") &&
    /\r\nTest Tower B,B101,Ended Tenant,Former,Rent — \w+ \d{4},\d{4}-\d{2}-\d{2},12000,0,12000,1\r\n/.test(r.text) &&
    /\r\nTest Tower A,A102,Overdue Tenant,Current,Rent — \w+ \d{4},\d{4}-\d{2}-\d{2},18000,9000,9000,2\r\n/.test(r.text) &&
    r.text.trim().split("\r\n").length === 7,
  r.text.slice(0, 600)
);

r = await get(landlord, "/api/export/payments");
check(
  "payments: dated, with what they paid for and the reference",
  r.status === 200 &&
    r.text.includes("Date,Building,Flat,Tenant,For,Amount,Reference") &&
    /\r\n\d{4}-\d{2}-\d{2},Test Tower A,A102,Overdue Tenant,Rent — \w+ \d{4},9000,TEST\r\n/.test(r.text),
  r.text.slice(0, 600)
);

r = await get(landlord, "/api/export/everything");
check("unknown download → 404", r.status === 404, r.status);
r = await get(null, "/api/export/rent-roll");
check("download signed out → 401", r.status === 401, r.status);

// Legacy redirects
for (const [from, to] of [
  ["/dashboard/activity", "/dashboard/reports?tab=activity"],
  [`/dashboard/buildings/${a}/floors`, `/dashboard/buildings/${a}`],
  [`/dashboard/buildings/${a}/notices/new`, `/dashboard/buildings/${a}?tab=notices`],
  [`/dashboard/buildings/x/floors/y/flats/${flatIds.A102}`, `/dashboard/flats/${flatIds.A102}`],
  [`/dashboard/buildings/x/floors/y/flats/new`, `/dashboard/buildings/x`],
]) {
  r = await get(landlord, from);
  check(`redirect ${from}`, [307, 308].includes(r.status) && r.location?.endsWith(to), `${r.status} ${r.location}`);
}

// ---------- Other landlord can't see Tower A ----------
const other = await login("landlord2@example.com");
r = await get(other, `/dashboard/buildings/${a}`);
t = plain(r.text);
check("landlord2 blocked from Tower A", /NEXT_HTTP_ERROR_FALLBACK;404/.test(r.text) && !r.text.includes("Test Tower A"), t.slice(0, 300));
r = await get(other, `/dashboard/flats/${flatIds.A102}`);
t = plain(r.text);
check("landlord2 blocked from flat A102", /NEXT_HTTP_ERROR_FALLBACK;404/.test(r.text) && !r.text.includes("Overdue Tenant"), t.slice(0, 300));
r = await get(other, "/api/export/owed");
check("landlord2's downloads hold only their own data", r.status === 200 && !r.text.includes("Test Tower") && !r.text.includes("Overdue Tenant"), r.text.slice(0, 300));
r = await get(other, "/dashboard/reports?tab=insights");
t = plain(r.text);
check(
  "landlord2's insights show only their own flats",
  r.status === 200 && has(t, "Flat X101") && !has(t, "Test Tower") && !has(t, "Overdue Tenant"),
  t.slice(0, 300)
);

// ---------- Tenants ----------
const paid = await login("paid@example.com");
r = await get(paid, "/api/export/payments");
check("tenants can't download landlord reports (403)", r.status === 403, r.status);
r = await get(paid, "/tenant");
t = plain(r.text);
check("paid tenant home", r.status === 200 && has(t, "Nothing — all paid"));
check("paid tenant: active notice", has(t, "Water supply off on Friday"));
check("paid tenant: expired notice hidden", !has(t, "Old notice (expired)"));
check("paid tenant: no access codes leaked", !r.text.includes("accessCode"));

const overdue = await login("overdue@example.com");
r = await get(overdue, "/tenant");
t = plain(r.text);
check("overdue tenant owes ৳45,000", has(t, "৳45,000"), t.slice(0, 300));

const tenantFlatId = r.text.match(/href="\/tenant\/flats\/([a-z0-9]+)"/)?.[1];
r = await get(overdue, `/tenant/flats/${tenantFlatId}`);
t = plain(r.text);
check("tenant flat page", r.status === 200 && has(t, "Overdue") && has(t, "Partly paid"));
check("tenant flat page: no record-payment button", !has(t, "Record payment"));

const newcomer = await login("newtenant@example.com");
r = await get(newcomer, "/tenant");
check("new tenant empty home", has(plain(r.text), "You don't have a flat yet"));

r = await get(newcomer, "/tenant/buildings");
t = plain(r.text);
check("find a flat lists towers", has(t, "Test Tower A") && has(t, "Test Tower B"));
check("find a flat: no access codes leaked", !r.text.includes("accessCode"));

r = await get(newcomer, "/tenant/buildings?code=WRONGCODE");
check("wrong code message", has(plain(r.text), "No building matches that code"));

r = await get(newcomer, `/tenant/buildings/${b}/flats`);
t = plain(r.text);
check("tower B vacant flats", r.status === 200 && has(t, "Flat B101") && has(t, "Flat B102") && has(t, "Request"));

r = await get(newcomer, "/tenant/requests");
check("tenant requests page", r.status === 200);
r = await get(newcomer, "/tenant/profile");
check("tenant profile page", r.status === 200 && has(plain(r.text), "Save profile"));

r = await get(newcomer, "/tenant/notices");
check("legacy /tenant/notices redirects", [307, 308].includes(r.status) && r.location?.endsWith("/tenant"), `${r.status} ${r.location}`);

// Role separation
r = await get(newcomer, "/dashboard");
check("tenant sent away from /dashboard", [307, 308].includes(r.status) && r.location?.includes("/tenant"), `${r.status} ${r.location}`);

const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;

// For e2e/run.mjs: a failed check fails the suite.
if (results.some((result) => !result.ok)) process.exitCode = 1;
