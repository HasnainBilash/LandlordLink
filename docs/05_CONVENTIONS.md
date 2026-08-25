# Project Conventions

> This document defines the development conventions used throughout LandlordLink.
>
> These conventions exist to keep the codebase predictable, maintainable, and consistent as the project grows.

---

# Philosophy

Consistency is preferred over cleverness.

If two solutions are equally valid, choose the one that matches the existing project.

Every new feature should feel like it was written by the same developer.

---

# General Rules

- Use TypeScript everywhere.
- Use Prisma for database access.
- Use Auth.js for authentication.
- Use Zod for validation.
- Use Server Actions for internal CRUD operations.
- Keep components small and focused.
- Avoid duplicated business logic.
- Prefer composition over large components.

---

# Folder Organization

Organize code by feature rather than by technical layer whenever possible.

Example

```
actions/
    building/

components/
    building/

lib/
    validations/
```

Avoid large shared folders containing unrelated code.

---

# File Naming

Use lowercase kebab-case for filenames.

Examples

```
create-building.ts

update-building.ts

building-form.tsx

building-card.tsx
```

Avoid filenames like

```
Helper.ts

Utils.ts

Service.ts
```

unless they truly represent generic shared functionality.

---

# Route Naming

Collections use plural names.

Examples

```
/dashboard/buildings

/dashboard/floors

/dashboard/flats
```

Entity routes use the following pattern.

```
page.tsx

new/page.tsx

[id]/page.tsx

[id]/edit/page.tsx
```

Every CRUD module should follow this structure.

---

# Component Naming

React components use PascalCase.

Examples

```
BuildingForm

BuildingCard

DeleteBuildingButton
```

Files remain kebab-case.

```
building-form.tsx
```

---

# Server Actions

Every action should have one responsibility.

Preferred structure

```
create-building.ts

get-building.ts

get-buildings.ts

update-building.ts

delete-building.ts
```

Do not combine unrelated business logic into a single action.

---

# Validation

Every entity owns its own validation schema.

Examples

```
validations/

building.ts

floor.ts

flat.ts
```

Validation belongs in Zod.

Never duplicate validation inside components.

---

# Database Access

Only Server Actions communicate with Prisma.

Never import Prisma into:

- Client Components
- UI Components
- Browser code

---

# Authentication

Use

```
auth()
```

inside Server Actions and Server Components.

Never manually inspect cookies or JWTs.

Authentication should always go through Auth.js.

---

# Authorization

Always verify ownership before modifying protected resources.

Example

```
where: {
    id,
    ownerId: session.user.id,
}
```

Do not trust client input for ownership.

---

# Soft Delete

Prefer soft delete over hard delete.

Use

```
deletedAt
```

instead of permanently removing records.

Queries should ignore deleted records by default.

---

# Client Components

Use `"use client"` only when necessary.

Examples

- Forms
- Dialogs
- Dropdowns
- Local state
- Browser APIs

Everything else should remain a Server Component.

---

# Server Components

Server Components are the default.

Use them for

- Data fetching
- Rendering pages
- Reading sessions
- Reading from Prisma

Prefer Server Components unless interactivity requires otherwise.

---

# Forms

Forms should only:

- Render inputs
- Collect user data
- Submit actions

Forms should not contain business logic.

Business logic belongs inside Server Actions.

---

# Shared Components

Generic UI belongs inside

```
components/ui
```

Business-specific components belong inside their feature folder.

Example

```
components/

building/

building-form.tsx
```

---

# Reusable Forms

If Create and Edit pages share fields, use one reusable form.

The page supplies:

- action
- submitText
- defaultValues

The form remains presentation-only.

---

# Action Return Pattern

Server Actions should follow one of two patterns.

## Pattern A

Mutations that redirect.

```
Update

↓

revalidatePath()

↓

redirect()
```

## Pattern B

Mutations returning data.

Use the shared

```
ActionResult
```

type.

Do not invent different return structures for different actions.

---

# Details Pages

Every major entity should have its own Details page.

Examples

```
Building

Floor

Flat

Tenant
```

The Details page acts as the central hub for that entity.

---

# CRUD Standard

Every entity should implement:

- List
- Create
- Details
- Edit
- Soft Delete

This structure should remain consistent throughout the project.

---

# Documentation

Documentation is part of development.

Whenever code changes, determine whether documentation also needs updating.

Update the appropriate document when:

Architecture changes

→ `02_ARCHITECTURE.md`

Database changes

→ `03_DATABASE.md`

Development progress changes

→ `00_PROJECT_MEMORY.md`

Roadmap changes

→ `01_ROADMAP.md`

Project history changes

→ `04_CHANGELOG.md`

Convention changes

→ `05_CONVENTIONS.md`

A feature is not considered complete until its documentation is updated.

---

# Code Style

Prefer readable code over compact code.

Good

- Small functions
- Descriptive names
- Consistent formatting
- Early returns
- Single responsibility

Avoid

- Deep nesting
- Magic values
- Large files with unrelated responsibilities
- Premature optimization

---

# Future Modules

Every future module should follow the Building module as the reference implementation.

Examples

- Floors
- Flats
- Tenants
- Leases
- Payments

Reuse established patterns instead of inventing new ones.

---

# Final Rule

When information is missing:

**Ask.**

Do not guess.

Do not silently redesign the architecture.

Do not replace working patterns without a strong architectural reason.

Correctness and consistency are valued over speed.