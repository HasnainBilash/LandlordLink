# Project Architecture

> This document defines the architecture of LandlordLink.
>
> It is the technical reference for how the application is structured and how new features should be implemented.
>
> Every new module should follow the architecture described here.
>
> Unless a genuine architectural limitation is discovered, this architecture is considered **frozen (Architecture v2.0)**.

---

# Architecture Goals

The project is designed around five principles.

- Scalability
- Maintainability
- Consistency
- Readability
- Simplicity

Every architectural decision should improve one or more of these principles.

---

# High-Level Architecture

The application follows a layered architecture.

```
Browser

↓

Next.js App Router

↓

React Components

↓

Server Actions

↓

Prisma ORM

↓

PostgreSQL
```

Each layer has a clearly defined responsibility.

---

# Layer Responsibilities

## Browser

Responsible for:

- Rendering pages
- User interaction
- Form submission
- Navigation

Business logic should never exist here.

---

## React Components

Responsible for:

- Rendering UI
- Collecting user input
- Displaying server data
- Composing reusable interfaces

React Components should remain as "dumb" as possible.

Business logic belongs elsewhere.

---

## Server Actions

Responsible for:

- Business logic
- Validation
- Authentication
- Authorization
- Database operations
- Redirects
- Cache revalidation

All internal CRUD operations should use Server Actions.

---

## Prisma ORM

Responsible for:

- Database communication
- Queries
- Transactions
- Relations

Prisma should not contain business logic.

---

## PostgreSQL

Responsible only for data persistence.

---

# Architectural Principles

## Principle 1

Business logic belongs in Server Actions.

Never inside components.

---

## Principle 2

Validation belongs in Zod.

Never duplicate validation inside components.

---

## Principle 3

Database access belongs inside Prisma.

Components should never query the database directly.

---

## Principle 4

UI components remain reusable.

Business-specific UI belongs in feature components.

Generic UI belongs inside

```
src/components/ui
```

---

## Principle 5

Every module follows the same CRUD architecture.

Consistency is more valuable than cleverness.

---

# Project Structure

```
src
│
├── actions
├── app
├── components
├── lib
├── types
│
├── auth.ts
├── auth.config.ts
└── proxy.ts
```

Each folder has one clear responsibility.

---

# Root Files

## auth.ts

Purpose

Initializes Auth.js.

Exports

- auth()
- signIn()
- signOut()
- handlers

Used by

- Server Actions
- Server Components
- Auth API Route

Status

✅ Complete

---

## auth.config.ts

Purpose

Contains all authentication configuration.

Responsibilities

- Credentials Provider
- JWT callbacks
- Session callbacks
- Redirect callbacks
- Custom auth pages

Status

✅ Complete

---

## proxy.ts

Purpose

Protect route access before rendering.

Responsibilities

- Redirect unauthenticated users
- Allow public pages
- Protect dashboard routes

Status

✅ Complete

---

# Source Directory

```
src
│
├── actions
├── app
├── components
├── lib
└── types
```

Each directory exists for a specific purpose.

Avoid introducing folders that overlap responsibilities.

---

# src/actions

Purpose

Contains all Server Actions.

Responsibilities

- Business logic
- Validation
- Authorization
- Ownership checks
- CRUD operations

Never place UI code here.

---

## Current Structure

```
actions

auth.ts

login.ts

register.ts

building/
    create-building.ts
    get-building.ts
    get-buildings.ts
    update-building.ts
    delete-building.ts

floor/
    create-floor.ts
    create-floors-bulk.ts
    get-floor.ts
    get-floors.ts
    update-floor.ts
    delete-floor.ts

flat/
    create-flat.ts
    create-flats-bulk.ts
    get-flat.ts
    get-flats.ts
    update-flat.ts
    delete-flat.ts

quick-setup/
    quick-setup-building.ts
```

As additional modules are introduced, each module receives its own directory.

Example

```
actions

building/

floor/

flat/

tenant/

lease/

payment/
```

---

## Cross-Entity Actions

Most actions belong to a single entity and live in that entity's folder
(`floor/create-floor.ts` only touches Floor). Some actions genuinely span
multiple entities in one transaction — `quick-setup/quick-setup-building.ts`
creates Floors *and* Flats together as one atomic operation.

These get their own top-level folder named after the workflow, not after
any single entity, so it's clear at a glance that the action doesn't belong
to — and shouldn't be expected to follow the exact CRUD shape of — a single
model's folder.

---

# Action Design

Each action should have a single responsibility.

Examples

