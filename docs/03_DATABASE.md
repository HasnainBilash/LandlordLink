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

Lease                   (schema + application partial — created/ended via
                         Join Request approve/end-lease, no standalone
                         Renewal/Expiration UI yet)

↓

Rent                    (schema only — not yet built)

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

Landlord Approval → Flat marked OCCUPIED, other pending requests
                     for that Flat auto-REJECTED
        or
Landlord Rejection → Flat stays VACANT

↓ (later)

Landlord Ends Tenancy → status ENDED, Flat marked VACANT again

↓

Lease Created (not yet built — see Lease Management)

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

Represents monthly rent.

Unique Constraint

```

leaseId

month

year

```

This prevents duplicate rent entries for the same month.

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