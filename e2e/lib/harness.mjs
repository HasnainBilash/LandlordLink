// Tiny HTTP test harness: logs in through Auth.js and fetches pages.
// Usage: node harness.mjs <email> <path> [<path>...]
import { BASE } from "./config.mjs";

function collectCookies(res, jar) {
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookies) {
    const [pair] = c.split(";");
    const [name, ...rest] = pair.split("=");
    jar.set(name.trim(), rest.join("="));
  }
}

const cookieHeader = (jar) =>
  [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

export async function login(email, password = "11111111") {
  const jar = new Map();
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  collectCookies(csrfRes, jar);
  const { csrfToken } = await csrfRes.json();

  const body = new URLSearchParams({ csrfToken, email, password, callbackUrl: BASE });
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(jar),
    },
    body,
    redirect: "manual",
  });
  collectCookies(res, jar);

  if (![...jar.keys()].some((k) => k.includes("session-token"))) {
    throw new Error(`Login failed for ${email} (status ${res.status}, location ${res.headers.get("location")})`);
  }
  return jar;
}

export async function get(jar, path) {
  const started = Date.now();
  const res = await fetch(`${BASE}${path}`, {
    headers: jar ? { cookie: cookieHeader(jar) } : {},
    redirect: "manual",
  });
  const text = await res.text();
  return { status: res.status, location: res.headers.get("location"), text, ms: Date.now() - started };
}

// Strip tags so text checks are easy.
export const plain = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");

