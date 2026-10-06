# LandlordLink

A modern, production-ready building management system built with Next.js, Prisma, PostgreSQL and Auth.js.

LandlordLink lets landlords manage buildings, floors, flats, tenants, leases, rent collection, utility bills, notices, activity logs, and reports through a secure web application — and gives tenants a structured, secure way to find a flat, request to join, and track their own lease and payments.

---

## Project Status

Current Stage

🟢 Active Development

All 7 phases of the original roadmap are complete, followed by a UX
simplification pass. See `docs/01_ROADMAP.md` for what's next
(Future Enhancements — unsequenced).

---

## Features

### Authentication

- User Registration
- User Login
- Password Hashing (bcrypt)
- JWT Authentication
- Protected Routes
- Session Management
- Role-based Authentication (Landlord / Tenant)
- Server Actions
- Zod Validation

### Building Management

- Building, Floor, and Flat CRUD
- Quick Setup (bulk-generate floors + flats in one transaction)
- Building Access Codes

### Tenant Management

- Tenant Profiles
- Join Requests (search, request, approve/reject, end lease)
- Lease Management (open-ended — no fixed term)

### Finance

- Rent Management (auto-generated per month, status tracking)
- Utility Bills
- Payment History (partial payments supported)
- Reports (occupancy, revenue, outstanding balances, monthly trends)
- Analytics charts (folded into Reports)

### Communication

- Notices (building-scoped, audience-targeted, auto-expiring)
- Unread notice badge for tenants

### Monitoring

- Activity Logs (building-scoped + a global landlord feed)

### AI assistant (landlords)

- "Ask AI" panel on every landlord page: ask about rent, dues, flats,
  requests, notices and activity in English or Bangla
- Answers come from the landlord's own data through lookups scoped to
  their buildings; contact details and national IDs are never sent to the
  model
- Makes changes too — record a payment (split over the oldest unpaid
  months when it covers several), approve or reject a request, post a
  notice — but only prepares them: the landlord sees the exact details in
  a confirmation popup, and the change runs once, through the app's own
  server actions, only after they confirm (`AssistantAction`)
- Google Gemini (free tier) behind a small provider interface; falls back
  to the next model when one is busy
- Daily message limit per landlord

---

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4

### Backend

- Server Actions
- Auth.js v5

### Database

- PostgreSQL
- Prisma ORM

### Validation

- Zod

### Authentication

- Auth.js
- JWT
- bcrypt

---

## Project Structure

See

```

docs/02_ARCHITECTURE.md

```

for the complete project architecture.

---

## Documentation

Project documentation is available inside the `docs/` directory.

- Project Memory
- Roadmap
- Architecture
- Database
- Changelog
- Conventions
- Navigation & UX

---

## Installation

Install dependencies

```bash
npm install
```

Generate Prisma Client

```bash
npx prisma generate
```

Run migrations

```bash
npx prisma migrate dev
```

Start development server

```bash
npm run dev
```

### Public demo

The landing page has **Try as landlord** and **Try as tenant** buttons that
sign visitors in to two shared demo accounts (password `11111111`):

| Account | Email |
|---|---|
| Demo landlord | `farhan.ahmed@example.com` — 3 buildings, 26 tenants, months of rent history, requests, past dues |
| Demo tenant | `nusrat.demo@example.com` — lives in Green Valley Apartments, flat 203 |

Create or rebuild the demo data with:

```bash
npm run db:seed-demo
```

On Vercel the demo also rebuilds itself every night at 03:00 Bangladesh
time (`crons` in `vercel.json` → `/api/cron/reset-demo`), so visitors'
changes disappear and dates stay current. Only demo data is touched: the
demo landlord's buildings, the two demo accounts (which keep their IDs, so
signed-in visitors stay signed in) and the generated tenants on
`@demo.example.com`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill it in:

```env
# Neon pooled connection (host contains "-pooler") — used by the app
DATABASE_URL=
# Neon direct connection (same, without "-pooler") — used by prisma migrate
DIRECT_URL=
AUTH_SECRET=
# Any long random string; Vercel Cron sends it to /api/cron/reset-demo
CRON_SECRET=
# AI assistant — free key from https://aistudio.google.com ("Get API key")
GEMINI_API_KEY=
```

Optional settings for the assistant:

| Variable | Default | What it does |
|---|---|---|
| `GEMINI_MODEL` | `gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-3.8-flash` | Models to try, in order; the next one answers when one is busy |
| `ASSISTANT_DAILY_LIMIT` | `50` | Messages per landlord per day |
| `ASSISTANT_DEMO_DAILY_LIMIT` | `100` | Messages per day for the shared demo landlord |

Without `GEMINI_API_KEY` the app works as usual and the assistant says it
isn't set up. On Gemini's free tier Google may use the messages to improve
its products — fine for a demo; use a paid key for real tenants' data.

### Neon performance notes

- **Region:** create the Neon project in the same region as the app
  server (e.g. Vercel functions and Neon both in Singapore,
  `ap-southeast-1`). A region mismatch adds latency to *every* query.
- **Pooled URL:** always use the `-pooler` host for `DATABASE_URL`.
- **Cold starts:** Neon's free tier suspends the database after ~5
  minutes idle; the first request after that takes ~0.5–1s extra. On a
  paid plan you can disable scale-to-zero.

Apply migrations with `npm run db:migrate`.

### Vercel

The Vercel project's build command is `prisma migrate deploy && next build`,
so every deploy applies pending migrations first. That is why Vercel needs
`DATABASE_URL`, `DIRECT_URL` and `AUTH_SECRET` for Production and
Preview. Without `DIRECT_URL` the build fails with
`Environment variable not found: DIRECT_URL`.

For the AI assistant add `GEMINI_API_KEY` (Production and Preview).

It also needs `CRON_SECRET` (Production) for the nightly demo reset:
Vercel sends it with every cron call, and the endpoint refuses calls
without it. You can run the reset by hand under **Settings → Cron Jobs →
Run**.

`vercel.json` pins the app's functions to Singapore (`sin1`), next to the
Neon database.

---

## Development Philosophy

This project prioritizes:

- Clean Architecture
- Production-ready code
- Reusable Components
- Type Safety
- Scalability
- Maintainability

---

## License

Private project.