```
create-building.ts
```

Creates one building.

---

```
update-building.ts
```

Updates one building.

---

```
delete-building.ts
```

Soft deletes one building.

Avoid large "service" files that perform unrelated tasks.

---

# CRUD Pattern

Every entity should follow the same structure.

```
create-entity.ts

get-entity.ts

get-entities.ts

update-entity.ts

delete-entity.ts
```

This consistency makes navigation easier and reduces cognitive load.

---

# Server Action Philosophy

Server Actions are the default mechanism for internal CRUD operations.

Reasons

- Simpler architecture
- Fewer moving parts
- Type safety
- Reduced boilerplate
- Better integration with App Router

API routes should only be introduced when required.

Examples

- Auth.js
- Webhooks
- Third-party integrations
- External APIs

Internal CRUD should not use API routes unless there is a compelling architectural reason.

---

# Validation

Every mutation should follow the same order.

```
Authenticate

↓

Validate

↓

Authorize

↓

Execute

↓

Redirect / Return
```

Validation should always occur before database operations.

---

# Ownership

Protected resources should verify ownership.

Example

Building updates.

Instead of updating by

```
id
```

Update using

```
id

+

ownerId
```

This prevents users from modifying resources they do not own.

Ownership validation should exist in every protected module.

---

# Soft Delete

Entities should prefer soft delete over hard delete.

Instead of removing rows,

set

```
deletedAt
```

Filtering should ignore deleted records by default.

Hard deletion should be reserved for administrative or maintenance operations.

# src/app

The application uses the **Next.js App Router**.

Routes are organized by feature rather than by technical layer.

```
app
│
├── (auth)
├── (landlord)
├── api
│
├── globals.css
├── layout.tsx
└── page.tsx
```

---

# Route Groups

The project uses Route Groups to separate public and protected areas.

```
(auth)
```

Contains authentication pages.

```
(landlord)
```

Contains all authenticated landlord pages.

```
(tenant)
```

Contains all authenticated tenant pages. Introduced alongside the Tenant
Profiles module — deliberately minimal (no sidebar, a single page for now)
since Tenant-facing features are only just beginning. Future Tenant-facing
modules (Join Requests, Lease viewing) should add pages under this group,
not under `(landlord)`.

Additional groups may be introduced later when new user roles exist.

Example

```
(admin)
```

---

# Public Routes

```
/

Landing page
```

```
/login
```

```
/register
```

Public routes should never require authentication.

---

# Protected Routes

```
/dashboard
```

Everything beneath the dashboard requires authentication, and is intended
for the `LANDLORD` role.

```
/tenant
```

Everything beneath this requires authentication, and is intended for the
`TENANT` role.

Authentication is enforced by

```
proxy.ts
```

`proxy.ts` also enforces role-based guarding between the two areas: a
`TENANT` session hitting any `/dashboard/*` route is redirected to
`/tenant`, and a `LANDLORD` session hitting any `/tenant/*` route is
redirected to `/dashboard`. This is guarding, not authorization at the
data layer — Server Actions still independently verify ownership/role on
every mutation, the same as always. The route guard just prevents a
logged-in user from landing on a confusing empty page meant for the other
role.

---

# Module-Based Routing

Every business module receives its own folder.

Example

```
dashboard

buildings

floors

flats

tenants

leases

payments
```

Modules should never mix responsibilities.

---

# CRUD Route Structure

Every entity follows the same routing pattern.

```
entity/

page.tsx
```

List page.

---

```
entity/new/page.tsx
```

Create page.

---

```
entity/[id]/page.tsx
```

Details page.

---

```
entity/[id]/edit/page.tsx
```

Edit page.

This pattern should remain consistent across the application.

---

# Building Module

Current structure

```
dashboard

buildings

page.tsx

new/page.tsx

[id]/page.tsx

[id]/edit/page.tsx
```

This structure becomes the template for every future CRUD module.

---

# Details Page Philosophy

Every major entity should have its own Details page.

Examples

```
Building
```

↓

```
Building Details
```

Later

```
Floor
```

↓

```
Floor Details
```

Later

```
Flat
```

↓

```
Flat Details
```

The Details page becomes the central location for navigating deeper into related resources.

Example

```
Building

↓

Floors

↓

Flats

↓

Tenant
```

---

# Server Components

Server Components are the default.

Use Server Components whenever:

- Fetching data
- Rendering pages
- Reading sessions
- Reading from Prisma

Benefits

- Smaller client bundle
- Faster rendering
- Better security
- Direct database access

