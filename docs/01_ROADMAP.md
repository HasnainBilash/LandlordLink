# Project Roadmap

> This roadmap tracks the long-term development of the Building Management System.
>
> Items move from **Planned → In Progress → Completed**.
>
> This document reflects project direction rather than implementation details.

---

# Project Goal

Build a production-ready Building Management System using modern architecture, scalable design, and consistent development practices.

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

⬜ Planned

Features

- Building Notices
- Floor Notices
- Scheduled Notices

Note

Should support surfacing active notices per building/floor at a glance, feeding into Phase 6 Reports.

---

### Activity Logs

Status

⬜ Planned

Features

- User Activity
- Building Activity
- Audit Trail

---

## Phase 6 — Reports

Status

⬜ Planned

Features

- Building Statistics
- Occupancy Reports
- Revenue Reports
- Outstanding Payments
- Monthly Reports

---

## Phase 7 — Analytics

Status

⬜ Planned

Features

- Dashboard Charts
- Occupancy Analytics
- Revenue Trends
- Building Performance

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

🚧 Notices (Phase 5 — Communication)

Goal

Let a Landlord publish announcements scoped to a Building, a Floor, or
scheduled for later, visible to Tenants — the first Phase 5 module now
that Phase 4's financial core (Lease, Rent, Utility Bills, Payment
History) is in place.

Notices should follow the same architecture and conventions established
by the Building, Floors, Flats, Tenant Profile, Join Request, Lease,
Rent Management, Utility Bills, and Payment History modules.

---

# Future Enhancements

Potential improvements after the core system is complete:

- Search
- Filtering
- Pagination
- File Uploads
- Image Galleries
- Email Notifications
- SMS Notifications
- Push Notifications
- Calendar Integration
- Multi-language Support
- Dark Mode Improvements
- Data Export
- Data Import
- Role-Based Access Control
- Multi-Tenant Organizations

These features should only be implemented after the core management workflow is complete.

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