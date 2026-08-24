# Database Documentation

> Database design for the Building Management System.

---

# Database

Provider

PostgreSQL

ORM

Prisma ORM

The database is designed around one central idea:

```

Landlord

↓

Building

↓

Floor

↓

Flat

↓

Tenant

↓

Lease

↓

Rent & Utility Bills

↓

Payments

```

Every model fits naturally into this hierarchy.

---

# Current Models

Every model below exists in the Prisma schema. Application-layer status
(Server Actions, routes, components) varies by model — see
`00_PROJECT_MEMORY.md` → Current Features for what's actually wired up.

```

User                    (schema + application complete)

↓

Building                (schema + application complete)

↓

Floor                   (schema + application complete)

↓

Flat                    (schema + application complete)

↓

Lease                   (schema + application complete — created/ended
                         via Join Request approve/end-lease; open-ended,
                         no Renewal/Expiration by design)

↓

Rent                    (schema + application partial — auto-generated
                         per month, Mark Paid only; no Partial payments
                         or Utility Bills yet)

↓

PaymentHistory          (schema only — not yet built)

```

Additional models

```

TenantProfile           (schema + application complete)

JoinRequest             (schema + application complete)

UtilityBill             (schema only — not yet built)

Notice                  (schema only — not yet built)

ActivityLog

```

---

# Enums

## UserRole

```

LANDLORD

TENANT

```

Purpose

Defines the system role of a user.

---

## BuildingStatus

```

ACTIVE

INACTIVE

```

---

## FlatStatus

```

VACANT

OCCUPIED

MAINTENANCE

```

---

## LeaseStatus

```

ACTIVE

ENDED

TERMINATED

```

---

## JoinRequestStatus

```

PENDING

APPROVED

REJECTED

ENDED

```

`ENDED` is distinct from `REJECTED` — it closes out a tenancy that was
actually `APPROVED` and lived (via End Tenancy), not a request that was
never accepted.

---

## RentStatus

```

PENDING

PARTIAL

PAID

OVERDUE

```

---

## UtilityType

```

ELECTRICITY

GAS

WATER

INTERNET

SECURITY

OTHER

```

---

## PaymentType

```

RENT

UTILITY

```

---

## NoticeAudience

```

ALL

TENANTS

LANDLORDS

```

---

# Models

---

# User

Purpose

Represents every authenticated account.

Current Roles

- Landlord
- Tenant

Relationships

```

User

├── owns many Buildings

├── has one TenantProfile

└── has many ActivityLogs

```

Important Fields

```

id

name

email

passwordHash

role

deletedAt

```

---

# Building

Purpose

Represents one residential building.

Owned By

One landlord.

Relationships

```

Building

├── belongs to User

├── has many Floors

├── has many JoinRequests

└── has many Notices

```

Important Fields

```

name

address

city

country

status

accessCode

ownerId

```

`accessCode` is a unique, randomly generated code (`src/lib/generate-access-code.ts`)
created when the Building is created and retried on collision. A Tenant
must supply it to submit a Join Request for one of the Building's Flats.

---

# Floor

Purpose

Groups flats inside a building.

Relationships

```

Building

↓

Floor

↓

Flat

```

Unique Constraint

```

buildingId + floorNumber

```

This prevents duplicate floor numbers inside the same building.

---

# Flat

Purpose

Represents a rentable apartment.

Relationships

```

Floor

↓

Flat

├── Lease

└── JoinRequest

```

Unique Constraint

```

floorId + flatNumber

```

Status

```

VACANT

OCCUPIED

MAINTENANCE

```

---

# TenantProfile

Purpose

Stores tenant-specific information.

Reason

Authentication information belongs inside User.

Tenant information belongs inside TenantProfile.

This keeps the User model clean.

Relationship

```

User

↓

TenantProfile

```

Contains

- Occupation
- National ID
- Emergency Contact

---

# JoinRequest

Purpose

Allows tenants to request a flat.

Workflow

```

Tenant

↓

Join Request (requires the Building's Access Code)

↓

Landlord Approval → Lease created (Start Date + Monthly Rent supplied
                     by the Landlord at approval time), Flat marked
                     OCCUPIED, other pending requests for that Flat
                     auto-REJECTED
        or
Landlord Rejection → Flat stays VACANT

↓ (later, whenever — no fixed term)

Landlord Ends Lease → JoinRequest status ENDED, Lease status ENDED,
                       Flat marked VACANT again

```

A tenant never becomes an active tenant immediately.

