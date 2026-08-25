# Changelog

All notable changes to the Building Management System are documented here.

The format loosely follows Keep a Changelog while remaining focused on project development.

---

# [Unreleased]

## Planned

Nothing from the original roadmap — Phases 1–7 are complete. Future
work comes from Future Enhancements in `01_ROADMAP.md`, unsequenced.

---

# [v2.12.0] - UX Simplification Pass

Prompted by direct feedback that the app had accumulated too many
pages and too many buttons per page. No functionality removed.

## Changed

- Reports and Analytics merged into one page (`/dashboard/reports`) —
  they showed the exact same portfolio data as two separate sidebar
  destinations (one as tables, one as charts). `/dashboard/analytics`
  and its sidebar link are gone; the charts moved onto Reports
- Building Details' button row cut from 7 buttons to 3 (Quick Setup,
  Edit Building, Delete Building). Requests, Notices, and Activity
  moved into the Overview card as clickable stat tiles, alongside the
  Floors and Outstanding Rent stats already there — Requests turns
  red with a pending count when something needs a decision.
  `getPendingJoinRequestsCount` gained an optional `buildingId` filter
  to support this
- The main Dashboard replaced its (redundant) chart preview with a
  "Needs Attention" panel: pending Join Requests and flats with
  overdue rent, each one click from the exact request/flat — instead
  of the previous Buildings → Floors → Flats → Flat drill for what
  used to be the most click-heavy routine task. New action:
  `src/actions/report/get-needs-attention.ts`
- Stat tiles (Building Details, Floor Details) now render as bordered,
  hover-highlighted boxes when clickable, and flat text when not —
  new shared `src/components/ui/stat-tile.tsx` component, since a
  plain text link didn't visually read as a button
- Removed the "Tenants" and "Payments" sidebar placeholders — both had
  said "Soon" since the first commit, but the functionality they
  promised was since built (Current Tenant / Rent / Utility Bills
  cards per flat), just not as dedicated top-level pages, so they'd
  gone stale and misleading

## Added

- `prisma/seed-demo-landlord.ts` — an additive (never destructive)
  demo-data script: one demo landlord, 3 buildings, 36 flats, 24
  leases with realistic staggered histories, ~150 payments, several
  deliberately overdue rent periods, pending/rejected join requests,
  notices, and backdated activity log entries, for visualizing Reports
  and the Needs Attention panel with real-looking data

## Documentation

Updated

- Project Memory, Roadmap — added a "UX Simplification Pass" entry
  under Phase 7; removed stale references to `/dashboard/analytics`

---

# [v2.11.0] - Analytics

## Added

- Hand-built inline SVG/HTML charts, no charting library added —
  `src/components/analytics/` (`OccupancyBar`, `RevenueTrendChart`,
  `BuildingPerformanceChart`)
- New categorical color constants (`src/lib/chart-colors.ts`) using
  the first three slots of a CVD-validated reference palette — the
  project's own `--chart-1..5` CSS tokens are still unthemed grayscale
  placeholders, not real hues
- `/dashboard/analytics` (linked from the sidebar): Occupancy
  (Occupied/Vacant/Maintenance stacked bar), Revenue Trend (6-month
  line + area), Building Performance (Revenue and Occupancy Rate
  ranked bar lists)
- Compact Occupancy + Revenue Trend charts added to the main
  `/dashboard` landing page
- Zero new backend work — every chart reads `getPortfolioReport`, the
  same action Reports already built; Analytics visualizes, Reports
  tabulates, and every charted number also exists as a plain table row
  on Reports

## Documentation

Updated

- Project Memory, Roadmap — Analytics marked complete. Phases 1–7 (the
  full original roadmap) are now done; no phase is currently in
  progress. Future work comes from Future Enhancements, unsequenced

---

# [v2.10.0] - Reports

## Added

- One portfolio-wide page, `/dashboard/reports` (linked from the
  sidebar) — no separate route per report category, and no per-building
  `/dashboard/buildings/[id]/reports` route; a Building Statistics
  table on this page covers that need
- Occupancy: Vacant/Occupied/Maintenance counts and rate, portfolio-wide
  and per building
- Revenue: all-time and this-month totals (Rent + Utility Bill payments
  combined), portfolio-wide and per building
