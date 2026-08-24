# Changelog

All notable changes to the Building Management System are documented here.

The format loosely follows Keep a Changelog while remaining focused on project development.

---

# [Unreleased]

## Planned

- Lease Management
- Rent Management
- Utility Bills
- Payment History
- Notices
- Reports
- Analytics

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