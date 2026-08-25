# Project Memory

> This document is the permanent memory of LandLordLink.
>
> Read this document before starting development or beginning a new ChatGPT conversation.

---

# Project Information

## Project Name

LandLordLink

## Status

🟢 Active Development

## Repository

Private

## Current Branch

main

## Current Sprint

None — Phases 1–7 (the full original roadmap) are complete. Next work
comes from Future Enhancements, unsequenced (see Roadmap).

---

# Project Status

## Authentication

✅ Complete

## Dashboard

✅ Complete

## Building Module

✅ Complete

## Floors Module

✅ Complete

## Flats Module

✅ Complete

## Tenant Profiles

✅ Complete

## Join Requests

✅ Complete

## Architecture

✅ Architecture v2.0 (Frozen)

## Documentation

🚧 Updating to Version 2.0

## Lease Management

✅ Complete (open-ended leases — no Renewal/Expiration by design, see
Roadmap)

## Rent Management

✅ Complete

## Utility Bills

✅ Complete (first slice)

## Payment History

✅ Complete (first slice — feeds Rent/Utility Bill status, no
receipts/timeline view yet)

## Notices

✅ Complete (Building-scoped only, no Floor Notices; "Scheduled" means
auto-expiry, not future-publish — see Roadmap)

## Activity Logs

✅ Complete (representative instrumentation, not literally every
action — see Roadmap)

## Reports (Phase 6)

✅ Complete — now includes Analytics (Phase 7)'s charts on the same
page. There is no separate `/dashboard/analytics` route or sidebar
link; see the UX Simplification Pass note below

## Current Development

None — see Current Sprint above. All 7 original roadmap phases are
complete.

---

# Project Vision

Build LandLordLink, a modern, scalable, production-ready building management system that allows landlords to manage residential properties from a single dashboard while providing tenants with a structured and secure workflow.

The project should prioritize:

- Scalability
- Maintainability
- Readability
- Simplicity
- Long-term consistency

Production-quality architecture is always preferred over shortcuts.

---

# Project Philosophy

This project intentionally spends more time designing architecture so future development becomes easier.

Whenever information is missing:

> ASK.

Never guess.

Never silently redesign architecture.

Never rewrite working code unless there is a valid architectural reason.

---

# Technology Stack

## Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4

## Backend

- Server Actions

## Authentication

- Auth.js v5
- Credentials Provider
- JWT Strategy
- bcrypt

## Database

- PostgreSQL
- Prisma ORM

## Validation

- Zod

---

# Architecture Summary

The project follows a layered architecture.

```
Browser

↓

App Router

↓

React Components

↓

Server Actions

↓

Prisma ORM

↓

PostgreSQL
```

Business logic belongs inside Server Actions.

Validation belongs inside Zod.

Database access belongs inside Prisma.

UI components should never contain business logic.

Architecture v2.0 is considered frozen unless intentionally revised.

---

# Current Features

## Completed

### Authentication

- User Registration
- User Login
- Password Hashing
- JWT Authentication
- Session Management
- Protected Routes
- Route Protection
- Credentials Provider
- Zod Validation

### Dashboard

- Dashboard Layout
- Sidebar Navigation
- Header
- User Navigation

### Building Module

- Create Building
- Building List
- Building Details
- Edit Building
- Soft Delete Building
- Ownership Validation
- Reusable Building Form
- Server Actions
- Prisma Integration
- Zod Validation

### Floors Module

- Create Floor
- Bulk Create Floors
- Floor List
- Floor Details
- Edit Floor
- Soft Delete Floor
- Building Relationship
- Ownership Validation (via Building)
- Floor Ordering
- Floor Statistics
- Reusable Floor Form
- Server Actions
- Prisma Integration
- Zod Validation
- Breadcrumb Navigation
- Back Navigation

### Flats Module

- Create Flat
- Bulk Create Flats
- Flat List
- Flat Details
- Edit Flat
- Soft Delete Flat
- Floor Relationship
- Ownership Validation (via Floor → Building)
- Occupancy Status
- Rent Information
- Reusable Flat Form
- Server Actions
- Prisma Integration
- Zod Validation
- Breadcrumb Navigation
- Back Navigation

### Quick Setup

