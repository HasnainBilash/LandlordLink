# Upgrade Plan (v2 → production-ready)

> Work is done in large phases. Each phase ends with a commit and a
> **test checklist** for the owner. The next phase starts only after the
> owner has tested and approved the previous one.
>
> Phases 1–2 fixed what existed. Phase 3 made it look the part and added a
> public demo; Phase 4 adds an AI assistant; Phase 5 makes it production
> grade. Other new features (receipts, reminders, bKash, maintenance
> requests, …) are discussed after Phase 5.

Context: database is **Neon**, slowness observed in the **production build**.

---

## Phase 1 — Speed & Correctness (no visible redesign)

Goal: every page loads fast, data is correct, nothing is broken.
Page layout and navigation stay exactly as they are, so any difference
the owner notices should be speed only.

### Performance
- [x] Rent reconciliation: replace "3 queries per lease, on every page
      view" with a bulk version (≈3 queries total, regardless of lease
      count). Used by Reports, Building page, Flat page, Tenant flat view.
- [x] Reports: compute revenue / outstanding / monthly totals in the
      database (aggregates) instead of loading every payment ever made.
- [x] `auth()` deduplicated per request with React `cache()`.
- [x] Sidebar and tenant-nav badge counts stream in via `<Suspense>`, so
      they no longer block every page.
- [x] Independent queries run in parallel (`Promise.all`); count-only
      data uses `_count` instead of loading whole lists.
- [x] New composite indexes (Rent, Lease, JoinRequest, Notice).
- [x] Neon: pooled connection string for the app, direct one for
      migrations (`DIRECT_URL`); region guidance in README.

### Bug fixes
- [x] Payments recorded inside a transaction (no double-pay on fast clicks).
- [x] Login respects `callbackUrl` (returns to the page you came from).
- [x] Auth route moved to the standard `/api/auth/[...nextauth]`.
- [x] Proxy no longer runs on static files in `/public`.
- [x] `npm run lint` works on Next 16; dev-only packages moved to devDependencies.
- [x] `error.tsx` and `not-found.tsx` (friendly error pages).
- [x] Remove developer-only text shown to users (backfill script note);
      buildings without an access code now get one automatically.
- [x] `npm run build` and `tsc` pass with zero errors.

### Also fixed (found while working)
- [x] "Needs attention" now refreshes rent status first, and also lists
      partly-paid rent from past months (it used to miss both).
- [x] Floor count on the building page no longer counts deleted floors.
- [x] `prisma/seed.ts` (wipes the whole DB) now refuses to run unless
      `ALLOW_DB_WIPE=yes`; `prisma db seed` points at the safe test seed.

**How to test:** see [TESTING.md](TESTING.md) (test accounts, every-time
checks, Phase 1 checks).

---

## Phase 2 — Simpler Structure & UI

Goal: fewer pages, fewer clicks, works on a phone.

- [x] Building page is the hub, with tabs: Floors & flats · Requests ·
      Notices · Activity. Floors are sections with their flats as tiles
      (tenant name, rent, overdue flag). Floor and floor-flats pages are gone.
- [x] Flat page at a short URL: `/dashboard/flats/[id]`.
- [x] Create/edit for buildings, floors, flats, notices, payments, bills
      and lease approval open in dialogs; deletes and other one-click
      actions use a confirmation dialog. Every form shows its errors.
- [x] Landlord nav: Home · Buildings · Requests · Reports (Activity lives
      in Reports and in each building).
- [x] Home combines "Needs attention" with the key report numbers.
- [x] Tenant area: Home (my flat, what I owe, notices) · Find a flat ·
      My requests · Profile. Tenants can jump to a building by its access
      code; the request dialog pre-fills it.
- [x] Mobile layout: slide-out menu, stacked cards, scrolling tables.
- [x] Money via one `formatMoney()` helper (৳, lakh grouping); dates via
      `formatDate()` in Asia/Dhaka.
- [x] No `<Link><Button>` nesting (`ButtonLink` component).
- [x] Old URLs redirect to the new ones (next.config.ts).
- [x] Past dues: unpaid rent/bills of ended leases are kept and listed
      under Reports → Past dues, where the landlord records late payments
      or writes the balance off (RentStatus WRITTEN_OFF,
      UtilityBill.writtenOffAt).

Pages: landlord 22 → 6, tenant 9 → 6.

### Also fixed in Phase 2

- [x] **Security:** the flat page sent each requesting tenant's full user
      row — including the password hash — to the browser. Tenant queries
      now select only name/email; building queries never send the access
      code to tenants.
