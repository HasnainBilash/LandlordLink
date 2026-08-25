# Project Roadmap

> This roadmap tracks the long-term development of LandlordLink.
>
> Items move from **Planned → In Progress → Completed**.
>
> This document reflects project direction rather than implementation details.

---

# Project Goal

Build LandlordLink, a production-ready building management system, using modern architecture, scalable design, and consistent development practices.

The project is developed module by module, with each module completed before moving to the next.

---

# Development Progress

## Phase 1 — Foundation

### Authentication

Status

✅ Completed

Features

- User Registration
- User Login
- Password Hashing
- Auth.js Integration
- JWT Sessions
- Protected Routes
- Route Middleware (proxy.ts)
- Zod Validation
- Prisma Integration

---

### Dashboard

Status

✅ Completed

Features

- Dashboard Layout
- Sidebar
- Header
- User Navigation
- Protected Dashboard

---

## Phase 2 — Core Property Management

### Building Module

Status

✅ Completed

Features

- Create Building
- Building List
- Building Details
- Edit Building
- Soft Delete
- Ownership Validation
- Zod Validation
- Reusable Building Form
- Server Actions
- Prisma Integration

---

### Floors Module

Status

✅ Completed

Features

- Floor List
- Create Floor
- Bulk Create Floors (range-based, duplicate-safe)
- Floor Details
- Edit Floor
- Soft Delete
- Building Relationship
- Floor Ordering
- Floor Statistics
- Breadcrumb Navigation
- Back Navigation

---

### Flats Module

Status

✅ Completed

Features

- Flat List
- Create Flat
- Bulk Create Flats (numeric range, duplicate-safe)
- Flat Details
- Edit Flat
- Soft Delete
- Floor Assignment
- Occupancy Status
- Rent Information
- Quick Setup (auto-generate floors + flats for a whole building in one step)
- Breadcrumb Navigation
- Back Navigation

---

## Phase 3 — Tenant Management

### Tenant Profiles

Status

✅ Completed

Features

- Tenant self-service Profile (Occupation, National ID, Emergency Contact)
- Tenant-facing route group (`(tenant)`), separate from the Landlord dashboard
- Role-based redirect on login (Landlord → `/dashboard`, Tenant → `/tenant`)
- Role-based route guarding (Tenant blocked from `/dashboard`, Landlord
  blocked from `/tenant`, enforced in `proxy.ts`)
- Profile Details page (read-only) + Edit page, matching the Details/Edit
  split used by every other entity in the app

---

### Join Requests

Status

✅ Completed

Features

- Building Access Codes (generated on Building creation, shown on Building
  Details, retried on collision)
- Tenant Building Search (name search, restricted to Active buildings with
  at least one vacant Flat)
- Request Submission (requires Tenant Profile + correct Access Code)
- Approval Workflow (marks the Flat Occupied, auto-rejects other pending
  requests for that Flat)
- Rejection Workflow
- End Lease (marks the Flat Vacant again, request status `ENDED`, and
  closes the associated Lease — see Lease Management below)
- Landlord Requests Inbox (global + per-Building, filterable by status)
- Tenant "My Requests" view (filterable by status)
- Sidebar pending-request badge

---

### Lease Management

Status

✅ Completed

Features

- Lease Creation — folded into Join Request approval: approving now
  requires a Lease Start Date and Monthly Rent (Deposit optional), and
  creates the `Lease` row in the same transaction as the approval
- Move Out — "End Lease" (formerly "End Tenancy") closes the `Lease`
  (`status: ENDED`, `endDate` set) alongside the Flat/JoinRequest status
  changes
- Move In — not separately tracked; `Lease.startDate` doubles as the
  move-in date

Decision — Open-Ended Leases, No Renewal/Expiration

Leases in this system have no fixed term. A tenancy starts on approval
and continues — with rent accruing every month — until the Landlord
explicitly ends it via "End Lease." There is no agreed end date to renew
or expire against; that's negotiated verbally between Landlord and
Tenant outside the system. So:

- Lease Renewal — not applicable. There's no fixed term to renew.
- Lease Expiration — not applicable. There's no expected end date to
  flag against.

`Lease.endDate` stays in the schema only as the timestamp "End Lease"
writes when a tenancy is actually closed out, not as a planned term end.

---

## Phase 4 — Financial Management

### Rent Management

Status

✅ Completed

Features

- Monthly Rent — auto-generated per active Lease, reconciled on read (no
  scheduled job). No day-level proration — a billable month is always
  charged in full — but a join-date cutoff decides whether the join
  month itself is billable: joining on the 20th or earlier bills that
  month, joining after the 20th skips it and billing starts the
  following month