- Auto-generates a range of Floors and, per Floor, a range of Flats in a
  single transaction
- Flats numbered Floor × 100 + unit (e.g. Floor 3 → 301, 302...)
- Duplicate-safe: existing Floors/Flats are left untouched, gaps are filled
- Capped at 100 floors / 500 total flats per run
- Lives under `src/actions/quick-setup/`, since it spans Building, Floor,
  and Flat rather than belonging to a single entity

### Tenant Profiles

- Self-service Profile (Occupation, National ID, Emergency Contact)
- Profile Details (read-only) + Edit pages, matching the Details/Edit split
  used by every other entity
- New `(tenant)` route group — minimal layout (header only, no sidebar)
- Role-based redirect on login: Landlord → `/dashboard`, Tenant → `/tenant`
  (fixed a pre-existing bug where both roles redirected to `/dashboard`)
- Role-based route guarding in `proxy.ts`: Tenants blocked from `/dashboard`,
  Landlords blocked from `/tenant`
- Server Actions use the `useActionState` + inline-error pattern (matching
  Login/Register), not the plain-redirect pattern Building/Floor/Flat use —
  a deliberate choice since duplicate National ID needs to surface inline

### Join Requests

- Building Access Codes: a random code generated on Building creation
  (retried on unique-constraint collision), shown on the Building Details
  page, required by a Tenant to submit a request
- Tenant-facing flow: search Active buildings with vacant flats by name →
  view vacant flats in a building → submit a request with the Access Code
  and an optional message (blocked until the Tenant Profile is filled in)
- Landlord-facing flow: global Requests inbox (`/dashboard/requests`) and
  a per-Building inbox, both filterable by status via `StatusFilter`
- Approve marks the Flat `OCCUPIED` and auto-rejects any other pending
  requests for that same Flat, in one transaction
- End Tenancy (`JoinRequestStatus.ENDED`) marks the Flat `VACANT` again —
  distinct from `REJECTED`, since it closes out a tenancy that was actually
  approved and lived, not a request that never went anywhere
- Sidebar "Requests" link shows a live pending-count badge
- Lives under `src/actions/join-request/`, `src/components/join-request/`,
  since it spans Building, Flat, and TenantProfile rather than belonging to
  a single entity

### Lease Management

- Lease Creation is folded into Join Request approval, not a separate
  step — approving a request now opens an inline form (Start Date,
  Monthly Rent pre-filled from the Flat, optional Deposit) and creates the
  `Lease` row in the same transaction as the approval
  (`src/actions/join-request/approve-join-request.ts`,
  `src/lib/validations/lease.ts`)
- "End Tenancy" was renamed "End Lease"
  (`src/actions/join-request/end-lease.ts`,
  `src/components/join-request/end-lease-button.tsx`) — it now also closes
  the active `Lease` (`status: ENDED`, `endDate` set), not just the
  `JoinRequest` and Flat status
- The Flat Details page's "Current Tenant" card and the Tenant dashboard's
  "Your Current Flat" card both now read from the active `Lease` (start
  date, actual agreed rent, deposit) instead of approximating from the
  `JoinRequest`
- No dedicated Lease list/detail views or standalone `src/actions/lease/`
  folder — Lease is reached only through the Join Request workflow
- Leases are open-ended by design: no fixed end date, no Renewal, no
  Expiration. A tenancy runs until the Landlord ends it with "End Lease";
  the actual end date/term is negotiated verbally, not tracked upfront.
  This was an explicit decision, not an oversight — see `01_ROADMAP.md`

### Rent Management

- No scheduled job — this project has no background job runner. Instead,
  `src/lib/reconcile-rent.ts` backfills any missing `PENDING` Rent rows
  for an `ACTIVE` Lease (one per month since `Lease.startDate`, amount =
  the Lease's `monthlyRent`, due on the 1st) every time Rent data is read
  (`getRentsForLease`, `getOutstandingBalanceForBuilding`,
  `getTenantFlatView`) — `createMany` + `skipDuplicates: true`, the same
  pattern Floors/Flats bulk-create already uses
- A `PENDING` Rent becomes `OVERDUE` once the month it's due in has fully
  passed and it's still unpaid (not immediately on its due date — the
  Landlord/Tenant have the whole month)