Approval is required.

Important Fields

```

tenantId

buildingId

flatId

message

status

```

---

# Lease

Purpose

Represents a rental agreement.

Created

Automatically, when a Landlord approves a `PENDING` JoinRequest — the
Landlord supplies Start Date and Monthly Rent (Deposit optional) at
approval time, and the Lease is created in the same transaction as the
approval.

Ended

Via "End Lease" (`src/actions/join-request/end-lease.ts`) — sets `status`
to `ENDED` and stamps `endDate`, alongside marking the Flat `VACANT` again.

Open-Ended By Design

A Lease has no fixed term. `endDate` is only ever set when "End Lease"
actually closes one out — it is never set upfront as a planned expiry.
There is no Renewal or Expiration feature; rent simply accrues every
month (see Rent below) until the Landlord ends the Lease.

Relationships

```

Tenant

↓

Lease

├── Rent

└── Utility Bills

```

Contains

- Start Date
- End Date
- Deposit
- Monthly Rent

---

# Rent

Purpose

Represents one month's rent for a Lease.

Unique Constraint

```

leaseId

month

year

```

This prevents duplicate rent entries for the same month.

Generated

Not by a scheduled job — there is no background job runner in this
project. Instead, `src/lib/reconcile-rent.ts` runs reconciliation
on-demand, from every landlord/tenant action that reads Rent data
(`getRentsForLease`, `getOutstandingBalanceForBuilding`,
`getTenantFlatView`). For an `ACTIVE` Lease, it backfills a `PENDING`
Rent row (`amount` = the Lease's `monthlyRent`, `dueDate` = the 1st of
that month) for every billable month up to the current month that
doesn't already have one — using `createMany` with
`skipDuplicates: true`, the same pattern the Floors/Flats bulk-create
actions use.

No day-level proration — a billable month is always charged in full.
Instead, a join-date cutoff decides whether the join month itself is
billable at all (`getFirstBillableMonth` in `src/lib/rent.ts`): joining
on the 20th or earlier bills that whole month; joining after the 20th
skips it, and the first Rent period is the following month.

Status Transitions

A `PENDING` Rent flips to `OVERDUE` once the month it's due in has fully
passed (i.e. once the next month starts) and it's still unpaid — not
immediately on its due date, so the Landlord/Tenant have the whole month
to settle it. Marking a Rent `PAID` is a manual Landlord action (`Mark
Paid` — `src/actions/rent/mark-rent-paid.ts`); `PARTIAL` is defined in
the schema but not yet reachable from the UI — see Payment History.

---

# UtilityBill

Purpose

Stores monthly utility charges.

Supported Types

- Electricity
- Gas
- Water
- Internet
- Security
- Other

Unique Constraint

```

leaseId

type

month

year

```

---

# PaymentHistory

Purpose

Stores completed payments.

Supports

- Rent
- Utility Bills

A payment belongs to exactly one payment type.

---

# Notice

Purpose

Allows landlords to publish announcements.

Audience

```

ALL

TENANTS

LANDLORDS

```

Can expire automatically.

---

# ActivityLog

Purpose

Records important user activity.

Examples

- Login
- Building Created
- Building Deleted
- Lease Approved
- Payment Recorded

Useful for auditing.

---

# Soft Deletes

Several models include

```

deletedAt

```

Purpose

Prevent permanent data loss.

Deleted records remain in the database but are hidden from normal application queries.

---

# Current Relationships

```

User

├── Building

│

├── ActivityLog

│

└── TenantProfile

↓

Lease

├── Rent

└── UtilityBill

↓

PaymentHistory

Building

↓

Floor

↓

Flat

↓

Lease

Building

↓

Notice

Building

↓

JoinRequest

```

---

# Indexes

Indexes are used throughout the schema to improve query performance.

Examples

- email
- ownerId
- buildingId
- floorId
- leaseId
- status
- createdAt

Future indexes should be added only when necessary.

---

# Database Principles

The schema follows these principles.

- Normalize data.
- Avoid duplication.
- Use relations instead of repeated fields.
- Use enums instead of strings.
- Index frequently queried columns.
- Use soft deletes where appropriate.

---

# Future Database Changes

Whenever a new model is introduced

Update this document.

Whenever a relation changes

Update this document.

Whenever an enum changes

Update this document.

Whenever Prisma schema changes

Run

```bash
npx prisma migrate dev
```

Then update this documentation.

This document should always match `prisma/schema.prisma`.