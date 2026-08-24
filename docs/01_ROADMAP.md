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

🚧 Current Sprint (Lease Creation done, Renewal/Expiration pending)

Features

- Lease Creation — done. Folded into Join Request approval: approving now
  requires a Lease Start Date and Monthly Rent (Deposit optional), and
  creates the `Lease` row in the same transaction as the approval
- Move Out — done. "End Lease" (formerly "End Tenancy") now closes the
  `Lease` (`status: ENDED`, `endDate` set) alongside the `JoinRequest`
  and Flat status changes
- Lease Renewal — planned
- Lease Expiration — planned (auto-flagging leases nearing/past `endDate`)
- Move In — not separately tracked yet; `Lease.startDate` currently
  doubles as the move-in date

---

## Phase 4 — Financial Management

### Rent Management

Status

⬜ Planned

Features

- Monthly Rent
- Rent Status
- Due Dates
- Outstanding Balance

Note

Should support surfacing which flats currently have unpaid or overdue rent, feeding into Phase 6 Reports.

---

### Utility Bills

Status

⬜ Planned

Features

- Water
- Gas
- Electricity
- Custom Utilities

---

### Payment History

Status

⬜ Planned

Features

- Payment Records
- Receipts
- Payment Status
- Payment Timeline

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

⬜ Lease Management

Goal

Turn an `APPROVED` Join Request into a formal Lease (start/end date,
deposit, monthly rent), and handle Move In / Move Out and renewal on top
of the tenancy relationship Join Requests already established.

Lease Management should follow the same architecture and conventions
established by the Building, Floors, Flats, Tenant Profile, and Join
Request modules.

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