---

# Client Components

Use Client Components only when required.

Examples

- Forms
- Interactive dialogs
- Dropdown menus
- Tabs
- Client-side state
- Optimistic UI

Avoid marking entire pages with

```
"use client"
```

unless absolutely necessary.

---

# Layouts

Layouts should provide shared UI only.

Examples

- Sidebar
- Header
- Navigation
- Breadcrumbs
- Theme

Layouts should not contain business logic.

---

# src/components

Purpose

Reusable interface components.

Structure

```
components

auth

building

layout

ui
```

Feature-specific components belong inside their feature folder.

Reusable UI belongs inside

```
ui
```

---

# Feature Components

Example

```
components

building

building-form.tsx

building-card.tsx

building-table.tsx

delete-building-button.tsx
```

These components understand the Building domain.

They may compose generic UI components.

---

# UI Components

```
components/ui
```

Contains generic building blocks.

Examples

- Button
- Input
- Card
- Badge
- Table
- Dialog
- Sheet
- Tabs
- Select

These components should never contain business logic.

They should be reusable by every module.

---

# Form Architecture

Forms should remain presentation-focused.

Responsibilities

- Render fields
- Collect input
- Submit Server Action

Forms should not:

- Query Prisma
- Validate business rules
- Check authorization

Those belong in Server Actions.

---

# Reusable Forms

When Create and Edit pages share fields, use one reusable form.

Example

```
BuildingForm
```

Used by

```
Create Building
```

and

```
Edit Building
```

The page provides:

- action
- submitText
- defaultValues

The form remains reusable.

---

# Page Responsibilities

## List Page

Responsible for

- Fetching entities
- Displaying collection
- Navigation

---

## Create Page

Responsible for

- Rendering reusable form
- Passing create action

---

## Details Page

Responsible for

- Displaying entity
- Showing related information
- Navigation to child resources
- Edit
- Delete

---

## Edit Page

Responsible for

- Fetching entity
- Passing default values
- Passing update action

---

# Component Hierarchy

A typical flow looks like

```
Page

↓

Feature Component

↓

UI Components
```

Example

```
page.tsx

↓

BuildingForm

↓

Input

Button

Textarea

Label
```

This separation keeps pages small and feature components reusable.

---

# Navigation Philosophy

Users should naturally move down the domain hierarchy.

Example

```
Buildings

↓

Building Details

↓

Floors

↓

Floor Details

↓

Flats

↓

Flat Details

↓

Tenant
```

Avoid forcing users back to list pages unnecessarily.

The Details page should act as the hub for each entity.

The full navigation specification — breadcrumb trails, back-button
destinations, and a page-by-page arrival/action/exit map — lives in

```
docs/06_NAVIGATION_UX.md
```

Every nested page should implement both a `Breadcrumbs` trail and a
`BackLink`, per that document. This was retrofitted onto the Floors module
after the fact; future modules should implement it from the start.

---

# Folder Naming

Use singular names for files.

Example

```
building-form.tsx

building-card.tsx
```

Use plural names for collections and routes.

Example

```
buildings/

floors/

tenants/
```

Maintain this convention consistently.

---

# File Naming

Prefer descriptive filenames.

Examples

```
create-building.ts

update-building.ts

delete-building.ts

get-building.ts

get-buildings.ts
```

Avoid generic names such as

```
service.ts

utils.ts

helpers.ts
```

unless they truly represent shared utilities.

---

# Component Size

Components should generally have one responsibility.

If a component grows too large because it handles multiple concerns, split it into smaller components rather than creating deeply nested conditional logic.

# src/lib

The `lib` directory contains shared application logic that is not tied to a single feature.

Current structure

```
lib

prisma.ts

utils.ts

validations/
```

---

## prisma.ts

Purpose

Creates a singleton Prisma Client.

Responsibilities

- Initialize Prisma
- Prevent multiple clients during development
- Export a reusable Prisma instance

Business logic should never be added here.

---

## utils.ts

Purpose

General helper functions shared across the application.

Examples

- className helpers
- formatting utilities
- generic reusable functions

Avoid placing business-specific helpers here.

If a helper is only used by one module, keep it inside that module instead.

---

# Validation

Validation schemas belong inside

```
src/lib/validations
```

Current

```
auth.ts

building.ts
```

Future

```
floor.ts

flat.ts

tenant.ts

lease.ts

payment.ts
```

Every entity should own its own validation schema.

---

# Validation Responsibilities

Validation should verify

