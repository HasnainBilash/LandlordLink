# Project Memory

> This document is the permanent memory of the Building Management System.
>
> Read this document before starting development or beginning a new ChatGPT conversation.

---

# Project Information

## Project Name

Building Management System

## Status

🟢 Active Development

## Repository

Private

## Current Branch

main

## Current Sprint

Sprint 9 — Notices

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

## Current Development

🚧 Notices

---

# Project Vision

Build a modern, scalable, production-ready Building Management System that allows landlords to manage residential properties from a single dashboard while providing tenants with a structured and secure workflow.

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

---

# Planned Modules

- Notices
- Activity Logs
- Reports
- Analytics

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

Implement Notices (Phase 5 — Communication): Landlord-published
announcements scoped to a Building or Floor, with optional scheduling,
visible to Tenants.

Future modules should reuse the same architecture and development patterns
introduced by the Building, Floors, Flats, Tenant Profile, Join Request,
Lease, Rent Management, Utility Bills, and Payment History modules —
including baking in breadcrumb and
back navigation from the start, and routing new Tenant-facing pages under
the `(tenant)` route group rather than `(landlord)`.

---

# Long-Term Goal

Develop a complete production-ready Building Management System while maintaining a clean, scalable, and consistent architecture across every module.

This document should always represent the current state of the repository.