- Rent moves to `PARTIAL`/`PAID` by recording a real payment through
  Payment History's `recordPayment` action — not a direct status flip
  (that was the original MVP shortcut; retrofitted once Payment History
  existed)
- Outstanding Balance shown on Flat Details (per-Lease Rent list) and
  Building Details (total + count of flats with unpaid rent)
- Tenants see their own Rent history (read-only) on their Flat Details
  page (`/tenant/flats/[flatId]`)
- No day-level proration — a billable month is always charged in full.
  Instead, a join-date cutoff (`getFirstBillableMonth` in
  `src/lib/rent.ts`) decides whether the join month is billable at all:
  joining on the 20th or earlier bills that whole month; joining after
  the 20th skips it, and the first Rent period is the following month

### Utility Bills

- Unlike Rent, nothing is auto-generated — utility amounts vary by
  actual usage, so a Landlord manually records each bill against an
  active Lease (`src/actions/utility-bill/create-utility-bill.ts`): type
  (the full `UtilityType` enum), billing month, amount, due date
- `UtilityBill` has no `status` column in the schema (unlike `Rent`) —
  its paid/unpaid state is always computed live from its `PaymentHistory`
  rows via `computePaymentStatus` (`src/lib/payment-status.ts`), never
  cached
- Shown on Flat Details (Landlord, with Record Payment) and the Tenant's
  own Flat page (read-only)

### Payment History

- Thin slice, built specifically to back Rent and Utility Bills' paid
  status rather than as a full ledger yet
- One shared action, `recordPayment` (`src/actions/payment/record-payment.ts`),
  handles payments against either a `Rent` or a `UtilityBill` — it
  creates the `PaymentHistory` row, validates the amount doesn't exceed
  the remaining balance (so partial payments are supported and can't
  overpay), and — only for `Rent`, since only `Rent` has a `status`
  column to update — flips it to `PARTIAL` or `PAID`
- `BillingTable` + `RecordPaymentButton`
  (`src/components/billing/`) are the shared UI for both Rent and
  Utility Bills, since they're now structurally identical: a labeled
  period, an amount, a due date, a computed/cached status, and a
  Record Payment action
- Not yet built: a receipts view, or a cross-Lease payment timeline —
  payments are currently only visible per Rent/Utility Bill row on Flat
  Details

### Notices

- Building-scoped only — the `Notice` model has no `floorId`, and
  adding one wasn't worth a migration for this first slice, so Floor
  Notices from the original roadmap wording were dropped
- "Scheduled Notices" was reinterpreted as auto-expiry: the schema has
  `expiresAt` (no future-publish column), so a notice is visible from
  creation until its optional expiry date
- Audience targeting via the existing `NoticeAudience` enum (`ALL` /
  `TENANTS` / `LANDLORDS`) — a Tenant only sees `ALL`/`TENANTS` notices,
  scoped to Buildings where they currently hold an `ACTIVE` Lease
  (`src/actions/notice/get-active-notices-for-tenant.ts`)
- Landlord CRUD lives at `/dashboard/buildings/[id]/notices` — the list
  page doubles as the "details" view (each card shows full content, an
  Active/Expired badge, Edit/Delete) since a notice has no nested
  content that would justify a separate details route
- Hard delete, not soft — `Notice` has no `deletedAt` column in the
  schema, unlike Building/Floor/Flat
- Tenant-facing read-only view at `/tenant/notices`, linked from the
  tenant nav
- Unread badge on the tenant nav's "Notices" link — real unread
  tracking, not just an active-notice count. `TenantProfile` gained a
  `lastNoticesViewedAt` column (migration); the badge counts active
  notices created after that timestamp
  (`src/actions/notice/get-unread-notice-count.ts`), and it's cleared by
  `MarkNoticesViewed` (`src/components/notice/mark-notices-viewed.tsx`)
  — a client component that fires only on real mount via `useEffect`,
  not on a `<Link>` prefetch, so hovering the nav link doesn't silently
  clear the badge before the tenant actually opens the page

### Activity Logs

- `ActivityLog` gained a `buildingId` column (migration) — the model
  originally only had `userId` (the actor), which couldn't answer
  "what happened in this building" when the actor was a Tenant (e.g. a
  Join Request), only "what did this specific user do"
