// The AI assistant against the offline fake provider (e2e/run.mjs starts the
// app with AI_PROVIDER=fake ASSISTANT_DAILY_LIMIT=4): access rules, answers,
// limits, the chat panel, and changes that wait for confirmation. Expects
// freshly seeded test and demo data.
import { BASE, launchBrowser, outputPath } from "../lib/config.mjs";

import { login } from "../lib/harness.mjs";

const results = [];

function check(name, ok, detail = "") {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> ${String(detail).slice(0, 600)}`}`);
}

const cookie = (jar) => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

async function ask(jar, message, { history = [], contentType = "application/json", raw } = {}) {
  const res = await fetch(`${BASE}/api/assistant`, {
    method: "POST",
    headers: { "content-type": contentType, ...(jar ? { cookie: cookie(jar) } : {}) },
    body: raw ?? JSON.stringify({ message, history }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body, text: body.reply ?? body.error ?? "" };
}

// --- Access ---
let r = await ask(null, "hi");
check("signed out → 401", r.status === 401, r.status);

const tenant = await login("paid@example.com");
r = await ask(tenant, "who owes me rent?");
check("tenant → 403", r.status === 403, r.status);

const landlord = await login("landlord@example.com");
r = await ask(landlord, "hi", { contentType: "text/plain" });
check("non-JSON body → 415", r.status === 415, r.status);

r = await ask(landlord, "", {});
check("empty message → 400", r.status === 400, r.status);

r = await ask(landlord, "x".repeat(1001));
check("too long message → 400 saying why", r.status === 400 && r.text.includes("under 1,000 characters"), `${r.status} ${r.text}`);

// --- Answers come from the landlord's own data ---
r = await ask(landlord, "Who owes me rent?");
check("who owes: 200", r.status === 200, `${r.status} ${r.text}`);
check("who owes: lists Overdue Tenant", r.text.includes("Overdue Tenant"), r.text);
check("who owes: includes this month's partial tenant", r.text.includes("Partial Tenant"), r.text);
check("who owes: money formatted with ৳", /৳\d/.test(r.text), r.text);
check("who owes: no emails or phone numbers", !/@example\.com|\+880/.test(r.text), r.text);
check("remaining counts down (limit 4 → 3)", r.body.remaining === 3, r.body.remaining);

r = await ask(landlord, "Tell me about flat A102 in Test Tower A");
check("flat lookup: tenant shown", r.status === 200 && r.text.includes("Overdue Tenant"), r.text);
check("flat lookup: rent rows with statuses", r.text.includes("overdue") && r.text.includes("partly paid"), r.text);

// --- Isolation: another landlord can't see Test Tower A ---
const other = await login("landlord2@example.com");
r = await ask(other, "Tell me about flat A102 in Test Tower A");
check("other landlord: building not found", r.text.includes("No building called"), r.text);
check("other landlord: no tenant data leaks", !r.text.includes("Overdue Tenant"), r.text);
r = await ask(other, "Who owes me rent?");
check("other landlord: only their own tenants", !r.text.includes("Overdue Tenant") && !r.text.includes("Partial Tenant"), r.text);

// A very long earlier answer must not block the next question.
r = await ask(other, "Any requests?", { history: [{ role: "user", text: "Who owes?" }, { role: "assistant", text: "x".repeat(6000) }] });
check("long earlier answer doesn't block the next question", r.status === 200, `${r.status} ${r.text}`);

// --- Daily limit (4) ---
r = await ask(landlord, "Any requests?");
check("3rd message ok", r.status === 200 && r.body.remaining === 1, `${r.status} ${r.body.remaining}`);
r = await ask(landlord, "Any notices?");
check("4th message ok, none left", r.status === 200 && r.body.remaining === 0, `${r.status} ${r.body.remaining}`);
r = await ask(landlord, "Who owes me rent?");
check("5th message → 429 with a clear message", r.status === 429 && r.text.includes("used all 4"), `${r.status} ${r.text}`);

// --- Part B: changes are prepared, never made, until confirmed ---
const demo = await login("farhan.ahmed@example.com");
r = await ask(demo, "record 5000 for Nusrat");
const prepared = r.body.actions?.[0];
const detail = (label) => prepared?.details?.find((d) => d.label === label)?.value;
check("payment: prepared for confirmation", r.status === 200 && r.body.actions?.length === 1 && prepared.title === "Record payment", JSON.stringify(r.body).slice(0, 300));
check("payment: right tenant, month and amount", detail("Tenant") === "Nusrat Jahan" && /^Rent — /.test(detail("For") ?? "") && detail("Amount") === "৳5,000 of ৳12,500 left", JSON.stringify(prepared?.details));
check("payment: no database IDs sent to the browser", !/"(target|leaseId|requestId|buildingId)"/.test(JSON.stringify(r.body.actions)), JSON.stringify(r.body.actions));
r = await ask(demo, "Who owes me rent?");
check("payment: nothing recorded before confirming", /"tenant":"Nusrat Jahan"[^}]*"owesInTotal":"৳12,500"/.test(r.text), r.text.slice(0, 200));
r = await ask(demo, "record 20000 for Nusrat");
check("paying more than everything owed is refused", (r.body.actions ?? []).length === 0 && r.text.includes("more than all Nusrat Jahan owes (৳12,500)"), r.text);
r = await ask(demo, "record 30000 for Tanvir Alam");
const parts = r.body.actions ?? [];
const forMonth = (action) => action.details.find((d) => d.label === "For")?.value;
const amountOf = (action) => action.details.find((d) => d.label === "Amount")?.value;
check(
  "a bigger payment is split over the oldest months",
  parts.length === 2 &&
    /^Rent — /.test(forMonth(parts[0])) && amountOf(parts[0]) === "৳28,000 (all that's left)" &&
    amountOf(parts[1]) === "৳2,000 of ৳28,000 left" &&
    parts.every((action) => action.details.some((d) => d.label === "Note" && d.value.includes("split over 2 months"))),
  JSON.stringify(parts.map((action) => action.details))
);
r = await ask(demo, "record 1000 for Islam");
check("ambiguous tenant → asks which one", (r.body.actions ?? []).length === 0 && r.text.includes("Several current tenants match"), r.text);
r = await ask(demo, "post notice to Atlantis: hello");
check("unknown building → nothing prepared", (r.body.actions ?? []).length === 0 && r.text.includes("No building called"), r.text);

// --- Insights: analysis questions ---
r = await ask(demo, "Who usually pays late?");
check(
  "insights: payment habits with ratings",
  r.status === 200 && r.text.includes('"paymentHabits"') && r.text.includes('"rating":"often late"') && r.text.includes('"rating":"reliable"'),
  r.text.slice(0, 300)
);
check("insights: forecast and empty flats", /"expectedNext3Months":"৳[\d,]+"/.test(r.text) && r.text.includes('"emptyFlats"'), r.text.slice(0, 300));
check("insights: no emails or phone numbers", !/@example\.com|\+880/.test(r.text), r.text.slice(0, 300));
r = await ask(other, "Who pays late?");
check("insights: another landlord sees only their own", r.status === 200 && r.text.includes("X101") && !r.text.includes("Overdue Tenant"), r.text.slice(0, 300));

// --- UI ---
const problems = [];
const browser = await launchBrowser();

async function demoPage(role, viewport = { width: 1366, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") problems.push(m.text().slice(0, 200)); });
  await page.goto(BASE);
  await page.getByRole("button", { name: role === "landlord" ? /Try as landlord/ : /Try as tenant/ }).first().click();
  await page.waitForURL(role === "landlord" ? `${BASE}/dashboard` : `${BASE}/tenant`);
  return page;
}

const page = await demoPage("landlord");
const panel = page.getByRole("dialog");

try {
  await page.getByRole("button", { name: "Ask AI" }).click();
  await panel.getByText("How can I help?").waitFor();
  check("panel opens with suggestions", true);

  await panel.getByRole("button", { name: "Who owes me rent right now?" }).click();
  await panel.getByText("Who owes me rent right now?").waitFor();
  await panel.getByText(/Tanvir Alam/).first().waitFor();
  check("suggestion asks and shows the answer", true);

  await panel.getByRole("textbox", { name: "Message the assistant" }).fill("Any new requests?");
  await page.keyboard.press("Enter");
  await panel.getByText(/Samira Khan/).first().waitFor();
  check("typing + Enter sends a question", true);

  await panel.getByText(/messages left today/).waitFor();
  check("shows messages left today", true);

  // The conversation survives moving to another page.
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Buildings" }).first().click();
  await page.waitForURL(`${BASE}/dashboard/buildings`);
  await page.getByRole("button", { name: "Ask AI" }).click();
  await panel.getByText("Any new requests?").waitFor();
  check("conversation kept after navigating", true);

  const scroller = panel.getByTestId("assistant-messages");
  const isAtBottom = () => scroller.evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight < 4);
  await page.waitForTimeout(300);
  check("reopened chat starts at the latest message", await isAtBottom(), await scroller.evaluate((el) => `${el.scrollTop}/${el.scrollHeight - el.clientHeight}`));

  await scroller.evaluate((el) => el.scrollTo({ top: 0 }));
  const jump = panel.getByRole("button", { name: "Jump to the latest message" });
  await jump.waitFor();
  await jump.click();
  await page.waitForTimeout(900);
  check("jump button scrolls to the latest message", (await isAtBottom()) && (await jump.count()) === 0);

  await panel.getByRole("button", { name: "New chat" }).click();
  await panel.getByText("How can I help?").waitFor();
  check("New chat clears the conversation", true);
  await page.keyboard.press("Escape");
} catch (error) {
  check("assistant UI flow", false, error.message.split(/\r?\n/).slice(0, 4).join(" | "));
  await page.screenshot({ path: outputPath("ai-ui-failure.png") });
}

// --- Part B UI: confirm, cancel, review later; then check the app ---
const ui = await demoPage("landlord");
const sheet = ui.getByRole("dialog");
const confirmBox = ui.getByRole("alertdialog");
const lastCard = () => sheet.getByTestId("assistant-action").last();

async function send(text) {
  await sheet.getByRole("textbox", { name: "Message the assistant" }).fill(text);
  await ui.keyboard.press("Enter");
}

try {
  await ui.getByRole("button", { name: "Ask AI" }).click();

  await send("record 5000 for Nusrat");
  await confirmBox.getByText("Record payment?").waitFor();
  await confirmBox.getByText("৳5,000 of ৳12,500 left").waitFor();
  check("popup opens with the prepared payment", true);

  await confirmBox.getByRole("button", { name: "Confirm" }).click();
  await ui.locator("[data-sonner-toast]").filter({ hasText: "Payment of ৳5,000 recorded" }).first().waitFor();
  await lastCard().getByText("Done").waitFor();
  check("Confirm records the payment", true);
  check("panel stays open after confirming", await sheet.isVisible());

  await send("record 30000 for Tanvir Alam");
  await confirmBox.getByText("Make these 2 changes?").waitFor();
  await confirmBox.getByRole("button", { name: "Confirm all (2)" }).click();
  await sheet.getByTestId("assistant-action").nth(-1).getByText("Done").waitFor();
  await sheet.getByTestId("assistant-action").nth(-2).getByText("Done").waitFor();
  check("a split payment is confirmed in one go", true);

  await send("record 1000 for Sohel Rana");
  await confirmBox.getByText("Record payment?").waitFor();
  await confirmBox.getByRole("button", { name: "Cancel" }).click();
  await lastCard().getByText("Cancelled").waitFor();
  check("Cancel leaves it undone", true);

  await send("approve Samira Khan");
  await confirmBox.getByText("Approve request?").waitFor();
  await ui.keyboard.press("Escape");
  await confirmBox.waitFor({ state: "hidden" });
  check("Esc closes only the popup", await sheet.isVisible());
  await lastCard().getByRole("button", { name: "Review & confirm" }).click();
  await confirmBox.getByRole("button", { name: "Confirm" }).click();
  await lastCard().getByText("Done").waitFor();
  check("review later, then approve", true);

  await send("reject Tania Parvin");
  await confirmBox.getByRole("button", { name: "Confirm" }).click();
  await lastCard().getByText("Done").waitFor();
  check("reject a request", true);

  await send("post notice to Green Valley: Lift maintenance on Sunday");
  await confirmBox.getByText("Post notice?").waitFor();
  await confirmBox.getByRole("button", { name: "Confirm" }).click();
  await lastCard().getByText("Done").waitFor();
  check("post a notice", true);

  // The changes really happened in the app.
  await ui.keyboard.press("Escape");
  await ui.goto(`${BASE}/dashboard/buildings`);
  await ui.getByRole("link", { name: /Green Valley Apartments/ }).click();
  await ui.getByRole("heading", { name: "Green Valley Apartments" }).waitFor();
  const buildingUrl = ui.url();
  await ui.getByRole("link", { name: /Flat 203/ }).click();
  await ui.getByText("৳17,500 paid").waitFor();
  check("flat 203 shows the payment (৳17,500 paid)", true);
  await ui.goto(buildingUrl);
  await ui.getByRole("link", { name: /Flat 204/ }).click();
  await ui.getByRole("heading", { name: /Flat 204/ }).waitFor();
  check("flat 204 is now Samira Khan's", (await ui.getByText("Samira Khan").count()) > 0 && (await ui.getByText("Occupied").count()) > 0);
  await ui.goto(`${buildingUrl}?tab=notices`);
  await ui.getByText("Lift maintenance on Sunday").first().waitFor();
  check("the notice is on the building's Notices tab", true);
} catch (error) {
  check("assistant changes UI flow", false, error.message.split(/\r?\n/).slice(0, 4).join(" | "));
  await ui.screenshot({ path: outputPath("ai-changes-failure.png") });
}

const tenantPage = await demoPage("tenant");
check("tenants don't get the assistant", (await tenantPage.getByRole("button", { name: "Ask AI" }).count()) === 0);

const phone = await demoPage("landlord", { width: 390, height: 844 });
try {
  await phone.getByRole("button", { name: "Ask AI" }).click();
  const box = await phone.getByRole("dialog").boundingBox();
  check("phone: panel fills the screen width", box && Math.round(box.width) === 390, JSON.stringify(box));
  const wide = await phone.evaluate(() => document.documentElement.scrollWidth);
  check("phone: no sideways scrolling", wide <= 390, wide);
} catch (error) {
  check("phone panel", false, error.message);
}

await browser.close();

console.log(problems.length ? `\nBrowser console problems:\n  ${problems.join("\n  ")}` : "\nBrowser console problems:\n  none");
console.log(`\n${results.filter((x) => x.ok).length}/${results.length} passed`);

// For e2e/run.mjs: a failed check or a browser error fails the suite.
if (results.some((result) => !result.ok) || problems.length > 0) process.exitCode = 1;