- Rent Status — `PENDING` → `OVERDUE` once the due month has fully
  passed unpaid; → `PARTIAL`/`PAID` by recording a real payment via
  Payment History's `recordPayment` action (supports partial payments)
- Due Dates — 1st of each covered month
- Outstanding Balance — shown per Flat (Rent card on Flat Details) and
  per Building (Overview card, total + count of flats with unpaid rent)

Note

Surfaces which flats currently have unpaid or overdue rent on the
Building Details page already, feeding into Phase 6 Reports.

---

### Utility Bills

Status

✅ Completed (first slice)

Features

- Water, Gas, Electricity, Internet, Security, Custom ("Other") — the
  full `UtilityType` enum
- Landlord manually records each bill against an active Lease (type,
  billing month, amount, due date) — unlike Rent, utility amounts vary
  by actual usage, so nothing is auto-generated with a guessed amount
- No `status` column on `UtilityBill` by design — paid/unpaid is always
  computed from its `PaymentHistory` rows (see Payment History), via
  `computePaymentStatus` in `src/lib/payment-status.ts`
- Shown on Flat Details (Landlord, with Record Payment) and the
  Tenant's own Flat page (read-only)

---

### Payment History

Status

✅ Completed (first slice — feeds Rent and Utility Bills status, no
receipts/timeline view yet)

Features

- Payment Records — `recordPayment` (`src/actions/payment/record-payment.ts`)
  creates a `PaymentHistory` row against either a `Rent` or a
  `UtilityBill`, capped at the remaining balance (supports partial
  payments)
- Payment Status — recording a payment against a `Rent` updates its
  cached `status` (`PARTIAL`/`PAID`); a `UtilityBill` has no such column,
  so its status is always computed live from its payments
- Optional transaction reference recorded per payment
- Receipts — planned
- Payment Timeline (a dedicated cross-Lease view of every payment ever
  made) — planned; today, payments are only visible per Rent/Utility
  Bill row on Flat Details

Note

This replaced Rent Management's original "Mark Paid" shortcut (a direct
status flip with no payment record) — Rent now goes through the same
`recordPayment` action Utility Bills uses.

---

## Phase 5 — Communication

### Notices

Status

✅ Completed

Features

- Building Notices — every notice is scoped to a Building (title,
  content, audience). Floor Notices were dropped: the `Notice` model
  has no `floorId`, and floor-level targeting wasn't worth a migration
  for this first slice
- Scheduled Notices — reinterpreted as auto-expiry, since the schema
  has `expiresAt` (a future publish date would need a new column, which
  wasn't added). A notice is visible from creation until its optional
  `expiresAt`, if set
- Audience targeting (`ALL` / `TENANTS` / `LANDLORDS`) — a Tenant only
  ever sees `ALL`/`TENANTS` notices, and only from Buildings where they
  currently have an `ACTIVE` Lease
- Landlord CRUD at `/dashboard/buildings/[id]/notices` (list shows an
  Active/Expired badge per notice; list doubles as the "details" view —
  no separate details page, since a notice has no nested content
  worth a dedicated page)
- Hard delete — `Notice` has no `deletedAt` column in the schema,
  unlike Building/Floor/Flat, so there's nothing to soft-delete into
- Tenant-facing read-only view at `/tenant/notices`
- Unread badge on the tenant nav — `TenantProfile.lastNoticesViewedAt`
  (added via migration) tracks the last time a Tenant opened Notices;
  the badge counts active notices published since then, and clears on
  their next real visit (not on a hover/prefetch)

Note

Surfaces active notices at a glance on the Tenant's own Notices page;
feeding a cross-building view into Phase 6 Reports is still future work.

---

### Activity Logs

Status

✅ Completed

Features

- Building Activity — `ActivityLog` gained a `buildingId` column
  (migration) specifically so a Landlord can see everything that
  happened in one building regardless of who did it, including a
  Tenant's own actions like submitting a Join Request. Page:
  `/dashboard/buildings/[id]/activity`
- User Activity — folded into one global feed
  (`/dashboard/activity`, linked from the sidebar) that shows both the
  Landlord's own actions (including buildingless events like Login/
  Register) and everything happening across every building they own,
  rather than a second, separate personal-only view
- Audit Trail — `src/lib/log-activity.ts` is called from the key
  mutating actions across the app: Login/Register, Building create/
  update/delete, Floor/Flat create/delete, Join Request create/
  approve/reject, ending a Lease, Notice create/update/delete,
  recording a Rent/Utility payment, and adding a Utility Bill. This is
  representative coverage, not literally every action in the app