- Required fields
- Data types
- Length limits
- Allowed values
- Business input rules

Validation should happen before any database operation.

---

# src/types

Purpose

Contains shared TypeScript types used across multiple modules.

Current

```
next-auth.d.ts

action-result.ts
```

Future shared types should also live here.

Examples

```
pagination.ts

filters.ts

api.ts
```

Avoid duplicating interfaces across features.

---

# Action Results

Server Actions that return data instead of redirecting should use a shared return type.

Example

```
ActionResult
```

This provides consistency between actions.

Typical fields

- success
- message
- errors

Using a shared result type keeps error handling predictable across modules.

---

# Authentication Architecture

Authentication is centralized.

Flow

```
Browser

↓

Login Form

↓

login.ts

↓

Auth.js

↓

Credentials Provider

↓

JWT

↓

Session
```

No feature module should implement its own authentication logic.

Always use

```
auth()
```

inside Server Actions and Server Components.

---

# Authorization

Authentication answers

"Who is the user?"

Authorization answers

"Can this user perform this action?"

Every protected mutation should verify ownership before modifying data.

---

# Database Access

Only Server Actions should communicate with Prisma.

Never import Prisma directly into

- Client Components
- UI Components
- Browser code

This keeps the database layer isolated.

---

# Caching

Whenever a mutation changes data displayed elsewhere, the corresponding route should be revalidated.

Typical flow

```
Update

↓

Database

↓

revalidatePath()

↓

redirect()
```

This ensures users always see fresh data after mutations.

---

# Redirects

Successful create and update actions should normally redirect.

Typical pattern

```
Create

↓

Details Page
```

Example

```
/dashboard/buildings/{id}
```

Successful delete operations should redirect to the collection page.

Example

```
/dashboard/buildings
```

---

# Soft Delete Strategy

Entities should remain recoverable whenever possible.

Instead of deleting rows,

set

```
deletedAt
```

Queries should ignore deleted records unless explicitly requested.

---

# Module Blueprint

Every new CRUD module should follow this structure.

```
actions/

entity/

create-entity.ts

get-entity.ts

get-entities.ts

update-entity.ts

delete-entity.ts
```

```
app/

entity/

page.tsx

new/page.tsx

[id]/page.tsx

[id]/edit/page.tsx
```

```
components/

entity/

entity-form.tsx

entity-table.tsx

entity-card.tsx
```

```
lib/

validations/

entity.ts
```

Following this blueprint keeps every module consistent.

---

# Feature Completion Checklist

Before a module is considered complete, verify that it includes:

- List page
- Create page
- Details page
- Edit page
- Soft delete
- Ownership validation
- Zod validation
- Prisma integration
- Server Actions
- Reusable components
- Documentation updates

If any of these are missing, the module is still considered in development.

---

# Documentation Workflow

Documentation is part of development.

Whenever architecture changes

Update

```
02_ARCHITECTURE.md
```

Whenever the database changes

Update

```
03_DATABASE.md
```

Whenever conventions change

Update

```
05_CONVENTIONS.md
```

Whenever development progress changes

Update

```
00_PROJECT_MEMORY.md

01_ROADMAP.md

04_CHANGELOG.md
```

A feature is not considered complete until the relevant documentation has also been updated.

---

# Development Workflow

Every feature should follow the same process.

1. Discuss architecture
2. Confirm design
3. Implement
4. Test manually
5. Refactor if needed
6. Update documentation
7. Commit

Skipping documentation is considered an incomplete implementation.

---

# Consistency Rules

Prefer consistency over cleverness.

When implementing a new module:

- Follow the existing folder structure.
- Reuse existing patterns.
- Avoid introducing alternative architectures without a strong justification.
- Prefer extending the current design rather than replacing it.

This keeps the project understandable as it grows.

---

# Architecture Version

Current Version

**Architecture v2.0**

This architecture reflects the completion of the Authentication and Building modules.

Future modules should follow the same architectural patterns unless a compelling reason exists to evolve the design.

Any architectural changes should be discussed before implementation and documented in this file.

---

# Summary

LandlordLink follows a modular, feature-oriented architecture built on:

- Next.js App Router
- Server Components by default
- Client Components only for interactivity
- Server Actions for internal CRUD operations
- Prisma ORM for database access
- Auth.js for authentication
- Zod for validation
- Reusable UI components
- Feature-specific business components
- Consistent CRUD patterns
- Breadcrumb + back-button navigation on every nested page
- Documentation-first development

The Building, Floors, and Flats modules serve as the reference
implementation for all future modules.