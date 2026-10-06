# Testing Guide

How to test LandlordLink after each upgrade phase. The "Every time"
section stays the same each phase; each phase adds its own section below.

---

## 1. One-time setup

### 1.1 Make a test copy of the database (Neon branch)

Never test on your live data. Neon can make an instant copy, called a
**branch**:

1. Open the Neon console → your project → **Branches** → **New branch**.
2. Name it `testing`, parent `main` → **Create**.

You can delete and re-create this branch any time to start fresh.

### 1.2 Get the two connection strings

Neon gives every branch two addresses for the same database:

| Name in `.env` | What it is | How to get it in Neon |
|---|---|---|
| `DATABASE_URL` | **Pooled** — shares connections, used by the app | **Connect** → pick branch `testing` → **Connection pooling ON** → copy. The host contains `-pooler`. |
| `DIRECT_URL` | **Direct** — one plain connection, used only for migrations | Same dialog → **Connection pooling OFF** → copy. Same string without `-pooler`. |

Put both in your local `.env` (see `.env.example`), together with
`AUTH_SECRET`.

### 1.3 Prepare and start

```bash
npm install
npm run db:migrate      # applies database changes to the testing branch
npm run db:seed-test    # creates the test accounts below
npm run build
npm start               # open http://localhost:3000
```

`npm run db:seed-test` can be re-run any time. It deletes and recreates
**only** the test accounts, so it also works as "reset my test data".

---

## 2. Test accounts

Password for all: **`11111111`**

| Email | Role | What's special about it |
|---|---|---|
| `landlord@example.com` | Landlord | Owns Test Tower A and Test Tower B — use this for most tests |
| `landlord2@example.com` | Landlord | Owns only "Other Landlord Tower" — use it to check landlords can't see each other's data |
| `paid@example.com` | Tenant | Flat A101, everything paid |
| `overdue@example.com` | Tenant | Flat A102, owes last month in full and half of the month before |
| `partial@example.com` | Tenant | Flat A201, this month half paid, one unpaid electricity bill |
| `pending@example.com` | Tenant | Has a pending request for flat A202 |
| `newtenant@example.com` | Tenant | No flat yet — use it to test "Find a flat" |
| `ended@example.com` | Tenant | Used to live in B101; lease ended while still owing last month's rent |

The seed script prints the **access codes** for Test Tower A and B at the
end. You need them to request a flat as a tenant.

### Demo accounts (interviews / demos)

Visitors reach these with the **Try as landlord / Try as tenant** buttons
on the home page — no typing needed.

| Email | Password | What it has |
|---|---|---|
| `farhan.ahmed@example.com` | `11111111` | Landlord: 3 buildings, 26 tenants (plus applicants and former tenants), months of rent and payment history, overdue and partial rent, pending and rejected requests, former tenants who still owe (Past dues), notices, activity log |
| `nusrat.demo@example.com` | `11111111` | Tenant: flat 203 in Green Valley Apartments, this month half paid, building notices |

The live site rebuilds the demo **every night at 03:00** (Bangladesh time),
with dates relative to that day. To rebuild it right now — e.g. just before
an interview, if someone has been clicking around — either run:

```bash
npm run db:seed-demo
```

or open Vercel → your project → **Settings → Cron Jobs** → **Run** next to
`/api/cron/reset-demo`. Only demo data is replaced.

---

## 3. Every time (about 10 minutes)

Run through this after every phase. If anything fails, note the step
number and what you saw.

**Landlord** (`landlord@example.com`)
1. Log in → you land on the dashboard.
2. Open Buildings → Test Tower A → a floor → a flat. Every page opens
   without errors.
3. Open Reports → numbers and charts appear.
4. On flat A102, record a small payment (e.g. 1000) on an unpaid rent row →
   "Payment recorded" appears and the row updates.
5. Create a notice on Test Tower A → it appears in the list.
6. Log out.

**Tenant** (`partial@example.com`)
7. Log in → you land on the tenant dashboard and see flat A201.
8. Open the flat → rent and utility bills are listed.
9. Open Notices → you see the notice from step 5 and "Water supply off on
   Friday", but **not** "Old notice (expired)".

**Full flow** (`newtenant@example.com` + landlord)
10. As `newtenant`, open Find a flat → search with Test Tower B's access
    code → request flat B102.
11. As `landlord`, the Requests badge shows a count → approve the request
    → B102 becomes occupied and shows rent rows.

**Security**
12. As `landlord2`, open a Test Tower A page by pasting its URL (copy it
    while logged in as `landlord`) → you get "Page not found", not the data.

---

## 4. Phase 1 checks — speed & correctness

Run this right after a fresh `npm run db:seed-test`, so the numbers match.

### Speed
- Dashboard, Reports, the Test Tower A page and a flat page each open in
  about a second or less, and no longer get slower as you add tenants.

### Expected numbers (landlord@example.com)

