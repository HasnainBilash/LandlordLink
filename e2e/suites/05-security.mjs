// Phase 5 security checks: headers + CSP nonce, sign-in limits and timing,
// sign-up limit, cron cleanup. Uses made-up x-forwarded-for addresses so
// its counters don't affect other suites (locally the header is trusted;
// on Vercel the platform sets it).
import { BASE, CRON_SECRET, launchBrowser } from "../lib/config.mjs";

const results = [];

function check(name, ok, detail = "") {
  results.push({ ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> ${String(detail).slice(0, 300)}`}`);
}

const randomIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

// --- Headers ---
const home = await fetch(`${BASE}/`);
const html = await home.text();
const csp = home.headers.get("content-security-policy") ?? "";
const nonce = csp.match(/'nonce-([^']+)'/)?.[1];

check("CSP header with a nonce and strict-dynamic", Boolean(nonce) && csp.includes("'strict-dynamic'"), csp);
check("CSP blocks framing, plugins and foreign forms", csp.includes("frame-ancestors 'none'") && csp.includes("object-src 'none'") && csp.includes("form-action 'self'"), csp);
check("no unsafe-eval in production", !csp.includes("unsafe-eval"), csp);
check("every script tag carries the nonce", (() => {
  const scripts = html.match(/<script\b[^>]*>/g) ?? [];
  return scripts.length > 0 && scripts.every((tag) => tag.includes(`nonce="${nonce}"`));
})(), (html.match(/<script\b[^>]*>/g) ?? []).filter((tag) => !tag.includes(`nonce="${nonce}"`)).slice(0, 3).join(" "));

const second = await fetch(`${BASE}/`);
const nonce2 = (second.headers.get("content-security-policy") ?? "").match(/'nonce-([^']+)'/)?.[1];
check("a fresh nonce on every request", nonce2 && nonce2 !== nonce, `${nonce} vs ${nonce2}`);

const expected = {
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
};
for (const [header, value] of Object.entries(expected)) {
  check(`${header}: ${value}`, home.headers.get(header) === value, home.headers.get(header));
}
check("permissions-policy set", (home.headers.get("permissions-policy") ?? "").includes("camera=()"), home.headers.get("permissions-policy"));
check("HSTS set", (home.headers.get("strict-transport-security") ?? "").includes("max-age="), home.headers.get("strict-transport-security"));
check("no x-powered-by", !home.headers.has("x-powered-by"), home.headers.get("x-powered-by"));

const api = await fetch(`${BASE}/api/assistant`, { method: "POST" });
check("API responses get the security headers too", api.headers.get("x-content-type-options") === "nosniff", api.status);

// --- Sign-in limits ---
async function signIn(email, password, ip) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { headers: { "x-forwarded-for": ip } });
  const cookie = (csrfRes.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  const { csrfToken } = await csrfRes.json();
  const started = Date.now();
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie, "x-forwarded-for": ip },
    body: new URLSearchParams({ csrfToken, email, password, callbackUrl: BASE }),
    redirect: "manual",
  });
  const setCookies = res.headers.getSetCookie?.() ?? [];
  return {
    ms: Date.now() - started,
    ok: setCookies.some((c) => c.includes("session-token")),
    location: res.headers.get("location") ?? "",
  };
}

const ip = randomIp();
for (let i = 0; i < 8; i++) await signIn("landlord@example.com", "wrong-password", ip);
let attempt = await signIn("landlord@example.com", "11111111", ip);
check("after 8 failures, even the right password is refused for 15 min", !attempt.ok && attempt.location.includes("rate_limited"), attempt.location);

attempt = await signIn("landlord@example.com", "11111111", randomIp());
check("the same account still signs in from another network", attempt.ok, attempt.location);

attempt = await signIn("LandLord@Example.COM", "11111111", randomIp());
check("email is case-insensitive", attempt.ok, attempt.location);

// Unknown email vs wrong password take about as long (no account probing).
// Without the dummy hash an unknown email would answer many times faster,
// so a loose ratio of medians catches that without being flaky on slow or
// noisy machines (CI).
const timingIp = randomIp();
const unknown = [];
const wrong = [];
for (let i = 0; i < 5; i++) {
  unknown.push((await signIn(`nobody${i}@example.com`, "wrong-password", timingIp)).ms);
  wrong.push((await signIn("paid@example.com", "wrong-password", randomIp())).ms);
}
const median = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
const ratio = median(unknown) / median(wrong);
check(
  "unknown email takes about as long as a wrong password",
  ratio > 0.6 && ratio < 1.6,
  `unknown ${median(unknown)}ms vs wrong password ${median(wrong)}ms`
);

// --- Sign-up limit (5 per hour per network) ---
const browser = await launchBrowser();
const ctx = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": randomIp() } });
const page = await ctx.newPage();
page.setDefaultTimeout(20000);
let limited = false;

for (let i = 1; i <= 6; i++) {
  await page.goto(`${BASE}/register`);
  await page.getByLabel("Full Name").fill(`Limit Test ${i}`);
  await page.getByLabel("Email").fill(`limit-${Date.now()}-${i}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("11111111");
  await page.getByLabel(/Confirm/).fill("11111111");
  await page.getByRole("radio", { name: "Tenant" }).check();
  await page.getByRole("button", { name: "Create Account" }).click();

  if (i <= 5) {
    await page.waitForURL(/\/login/, { timeout: 20000 }).catch(() => undefined);
  } else {
    limited = await page.getByText("Too many new accounts from your network").waitFor({ timeout: 15000 }).then(() => true, () => false);
  }
}
check("6th sign-up from one network in an hour is refused", limited);
await browser.close();

// --- Nightly cleanup job ---
let res = await fetch(`${BASE}/api/cron/cleanup`);
check("cleanup without the secret → 401", res.status === 401, res.status);
res = await fetch(`${BASE}/api/cron/cleanup`, { headers: { authorization: `Bearer ${CRON_SECRET}` } });
const body = await res.json().catch(() => ({}));
check("cleanup with the secret → 200 and counts", res.status === 200 && typeof body.removed?.rateLimits === "number", JSON.stringify(body));

console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);

// For e2e/run.mjs: a failed check fails the suite.
if (results.some((result) => !result.ok)) process.exitCode = 1;