- `src/lib/log-activity.ts` is a plain helper (not a server action),
  called directly from within existing server actions right before
  they return — not a generic middleware/wrapper, so each call site
  states its own action/entity/description explicitly
- Instrumented: Login (via `events.signIn` in `src/auth.config.ts`,
  since `loginUser` itself can't observe success — `signIn()` redirects
  before returning), Register, Building create/update/delete, Floor/
  Flat create/delete, Join Request create/approve/reject, End Lease,
  Notice create/update/delete, recording a Rent/Utility payment, and
  adding a Utility Bill. This is representative coverage, chosen to
  match the original roadmap examples (Login, Building Created/Deleted,
  Lease Approved, Payment Recorded) extended to this project's actual
  entities — not literally every mutating action in the app
- Two Landlord-facing views, not a Tenant-facing one — this is an
  oversight/audit feature: `/dashboard/buildings/[id]/activity`
  (strictly building-scoped) and `/dashboard/activity` (global — a
  Landlord's own actions, including buildingless ones like Login, plus
  everything that happened across every building they own, regardless
  of actor)

### Reports (Phase 6)

- One page (`/dashboard/reports`, linked from the sidebar), not a
  separate route per report category and not a per-building
  `/dashboard/buildings/[id]/reports` route — the "Building
  Statistics" table on this one page covers that need
- Everything comes from one action,
  `src/actions/report/get-portfolio-report.ts` — no new models or
  migrations, since Rent, Utility Bills, Payment History, and Join
  Requests were already collecting every number this phase needed
- Occupancy (Vacant/Occupied/Maintenance + rate), Revenue (all-time +
  this month, from `PaymentHistory`), Outstanding (Rent + Utility
  Bills), and a 6-month Due-vs-Collected table — each shown
  portfolio-wide and broken down per building in the same table
- "Collected" in the monthly table is whatever was paid *in* that
  calendar month, not necessarily *for* that month's rent — stated
  directly on the page, since a tenant catching up on a past-due month
  makes those two numbers genuinely different