- No Tenant-facing view — this is a Landlord oversight/audit feature

---

## Phase 6 — Reports

Status

✅ Completed (first slice — one portfolio-wide page, not a report per
category)

Features

- Building Statistics — a per-building table (flats, occupancy,
  revenue, outstanding) on the same page as the portfolio totals,
  rather than a separate view per building
- Occupancy Reports — Vacant/Occupied/Maintenance counts and an
  occupancy rate, portfolio-wide and per building
- Revenue Reports — all-time and this-month totals, portfolio-wide and
  per building, summed from `PaymentHistory` (Rent + Utility Bill
  payments combined)
- Outstanding Payments — Rent and Utility Bills outstanding, portfolio-
  wide and per building. Fixed a real bug found while building this:
  the existing per-building "Outstanding Rent" figure on Building
  Details was counting a `PARTIAL` Rent's full amount, not its
  remaining balance after the payment already made
- Monthly Reports — a 6-month Due vs. Collected table. "Collected" is
  whatever was paid *in* that calendar month, not necessarily *for*
  that month's rent — the two can differ when a tenant catches up on a
  past-due period, and the page says so

No new models or migrations — every number here was already being
collected by Rent Management, Utility Bills, Payment History, and Join
Requests; this phase only aggregates and displays it
(`src/actions/report/get-portfolio-report.ts`).

One page, not several — `/dashboard/reports`, linked from the sidebar.
No per-building `/dashboard/buildings/[id]/reports` route; the
Building Statistics table on the one portfolio page covers that need.

---

## Phase 7 — Analytics

Status

✅ Completed

Features

- Dashboard Charts — originally a compact Occupancy bar + Revenue
  Trend chart on the main `/dashboard` landing page; replaced by a
  "Needs Attention" panel in the UX Simplification Pass below, since
  it duplicated Reports rather than adding new information
- Occupancy Analytics — a 3-segment stacked bar (Occupied / Vacant /
  Maintenance), portfolio-wide
- Revenue Trends — a 6-month line chart (same monthly data Reports'
  Due-vs-Collected table already shows, plotted as a trend instead)
- Building Performance — two ranked horizontal-bar charts (Revenue by
  Building, Occupancy Rate by Building)

No new backend work — every chart reads `getPortfolioReport`, the same
action Reports already built. Analytics visualizes; Reports tabulates.
Every number shown in a chart also exists as a plain table row on
Reports — charts are a second view of the same data, not a new source
of it.

Charts are hand-built inline SVG/HTML (no charting library added) —
categorical colors use the first three slots of a CVD-validated
reference palette (`src/lib/chart-colors.ts`), since the project's own
`--chart-1..5` CSS tokens are still unthemed grayscale placeholders,
not real hues.

**Merged into Reports shortly after shipping** (see UX Simplification
Pass below) — `/dashboard/analytics` no longer exists as its own route
or sidebar link; these charts now live directly on `/dashboard/reports`.
The "Dashboard Charts" feature also changed shape: the compact charts
were replaced by a "Needs Attention" panel — see below.

---

## UX Simplification Pass

Status

✅ Completed

Prompted by direct feedback that the app had accumulated too many
pages and too many buttons to feel simple, after all 7 phases shipped.
Not a new phase of features — a pass over navigation and page density.
No functionality was removed.

Changes

- **Reports + Analytics merged into one page.** They showed the exact
  same portfolio data — one as tables, one as charts — as two separate
  sidebar destinations. Now one page, one sidebar link
- **Building Details' button row cut from 7 to 3** (Quick Setup, Edit
  Building, Delete Building). Requests, Notices, and Activity moved
  into the Overview card as clickable stat tiles alongside Floors and
  Outstanding Rent — a label + a linked value, with Requests turning
  red and showing a pending count when something needs a decision
- **The main Dashboard became a "Needs Attention" hub** instead of a
  second copy of the Reports charts: pending Join Requests and flats
  with overdue rent, each one click from the exact flat/request that
  needs it, instead of a 4-level Buildings → Floors → Flats → Flat
  drill for the most routine landlord task (checking what needs doing
  today)

Deliberately not changed: Flat Details' card stack and its inline
expanding forms (Approve, Record Payment, Add Utility Bill) — that
content is necessary, not accidental clutter, and the tenant-facing
side (already lean at 5 nav items) didn't show the same symptoms.

Two follow-ups from user feedback on the first version of this pass:

- Stat tiles didn't visually read as clickable, so a shared
  `StatTile` component now renders linked stats as a bordered,
  hover-highlighted box and non-linked stats as flat text — applied to
  both Building Details and Floor Details
- Removed the "Tenants" and "Payments" sidebar placeholders. Both had
  said "Soon" since the very first commit; the functionality they
  promised has since been built, just distributed per-flat rather than
  as dedicated top-level pages, so the placeholders had gone stale and
  misleading rather than accurate

---

# Development Principles

Every module should include, where applicable:

- List Page
- Details Page
- Create Page
- Edit Page
- Soft Delete
- Ownership Validation
- Zod Validation
- Server Actions
- Reusable Components
- Documentation Updates

A module is considered complete only when all of the above are implemented and documented.

---

# Current Priority

Current Sprint

None — Phases 1 through 7 are all complete. The core management
workflow (Buildings → Floors → Flats → Tenants → Join Requests →
Leases → Rent/Utility Billing → Payment History → Notices → Activity
Logs → Reports → Analytics) is done end to end.

Next up is whatever's picked from Future Enhancements below — none of
those are sequenced or committed to yet, unlike Phases 1–7.

---

# Future Enhancements

Potential improvements after the core system is complete. Unlike Phases
1–7, nothing here is sequenced or committed to — this is a menu, not a
plan. The notes below are recommendations for when picking from it,
based on what actually seems to matter given how the app turned out;
they're not a decision to build any of it.

## Worth doing first, if picking anything

- **Image uploads for buildings/flats.** `Building.imageUrl` has
  existed in the schema since the first migration and is still `null`
  for every building — nothing in the UI ever sets it. This is the
  single lowest-effort item on this list: the data model is already
  there, it just needs an upload flow (Landlord Edit Building/Flat
  forms) and a place to store the file (S3/Cloudinary/Vercel Blob — no
  file storage exists in this project yet). A visual building/flat
  card would also make the tenant-facing "Find a Flat" list feel much
  less like a spreadsheet.
- **Search + filtering on the lists that will actually grow.**
  Buildings, the landlord Requests inbox, and Activity are the pages
  most likely to get long as a portfolio grows past a handful of
  buildings — right now they're unpaginated, unfiltered `findMany`
  calls capped at 200 rows (Activity) or nothing at all (Buildings).
  Filtering Buildings by status, and Activity/Requests by
  building/date, would matter well before Analytics-style polish
  would.
- **Pagination**, once Search/Filtering is in — a growing Activity
  Log or Requests inbox is the first place "just show everything"
  stops working.

## Worth doing once there's real usage

- **Email notifications.** The single biggest functional gap for a
  real landlord: right now, the *only* way to learn about a new join
  request or an upcoming notice is to open the app. Even a bare
  "you have a new request" email would close the gap between "the
  data is right" (already true) and "the landlord actually sees it in
  time" (not true yet). SMS/push are the same problem at higher cost —
  do email first and see if it's enough.
- **Data export.** Reports already aggregates exactly the numbers an
  accountant or a landlord's own records would want (revenue,
  outstanding, occupancy) — a CSV/PDF export button on that page is a
  small addition on top of data that already exists, not a new
  feature to build from scratch.

## Bigger, structural — only if the product's shape actually changes

- **Role-Based Access Control** — only matters once a building has
  more than one person managing it (a property manager, a co-owner).
  For the current one-landlord-per-building model it's not solving a
  real problem yet.
- **Multi-Tenant Organizations** — a genuinely different product
  shape (companies with sub-users managing shared portfolios), not an
  incremental feature. Worth a real design conversation before any
  code, not a checkbox off this list.
- **Calendar integration, multi-language support** — plausible, but
  nothing currently in the app points at either being the actual
  bottleneck; low priority absent a specific ask.

## Cosmetic / low-stakes

- **Dark mode.** The CSS variables for it already exist
  (`.dark` selectors throughout `globals.css`), but there is no theme
  toggle or `ThemeProvider` wired up anywhere, so dark mode is
  currently unreachable in the running app regardless of OS setting.
  Finishing this is mostly wiring, not design work.
- **Data import** — lower priority than export; only useful once
  someone is migrating *into* this system from somewhere else, which
  isn't a known scenario yet.

---

# Definition of Done

A module is complete when it satisfies all of the following:

- Business logic implemented
- UI completed
- Validation completed
- Ownership checks implemented
- Soft delete implemented (where applicable)
- Documentation updated
- Tested manually
- Ready for production-quality refactoring

Only then should development move to the next module.