- [x] A flat, floor or building with an active lease can no longer be
      deleted (it left leases and rent attached to deleted flats). Deleting
      also declines pending requests and takes floors/flats with it.
- [x] A deleted floor or flat number can be reused right away (it used to
      say "already in use" forever).
- [x] Form validation errors were silently thrown away on most create and
      edit pages; they now show next to the field.
- [x] Approving two requests for the same flat at the same time could
      create two active leases; approval now locks the flat.
- [x] Flat status can't be set to Occupied by hand (or changed while
      leased) — it follows the lease.
- [x] Quick setup could add flats to deleted floors and ran one query per
      floor inside a transaction (timeouts on big buildings); now bulk.
- [x] Tenants had to "complete" an all-optional profile before
      requesting; the profile is created automatically now.
- [x] Broken "Browse Flats" link on the request page (went to a 404).
- [x] The font was never applied (a CSS variable referenced itself), so
      the app rendered in the browser's default serif font.
- [x] Flat numbers sort naturally (2 before 10).
- [x] Dates no longer depend on the server's or browser's locale.
- [x] Demo seed uses realistic taka rents.

---

## Phase 3 — Modern Design & Public Demo

Goal: a site people call good-looking, and a demo anyone (e.g. an
interviewer) can open in one click.

- [x] Design system: deep-blue brand on cool neutrals, light and dark mode
      (follows the device; the toggle is remembered), shared panels, icon
      chips and coloured initials avatars, bigger touch targets
      (36px buttons and inputs).
- [x] Public landing page at `/` (product preview, features, how it works,
      tenant section); signed-in users go straight to their home.
- [x] One-click demo: "Try as landlord" / "Try as tenant" on the landing,
      login and register pages, and a demo banner inside the app.
- [x] Every page restyled: landlord home (collection banner, stats, needs
      attention), buildings, building tabs, flat page, requests, reports
      (charts follow the theme), past dues, an activity timeline grouped by
      day; tenant home, find a flat, flat, requests, profile; dialogs;
      404 and error pages.
- [x] Nightly demo reset: Vercel Cron calls `/api/cron/reset-demo` at
      03:00 Bangladesh time (protected by `CRON_SECRET`). The demo is
      rebuilt in one transaction, relative to today; the two public demo
      accounts keep their IDs, so anyone signed in stays signed in.
      `npm run db:seed-demo` runs the same code on demand.
- [x] Demo data shows every feature: former tenants with past dues,
      pending and rejected requests, partly paid rent, new and expired
      notices.

### Also fixed in Phase 3

- [x] On phones, card grids could be wider than the screen (the page
      scrolled sideways); grids now have explicit columns.
- [x] Reports page threw a hydration error (chart tooltip titles).
- [x] The number in red count badges inherited a grey text colour.
- [x] Demo data no longer has payments or requests dated in the future;
      generated demo tenants use a reserved demo email domain and no
      national ID, so a reset can never clash with real accounts.
- [x] Activity log shows sign-ins as "Signed in." instead of "Signed in User".

---

## Phase 4 — AI Assistant (landlords only)

Goal: a chat where the landlord types a task ("record 12,000 rent for flat
203", "who owes me money?"); the assistant reads the data it needs and, for
anything that changes data, shows a confirmation popup before doing it.

**Part A — answers questions (read-only)**
- [x] Provider: Gemini free tier behind a small provider interface
      (`src/lib/ai`); models tried in order, the next one answers when one
      is busy, rate limited or retired.
- [x] Read tools: overview, who owes (this month vs earlier), find tenant,
      flat details, flats, requests, past dues, notices, recent activity.
      All scoped to the signed-in landlord by name/number, never by ID.
- [x] "Ask AI" side panel on every landlord page; English or Bangla.
- [x] Data minimisation (no NIDs, phone numbers or emails sent);
      daily message limit per landlord (`AssistantUsage` table).

**Part B — makes changes, with confirmation**
- [x] Write tools: record payment, approve request, reject request, post
      notice. They only prepare a change (`AssistantAction`, pending for
      15 minutes); the landlord confirms it in a popup.
- [x] Confirming runs the app's own server action (same checks, same
      activity log), exactly once — claiming the change is one atomic
      update, so double clicks and replays are refused.
- [x] A payment without a month is split over the oldest unpaid months.
- [x] Chat opens at the latest message, with a "jump to latest" button.

---

## Phase 5 — Production Hardening

Goal: safe to deploy and maintain.

- [x] Speed: rent is billed by a nightly job (`/api/cron/bill-rent`, just
      after a new rent month starts) and when a lease starts. Pages that
      show rent now run one round of read queries as a safety net — before,
      three queries one after another, one of them a write, on every view.
      The remaining slow first request is Neon's free tier waking up
      (README → Neon notes).