- Outstanding: Rent + Utility Bills outstanding, portfolio-wide and per
  building
- A 6-month Due vs. Collected table. "Collected" is whatever was paid
  in that calendar month, not necessarily for that month's rent — noted
  directly on the page
- No new models or migrations — `src/actions/report/get-portfolio-report.ts`
  only aggregates data Rent Management, Utility Bills, Payment History,
  and Join Requests were already collecting

## Fixed

- `getOutstandingBalanceForBuilding` (Building Details' "Outstanding
  Rent" figure) was counting a `PARTIAL` Rent's full amount instead of
  its remaining balance after the payment already made — found while
  building the Outstanding report, fixed everywhere this number is
  shown

## Documentation

Updated

- Project Memory, Roadmap (Reports marked complete; Phase 7 — Analytics
  now current sprint)

---

# [v2.9.0] - Activity Logs

## Decided

- Added `buildingId` to `ActivityLog` (migration) so a Landlord can see
  everything that happened in one building regardless of who did it —
  the original schema only had `userId` (the actor), which couldn't
  answer that whenever a Tenant was the one acting (e.g. a Join
  Request)
- `onDelete: SetNull` on that new relation, not `Cascade` like every
  other Building relation — an audit trail shouldn't vanish if its
  building link ever does

## Added

- `src/lib/log-activity.ts`, a plain helper called explicitly from
  each instrumented action (not a generic wrapper/middleware)
- Instrumented: Login (via `events.signIn` in `src/auth.config.ts`,
  since `loginUser` can't observe its own success — `signIn()`
  redirects first), Register, Building create/update/delete, Floor/
  Flat create/delete, Join Request create/approve/reject, End Lease,
  Notice create/update/delete, Rent/Utility Bill payments, Utility
  Bill creation
- Two Landlord-only views: `/dashboard/activity` (global — the
  Landlord's own actions plus everything across every building they
  own) and `/dashboard/buildings/[id]/activity` (one building only),
  both linked from the sidebar / Building Details respectively

## Not Included

- Not literally every mutating action in the app — representative
  coverage matching the original roadmap examples, extended to this
  project's actual entities
- No Tenant-facing view — this is a Landlord audit/oversight feature

## Documentation

Updated

- Project Memory, Roadmap (Activity Logs marked complete; Phase 6 —
  Reports now current sprint), Database (`ActivityLog` moved to
  schema + application complete, documented the `buildingId` addition)

---

# [v2.8.0] - Notices

## Decided

- Notices are Building-scoped only — the schema has no `floorId`, and
  Floor Notices weren't worth a migration for this first slice
- "Scheduled Notices" means auto-expiry (the existing `expiresAt`
  field), not a future publish date — there's no column for that, and
  none was added

## Added

- Full Landlord CRUD at `/dashboard/buildings/[id]/notices` — title,
  content, audience (`ALL`/`TENANTS`/`LANDLORDS`), optional expiry date
- The list page shows an Active/Expired badge per notice and doubles as
  the "details" view (no separate details route — a notice has no
  nested content to justify one)
- Hard delete (`Notice` has no `deletedAt` column, unlike Building/
  Floor/Flat)
- Tenant-facing read-only view at `/tenant/notices`, linked from the
  tenant nav — shows only `ALL`/`TENANTS` notices from Buildings where
  the Tenant currently holds an `ACTIVE` Lease
- "Notices" button + linked count added to Building Details
- Unread badge on the tenant nav's "Notices" link, so a new notice is
  actually noticeable instead of requiring a tenant to check the page
  on their own initiative. Added `TenantProfile.lastNoticesViewedAt`
  (migration) to track real unread state rather than just showing a
  static count of active notices; a small client component clears it
  by firing only on a genuine page mount, not a `<Link>` hover/prefetch

## Documentation

Updated

- Project Memory, Roadmap (Notices marked complete; Activity Logs now
  current sprint), Database (`Notice` moved from schema-only to
  schema + application complete)

---

# [v2.7.0] - Utility Bills + Payment History

## Added

### Payment History (thin slice)

- `recordPayment` (`src/actions/payment/record-payment.ts`) — one shared
  action for recording a payment against either a `Rent` or a
  `UtilityBill`, creating the `PaymentHistory` row. Validates the amount
  against the target's remaining balance, so partial payments are
  supported and overpayment is rejected
- Recording a payment against a `Rent` updates its cached `status` to
  `PARTIAL`/`PAID`. `UtilityBill` has no such column — its status is
  always computed live from its payments (`computePaymentStatus` in
  `src/lib/payment-status.ts`), since the schema deliberately left it
  without one
- Not yet built: a receipts view or a cross-Lease payment timeline

### Utility Bills

- Landlord manually records a bill against an active Lease — type (full
  `UtilityType` enum), billing month, amount, due date
  (`src/actions/utility-bill/create-utility-bill.ts`). No
  auto-generation, unlike Rent — utility amounts vary by actual usage
- Shown on Flat Details (Landlord, with Record Payment) and the
  Tenant's own Flat page (read-only)

### Shared Billing UI

- `src/components/billing/billing-table.tsx` and
  `record-payment-button.tsx` replace the old Rent-only `RentTable` /
  `MarkRentPaidButton` — Rent and Utility Bill rows are now structurally
  identical (label, amount, due date, status, Record Payment) once both
  go through Payment History

## Changed

- Rent's "Mark Paid" shortcut (a direct status flip, no payment record)
  is removed. Marking a Rent paid now goes through the same
  `recordPayment` action Utility Bills uses, so every paid Rent has a
  real `PaymentHistory` row behind it, and partial payments are now
  possible for Rent too

## Documentation

Updated

- Project Memory, Roadmap (Utility Bills and Payment History marked
  complete as first slices; Notices — Phase 5 — now current sprint),
  Database (`UtilityBill` and `PaymentHistory` moved from schema-only /
  partial to schema + application, `Rent` to fully complete)

---

# [v2.6.0] - Rent Management

## Decided

- Leases are open-ended by design — no fixed term, so Lease Renewal and
  Lease Expiration are not applicable and have been dropped from the
  roadmap. Rent instead accrues every month until the Landlord ends the
  Lease.

## Added

- Rent is generated automatically per active Lease — no scheduled job;
  `src/lib/reconcile-rent.ts` backfills any missing `PENDING` Rent row
  (one per month since `Lease.startDate`, due on the 1st) whenever Rent
  data is read, using the same `createMany` + `skipDuplicates: true`
  pattern the Floors/Flats bulk-create actions already use
- A `PENDING` Rent becomes `OVERDUE` once its due month has fully passed
  unpaid — not immediately on the due date itself
- Late-join grace cutoff: joining on the 20th of a month or earlier
  bills that whole month; joining after the 20th skips it, and the
  first Rent period is the following month (`getFirstBillableMonth` in
  `src/lib/rent.ts`)
- Landlord "Mark Paid" action on the Flat Details page's new Rent card
- Outstanding Balance surfaced on Flat Details (per Lease) and Building
  Details (total across the building + count of flats with unpaid rent)
- Tenants see their own Rent history (read-only) on their Flat Details
  page

## Not Included

- `PARTIAL` rent status — needs itemized payment amounts, deferred to
  Payment History
- No day-level proration — a billable month is always charged in full;
  only whether the join month itself is billable is decided (via the
  20th-of-the-month cutoff above)

## Documentation

Updated

- Project Memory, Roadmap (Lease Management marked complete with the
  open-ended-lease decision recorded; Rent Management marked complete;
  Utility Bills now current sprint), Database (Rent moved from
  schema-only to schema + application partial)

---

# [v2.5.0] - Lease Creation

## Added

- Approving a `PENDING` Join Request now opens an inline form (Lease
  Start Date, Monthly Rent pre-filled from the Flat, optional Deposit)
  instead of a plain confirm — approval and Lease creation happen in one
  transaction (`src/actions/join-request/approve-join-request.ts`,
  `src/lib/validations/lease.ts`)
- Renamed "End Tenancy" to "End Lease" — it now also closes the active
  `Lease` (`status: ENDED`, `endDate` set), not just the `JoinRequest`
  and Flat status (`src/actions/join-request/end-lease.ts`,
  `src/components/join-request/end-lease-button.tsx`)
- The landlord Flat Details "Current Tenant" card and the tenant
  dashboard's "Your Current Flat" card now read Lease Start Date, actual
  agreed Monthly Rent, and Deposit from the active `Lease`, instead of
  approximating from the `JoinRequest`'s `updatedAt` and the Flat's
  listed rent

## Not Included

- Lease Renewal and Lease Expiration — still planned
- No standalone Lease list/detail views or `src/actions/lease/` folder
  yet; Lease is currently reached only through the Join Request
  approve / end-lease flow

## Documentation

Updated

- Project Memory, Roadmap, Database (Lease moved from schema-only to
  schema + application partial)

---

# [v2.4.0] - Join Requests

## Added

### Building Access Codes

- Random, unique `accessCode` generated on Building creation (retried on
  collision), shown on the Building Details page
- `prisma/backfill-access-codes.ts` — one-off script to backfill codes onto
  Buildings created before this migration
- A Tenant must supply the correct code to submit a Join Request

---

### Join Requests

- Tenant search: find Active buildings with at least one vacant Flat by
  name, browse a building's vacant Flats
- Request submission: requires a completed Tenant Profile and the
  Building's Access Code, with an optional message to the landlord
- Duplicate pending requests for the same Flat are blocked
- Landlord Requests Inbox — global (`/dashboard/requests`) and per-Building
  (`/dashboard/buildings/[id]/requests`) — both filterable by status
  (Pending / Approved / Rejected / Ended / All) via the new `StatusFilter`
  component
- Approve: marks the Flat `OCCUPIED`, auto-rejects any other pending
  requests for that Flat, all in one transaction
- Reject
- End Tenancy: new `JoinRequestStatus.ENDED`, distinct from `REJECTED` —
  marks the Flat `VACANT` again for a tenancy that was actually approved
  and later ended
- Tenant "My Requests" view, filterable by status
- Sidebar "Requests" link shows a live pending-count badge

---

### Bug Fixes

- Fixed a regression where the landlord Flats list page
  (`/dashboard/buildings/[id]/floors/[floorId]/flats`) had been
  overwritten with duplicate Flat Details content, making the list
  unreachable
- Fixed `monthlyRent` (Prisma `Decimal`) being passed directly into
  components typed for `number | string` on two Join Request pages
- Fixed `createBuilding`'s return value being incompatible with
  `BuildingForm`'s `action` prop type
- Fixed `loginUser`'s inferred state type allowing `undefined`, which broke
  the login form's error rendering under strict type-checking
- Removed unused, broken shadcn scaffolding (`ui/calendar.tsx`,
  `ui/command.tsx`, `ui/sonner.tsx`) referencing dependencies that were
  never installed
- `DeleteBuildingButton` now actually enters its pending/disabled state
  while the delete request is in flight

---

### Documentation

Updated

- Project Memory (Sprint 7, Join Requests marked complete, new routing)
- Roadmap (Join Requests complete, Lease Management now current sprint)
- Database (JoinRequest moved from schema-only to schema + application
  complete, documented `accessCode` and `ENDED` status)

---

# [v2.3.0] - Tenant Profiles + Tenant-Facing Area

## Added

### Tenant Profiles

- Self-service Profile (Occupation, National ID, Emergency Contact)
- Profile Details (read-only) page + Edit page, matching the Details/Edit
  split used by Building, Floor, and Flat
- Duplicate National ID surfaced as an inline field error, not a crash

---

### Tenant-Facing Area (new)

- New `(tenant)` route group, separate from `(landlord)` — minimal layout
  (header only, no sidebar), since this sprint's scope is one page, not a
  full dashboard
- Role-based redirect on login: `LANDLORD` → `/dashboard`, `TENANT` →
  `/tenant`
- **Fixed a pre-existing bug** in `src/app/page.tsx`: the role `switch`
  already existed, but both `LANDLORD` and `TENANT` cases redirected to
  `/dashboard` — Tenants had nowhere to go
- Role-based route guarding added to `proxy.ts`: a Tenant hitting
  `/dashboard/*` is redirected to `/tenant`, and a Landlord hitting
  `/tenant/*` is redirected to `/dashboard`

---

### Documentation

Updated

- Project Memory (Sprint 6, new Protected (Tenant) routing section)
- Roadmap
- Database (TenantProfile moved from schema-only to schema + application
  complete)

---

# [v2.2.0] - Flats Module + Quick Setup

## Added

### Flats Module

- Create Flat
- Bulk Create Flats (numeric range, `skipDuplicates` safe — flat numbers are
  text, so this uses a from/to numeric range rather than the raw field)
- Flat List (ordered by Flat Number)
- Flat Details (bedrooms, bathrooms, monthly rent, status)
- Edit Flat
- Soft Delete Flat
- Floor Relationship (ownership validated two hops up: Flat → Floor → Building)
- Server Action CRUD Architecture, matching the Building and Floors modules
- Reusable Flat Form (Single / Multiple toggle, shared Create + Bulk Create UI)
- Breadcrumb + back navigation built in from the start (not retrofitted)

---

### Quick Setup

- New cross-entity action (`src/actions/quick-setup/`) that generates a
  range of Floors and, per Floor, a range of Flats in a single database
  transaction
- Flats auto-numbered Floor × 100 + unit (Floor 3 → 301, 302, ...)
- Duplicate-safe: re-running it, or running it on a building with existing
  floors/flats, only fills gaps — nothing is overwritten
- Capped at 100 floors / 500 total flats per run
- Linked from Building Details as a dedicated page, separate from the plain
  Create Building form, so building creation itself stays simple

---

### Navigation

- Removed the dead "Flats" sidebar link — Flats has no top-level list page
  by design (always accessed via a specific Building → Floor), so a
  disabled placeholder there was misleading rather than informative
- Tenants and Payments remain as "Soon" placeholders, since those are
  plausible future top-level pages

---

### Documentation

Updated

- Project Memory
- Roadmap
- Database (Flat moved from schema-only to schema + application complete)

---

# [v2.1.0] - Floors Module + Navigation

## Added

### Floors Module

- Create Floor
- Bulk Create Floors (range-based, `skipDuplicates` safe)
- Floor List (ordered by Floor Number)
- Floor Details (with Flat status statistics: occupied / vacant / maintenance)
- Edit Floor
- Soft Delete Floor
- Building Relationship (ownership validated via Building, not a direct `ownerId`)
- Server Action CRUD Architecture, matching the Building module
- Reusable Floor Form (Single / Multiple toggle, shared Create + Bulk Create UI)

---

### Navigation

- `Breadcrumbs` component — full-path navigation on every nested page
- `BackLink` component — one-step back navigation on every nested page
- Fixed Floor Details back navigation (previously skipped the Floors List level)
- Disabled dead sidebar links (Flats, Tenants, Payments) pending those modules being built

---

### Documentation

Added

```
06_NAVIGATION_UX.md
```

Updated

- Project Memory
- Roadmap
- Database (clarified schema-complete vs application-complete models)

---

# [v2.0.0] - Authentication + Building Module

## Added

### Authentication

- User Registration
- User Login
- Auth.js v5
- Credentials Provider
- JWT Session Strategy
- Password Hashing (bcrypt)
- Protected Dashboard
- Route Protection using proxy.ts
- Zod Validation
- Prisma Integration

---

### Dashboard

- Dashboard Layout
- Sidebar Navigation
- Header
- User Navigation

---

### Building Module

- Create Building
- Building List
- Building Details Page
- Edit Building
- Soft Delete Building
- Ownership Validation
- Building Validation (Zod)
- Shared Building Form
- Server Action CRUD Architecture

---

### Project Structure

Added feature-based folder organization.

Introduced dedicated directories for:

- Building Server Actions
- Building Components
- Building Validation
- Shared Types

---

### Architecture

Established Architecture v2.0.

Major decisions:

- Server Actions are the default for internal CRUD.
- API routes are reserved for external integrations and framework requirements.
- Every major entity receives:
  - List Page
  - Create Page
  - Details Page
  - Edit Page
- Feature-based architecture is the project standard.
- Reusable UI components are separated from business components.
- Soft Delete is the default deletion strategy.

---

### Documentation

Updated:

- Project Memory
- Roadmap
- Architecture

Prepared documentation for future module development.

---

# [v1.0.0] - Initial Foundation

## Added

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma
- PostgreSQL
- Auth.js
- Initial Project Structure
- Documentation Structure

This version established the technical foundation for the project.