**Dashboard → Needs attention**
- 1 join request waiting.
- Flat A102 · Test Tower A — **27000.00** (half of 2 months ago + all of last month).
- Flat B101 · Test Tower B — **12000.00** (ended tenant's unpaid rent).
- A201 is **not** listed (its partial payment is for this month, which
  isn't overdue yet).

**Reports**
| Item | Expected |
|---|---|
| Flats | 7 total: 3 occupied, 3 vacant, 1 maintenance |
| Outstanding rent | **55000** (A102: 9000 + 18000 + this month 18000; A201: 10000) |
| Outstanding utility bills | **1500** |
| Revenue this month | **25000** |
| Revenue all time | **176000** (Tower A 152000, Tower B 24000) |

**Test Tower A page** → Outstanding Rent **55000.00 (2 flats)**.

**Flat A102** → 4 rent rows: this month PENDING (the app created it
automatically), last month OVERDUE (the app updated it automatically),
2 months ago PARTIAL, 3 months ago PAID.

### Fixes
1. **Payments record once:** on A102's last-month row, enter a partial
   amount (e.g. 5000) and click Confirm Payment several times quickly →
   a green "Payment recorded" message appears, the form closes, the row
   shows 5000 paid, and only **one** payment exists. Then pay the rest and
   try to pay 1 more → an error says it exceeds the remaining balance.
2. **Return after login:** log out, open
   `http://localhost:3000/dashboard/reports` → you're sent to login → after
   logging in you land on **Reports**, not the dashboard.
3. **Friendly 404:** open `http://localhost:3000/does-not-exist` → a
   "Page not found" page with a "Go home" button.
4. **Access code:** every building page shows an access code, and there is
   no "run the backfill script" message.
5. **Badges:** the landlord Requests badge shows 1 (before you approve
   anything); `partial@example.com` sees a Notices badge.

### Before deploying Phase 6 to Vercel

1. **(Recommended) Release only what passed the tests.** Vercel → your
   project → **Settings → Build and Deployment → Deployment Checks** →
   **Add Checks** → **GitHub** → select `Lint, types, unit tests, build`
   and `End-to-end suites` → **Save**. From then on a push still builds
   right away, but goes live only after both GitHub checks pass (about 6
   minutes).
2. Push and wait for the deploy. The build adds the new table for the
   daily numbers by itself.
3. Vercel → **Settings → Cron Jobs** now lists four jobs. Click **Run**
   next to `/api/cron/daily-stats` once: it fills in the last 90 days, so
   the trend charts on Reports → Insights show right away. Then **Run**
   next to `/api/cron/reset-demo`, so the demo gets its new data (tenants
   who pay on different days).

### Before deploying Phases 4 and 5 to Vercel

1. **Add the AI key.** Vercel → your project → **Settings → Environment
   Variables** → **Add New** → Key `GEMINI_API_KEY`, Value: your key from
   aistudio.google.com, Environments: **Production** and **Preview** →
   **Save**. As with `CRON_SECRET`, no line break after the value.
2. Push and wait for the deploy. The build applies the new database
   changes by itself (assistant usage, assistant changes, rate limits) —
   nothing to run by hand.
3. Vercel → **Settings → Cron Jobs** should now list three jobs:
   `/api/cron/bill-rent`, `/api/cron/reset-demo` and `/api/cron/cleanup`.
   Click **Run** next to `bill-rent` and `cleanup` once — each should
   finish without an error.

### Before deploying Phase 3 to Vercel

1. **Make a secret for the nightly reset.** In a terminal run
   `node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"`
   and copy the 64 characters it prints.
2. **Add it to Vercel.** Vercel → your project → **Settings → Environment
   Variables** → **Add New** → Key `CRON_SECRET`, Value: the characters you
   copied, Environment: **Production** → **Save**. Make sure the value
   has **no line break after it** (the cursor should stop right after the
   last character) — otherwise the deploy fails with "contains characters
   that are not valid in HTTP headers".
3. **Create the demo tenant on the live database.** With `.env` pointing
   at the live database, run `npm run db:seed-demo` once. (It rebuilds
   the demo landlord's data and adds `nusrat.demo@example.com`; without
   it "Try as tenant" can't sign in until the first nightly reset.)
4. Push and wait for the deploy. Then Vercel → **Settings → Cron Jobs**
   should list `/api/cron/reset-demo` (daily, `0 21 * * *` UTC =
   03:00 in Bangladesh). Click **Run** once — it should finish without an
   error.

### Before deploying Phase 1 to Vercel
1. Vercel → your project → **Settings → Environment Variables** → add
   `DIRECT_URL` (the **live** branch's direct URL) for Production and
   Preview. Check that `DATABASE_URL` there is the `-pooler` one.
2. Point your local `.env` at the live branch for one command:
   `npm run db:migrate` (only adds indexes — no data changes). Then switch
   `.env` back to the `testing` branch.
3. Deploy.