- Fixed a real bug found while building this: `getOutstandingBalanceForBuilding`
  (Building Details' "Outstanding Rent" figure) was counting a
  `PARTIAL` Rent's full `amount`, not its remaining balance after the
  payment already made — now subtracts `payments` before summing,
  everywhere this number is shown

### Analytics (Phase 7)

- No charting library added — every chart is hand-built inline SVG/
  HTML (`src/components/analytics/`). Categorical colors come from
  `src/lib/chart-colors.ts`, the first three slots of a CVD-validated
  reference palette — the project's own `--chart-1..5` CSS tokens are
  still unthemed grayscale placeholders (identical gray in light and
  dark mode), not real hues, so they weren't usable as-is
- Occupancy: a 3-segment stacked bar (Occupied/Vacant/Maintenance),
  not a donut — part-to-whole comparisons are a bar per the dataviz
  method, donuts are reserved for at-a-glance-only cases
- Revenue Trend: single-series line + 10%-opacity area fill, one hue,
  no legend (a single series doesn't need one)
- Building Performance: two ranked horizontal-bar lists (Revenue,
  Occupancy Rate) — one flat hue per bar, deliberately not a
  value-ramp (darker = bigger), since building names are a nominal
  category with no natural order to encode in lightness
- **Merged into Reports** shortly after shipping — see the UX
  Simplification Pass note immediately below. `/dashboard/analytics`
  no longer exists; these charts now live on `/dashboard/reports`

### UX Simplification Pass

Prompted by direct feedback that the app had accumulated too many
pages and too many buttons per page to feel simple. Three concrete
changes, no functionality removed:

- **Reports + Analytics merged into one page** (`/dashboard/reports`).
  They showed the exact same `getPortfolioReport` data — one as
  tables, one as charts — as two separate sidebar destinations. Now
  one page has both; the Analytics route and sidebar link are gone
- **Building Details' button row cut from 7 to 3.** Quick Setup, Edit
  Building, and Delete Building remain as buttons; Requests, Notices,
  and Activity moved into the Overview card as clickable stat tiles
  (a label + a linked value — Requests turns red with a "N pending"
  count when something needs a decision), alongside the Floors and
  Outstanding Rent stats that already lived there.
  `getPendingJoinRequestsCount` gained an optional `buildingId` filter
  to support the per-building pending count
- **The main Dashboard became a "Needs Attention" hub** instead of a
  second copy of the Reports charts. New action
  `src/actions/report/get-needs-attention.ts` surfaces pending Join
  Requests and flats with `OVERDUE` rent (aggregated across all
  payments already made on that Rent, so it's the true remaining
  balance, not the original amount) — each with a direct one-click
  link to the exact request or flat, instead of the previous
  Buildings → Floors → Flats → Flat drill

Deliberately not changed in this pass: Flat Details' card stack
(Overview/Current Tenant/Rent/Utility Bills/Request History) and the
inline expanding forms (Approve, Record Payment, Add Utility Bill) —
each card is necessary content, not accidental clutter, and collapsing
them would trade a scan-once density problem for a click-to-expand
one. The tenant-facing side (5 nav items, mostly single-purpose pages)
wasn't touched — it didn't show the same symptoms as the landlord side.

Two follow-ups from user feedback on the first version of this pass:

- **Stat tiles didn't visually read as clickable** — a plain text
  link doesn't look like a button. Added `src/components/ui/stat-tile.tsx`:
  a linked stat renders as a bordered, padded box with a hover
  highlight; a non-linked stat (Status, Occupied, Vacant) stays flat
  text with no border — so clickable vs. informational is visible at
  a glance, not just discoverable by hovering everything. Applied to
  both Building Details and Floor Details (which had the identical
  "Total Flats" plain-text-link pattern)
- **Removed the "Tenants" and "Payments" sidebar placeholders.** Both
  said "Soon" since the very first commit, before Join Requests, Rent,
  Utility Bills, or Payment History existed. That functionality has
  since been built — just distributed per-flat (Current Tenant card,
  Rent/Utility Bills cards) rather than as a dedicated top-level page —
  so the placeholders were stale, implying unbuilt features that
  actually exist elsewhere. No dedicated Tenants/Payments list page
  exists; building one would be new scope, not a fix

### Demo Data

`prisma/seed-demo-landlord.ts` — purely additive, unlike `prisma/seed.ts`
(which wipes all tables first). Creates one new demo landlord
(`farhan.ahmed@example.com` / `password123`), 3 buildings, 36 flats (24
occupied / 9 vacant / 3 maintenance), 24 leases with realistic staggered
start dates, ~150 rent/utility payments, a handful of deliberately
overdue rent periods (consistent with the app's own "current month is
never overdue" rule — only past, fully-elapsed months are), pending and
rejected join requests, notices, and backdated activity log entries.
Refuses to run a second time if that email already exists, rather than
creating duplicates — delete the user (cascades) first for a fresh run.

---

# Planned Modules

None from the original roadmap — Phases 1–7 are all complete. Future
work comes from Future Enhancements in `01_ROADMAP.md` (search,
filtering, file uploads, notifications, RBAC, multi-tenant, etc.),
which are explicitly unsequenced.

---

# Current Folder Structure

```
docs/

prisma/

public/

src/
    actions/
    app/
    components/
    lib/
    types/

README.md

package.json
```

The complete folder explanation lives inside

```
docs/02_ARCHITECTURE.md
```

---

# Database

Current database models include

- User
- Building
- Floor
- Flat
- TenantProfile
- Lease
- JoinRequest
- Rent
- UtilityBill
- PaymentHistory
- Notice
- ActivityLog

Complete schema documentation lives in

```
docs/03_DATABASE.md
```

---

# Current Routing

Public

```
/
```

```
/login
```

```
/register
```

Protected (Landlord)

```
/dashboard
```

```
/dashboard/buildings
```

```
/dashboard/buildings/new
```

```
/dashboard/buildings/[id]
```

```
/dashboard/buildings/[id]/edit
```

```
/dashboard/buildings/[id]/quick-setup
```

```
/dashboard/buildings/[id]/floors
```

```
/dashboard/buildings/[id]/floors/new
```

```
/dashboard/buildings/[id]/floors/[floorId]
```

```
/dashboard/buildings/[id]/floors/[floorId]/edit
```

```
/dashboard/buildings/[id]/floors/[floorId]/flats
```

```
/dashboard/buildings/[id]/floors/[floorId]/flats/new
```

```
/dashboard/buildings/[id]/floors/[floorId]/flats/[flatId]
```

```
/dashboard/buildings/[id]/floors/[floorId]/flats/[flatId]/edit
```

```
/dashboard/requests
```

```
/dashboard/buildings/[id]/requests
```

```
/dashboard/buildings/[id]/notices
```

```
/dashboard/buildings/[id]/notices/new
```

```
/dashboard/buildings/[id]/notices/[noticeId]/edit
```

```
/dashboard/activity
```

```
/dashboard/buildings/[id]/activity
```

```
/dashboard/reports
```

Protected (Tenant)

```
/tenant
```

```
/tenant/profile
```

```
/tenant/profile/edit
```

```
/tenant/buildings
```

```
/tenant/buildings/[id]/flats
```

```
/tenant/flats/[flatId]
```

```
/tenant/flats/[flatId]/request
```

```
/tenant/requests
```

```
/tenant/notices
```

`proxy.ts` enforces this split — a Tenant hitting any `/dashboard/*` route
is redirected to `/tenant`, and a Landlord hitting `/tenant/*` is redirected
to `/dashboard`.

Authentication

```
/api/auth/*
```

Future modules should follow the same routing pattern.

---

# Development Principles

The project follows these principles.

- TypeScript everywhere
- Prisma for database access
- Auth.js for authentication
- Zod for validation
- Server Actions for internal CRUD
- API Routes only when required by external libraries or integrations
- Reusable UI components
- No duplicated business logic
- Soft Delete over hard delete where appropriate
- Ownership validation for protected resources

---

# Documentation

Documentation is considered part of the project.

A feature is not complete until the documentation has been updated.

Current documentation

```
00_PROJECT_MEMORY.md
```

Project overview

```
01_ROADMAP.md
```

Development roadmap

```
02_ARCHITECTURE.md
```

Architecture

```
03_DATABASE.md
```

Database schema

```
04_CHANGELOG.md
```

Project history

```
05_CONVENTIONS.md
```

Coding conventions

```
06_NAVIGATION_UX.md
```

Navigation and breadcrumb design

---

# Current Environment Variables

Required

```
DATABASE_URL
```

```
AUTH_SECRET
```

Whenever a new environment variable is introduced, document it here.

---

# Development Workflow

Every feature follows the same workflow.

1. Design
2. Discuss architecture
3. Implement
4. Test
5. Refactor
6. Update documentation
7. Commit

Documentation is considered part of the implementation.

---

# Working Agreement

Whenever ChatGPT is uncertain about

- project structure
- implementation
- architecture
- existing code

it should request the relevant file instead of making assumptions.

Correctness is preferred over speed.

---

# Next Goal

None committed — this is intentionally the end of active development
for now. Phases 1–7 (the full original roadmap) and the UX
Simplification Pass are complete: Authentication, Buildings/Floors/
Flats, Tenant Profiles, Join Requests, Lease Management, Rent
Management, Utility Bills, Payment History, Notices, Activity Logs,
Reports, and Analytics.

`01_ROADMAP.md`'s Future Enhancements section now carries prioritized
recommendations (not commitments) for whenever work picks back up —
image uploads and search/filtering flagged as the lowest-effort/
highest-value starting points, email notifications as the biggest
real functional gap, RBAC/multi-tenant flagged as structural changes
needing a design conversation first, not a checkbox. Ask before
picking one rather than assuming.

Future modules should reuse the same architecture and development patterns
introduced by the Building, Floors, Flats, Tenant Profile, Join Request,
Lease, Rent Management, Utility Bills, Payment History, Notices,
Activity Logs, Reports, and Analytics modules —
including baking in breadcrumb and
back navigation from the start, and routing new Tenant-facing pages under
the `(tenant)` route group rather than `(landlord)`.

---

# Long-Term Goal

Develop LandLordLink into a complete production-ready building management system while maintaining a clean, scalable, and consistent architecture across every module.

This document should always represent the current state of the repository.