- [x] Settings validated at startup (`src/lib/env.ts`): the server stops
      with a list of what's missing or malformed.
- [x] Rate limits stored in Postgres, shared by all serverless instances:
      wrong passwords per email and network, sign-ins per network, sign-ups
      per network, join requests per tenant, assistant messages per minute.
- [x] Sign-in takes as long for unknown emails as for wrong passwords (no
      account discovery); bcrypt cost 12; emails stored in lowercase;
      input length limits.
- [x] Unit tests (Vitest): rent months, payment status, money and dates,
      the assistant's month parsing, tool loop and model fallback, cron
      auth, settings check, rate-limit helpers.
- [x] End-to-end tests (`npm run test:e2e`): a throwaway PGlite database
      with the real migrations, a production build, and 8 suites — read
      paths, landlord flows (register, login, buildings, approve tenant,
      record payment, …), more flows, assistant, security, demo reset,
      phone layout, rent billing.
- [x] GitHub Actions CI: lint, typecheck, unit tests, build, then the
      end-to-end suites.
- [x] Security headers: Content Security Policy with a fresh nonce per
      request, HSTS, nosniff, X-Frame-Options, Referrer-Policy,
      Permissions-Policy, COOP; no X-Powered-By. Scheduled jobs check
      `CRON_SECRET` in constant time.
- [x] Error monitoring hook: every server error is logged as one JSON line
      (`onRequestError` in `src/instrumentation.ts`, where Sentry would
      plug in); a global error page for crashes in the root layout.
- [x] Nightly cleanup of expired rate-limit counters and old assistant data.
- [x] Next.js 16.3.8 and Auth.js beta.32 (published security advisories).
- [x] README: setup, Neon, deploy, demo accounts, security, scheduled
      jobs, testing, screenshots.

### Also fixed in Phase 5

- [x] The assistant didn't understand "Sept 2026" (the app's own
      abbreviation) as a month — found by the new unit tests.
- [x] Approving a request now bills the new lease's rent right away.

---

## Phase 6 — Insights & Delivery

Goal: help landlords understand their numbers — who owes and for how
long, who pays late, what empty flats cost, what's coming in — and make
every release safe: a new version goes live only after the tests pass.

Decided against for now: **Redis**. Rate limits already work in Postgres,
each landlord's data is small, and caching money figures risks showing
stale numbers. Worth adding for a job queue (SMS/email reminders) or much
more traffic — Upstash Redis on Vercel, behind the existing `rateLimit()`.

**Part A — CI/CD**
- [x] CI green again: a browser test that was timing-sensitive (two tab
      panels on the page for a moment) is fixed; failures show more detail.
- [x] Failing end-to-end checks appear as annotations on the GitHub run,
      readable without opening the logs.
- [x] GitHub actions updated to current versions (Node 24).
- [x] `/api/health` for uptime monitors (no database query) and
      `/api/health?check=db` to check a deploy's database connection.
- [ ] Owner: Vercel Deployment Checks, so production deploys go live only
      after both CI jobs pass (README → Deploying).

**Part B — Data analysis: an Insights tab in Reports**
- [x] Arrears aging: what's owed, split by how long it's overdue, per tenant
      (tenants who only owe this month's rent summed in one line).
- [x] Payment punctuality per tenant: months paid on time, usual payment
      day, a rating (reliable, sometimes late, often late, new tenant).
- [x] Collection rate per rent month, last 12 months.
- [x] Vacancies: days empty and rent missed; average time to re-let a flat.
- [x] Rent forecast for the next 3 months, from current leases and the
      recent collection rate.
- [x] The assistant can answer these questions (`get_insights`).
- [x] The calculations are plain functions with unit tests
      (`src/lib/insights.ts`); a browser suite checks every number.
- [x] Demo tenants pay on different days and some pay late; demo and test
      flats have realistic dates.

**Part C — Data pipeline**
- [x] Nightly snapshot of every building (flats, occupied flats, money
      owed, money received) in a `BuildingDailyStat` table, by Bangladesh
      day (`/api/cron/daily-stats`, an hour after rent billing). Days are
      computed from the lease and payment history, so missed days are
      rebuilt; the demo reset and the test seed rebuild 90 days.
- [x] "Owed, day by day" and "Occupancy, day by day" charts.
- [x] CSV downloads: rent roll, payments, what's owed — safe against
      formula injection.

---

## After Phase 6

Discuss and plan new features (separate plan).
