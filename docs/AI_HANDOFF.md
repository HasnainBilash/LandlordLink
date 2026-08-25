# AI Handoff Guide

> This document explains how any AI assistant should work on this project.
>
> Read this file before making changes.
>
> The goal is to preserve the project's architecture, consistency, and long-term maintainability.

---

# Step 1 — Read Documentation First

Before reading source code, read the documentation in this order.

1. 00_PROJECT_MEMORY.md
2. 02_ARCHITECTURE.md
3. 05_CONVENTIONS.md
4. 03_DATABASE.md
5. 01_ROADMAP.md
6. 04_CHANGELOG.md

These documents describe the intended architecture and development philosophy.

---

# Step 2 — Verify Against the Code

Documentation describes the intended architecture.

The repository contains the implementation.

If documentation and code disagree:

- Do not assume the documentation is correct.
- Do not silently assume the code is correct.
- Inspect both.
- Tell the developer about the discrepancy before making changes.

Never "fix" one by guessing.

---

# Project Philosophy

The project prioritizes

- Correctness
- Consistency
- Scalability
- Maintainability
- Readability

over

- Speed
- Clever shortcuts
- Premature optimization

The goal is a production-quality application.

---

# Development Philosophy

Before implementing anything

Understand

- the architecture
- the existing module
- the coding conventions

New code should extend the current design instead of introducing a different one.

---

# Architecture Rules

The project follows these rules.

- Next.js App Router
- TypeScript
- Server Components by default
- Client Components only when necessary
- Server Actions for internal CRUD
- Prisma ORM
- PostgreSQL
- Auth.js
- Zod validation

Do not replace these technologies without explicit discussion.

---

# CRUD Standard

Every major entity follows the same structure.

Actions

```
create-entity.ts

get-entity.ts

get-entities.ts

update-entity.ts

delete-entity.ts
```

Routes

```
entity/

page.tsx

new/page.tsx

[id]/page.tsx

[id]/edit/page.tsx
```

Components

```
entity-form.tsx

entity-card.tsx

entity-table.tsx
```

Future modules should follow the Building module.

---

# Building Module

The Building module is the reference implementation.

When implementing

- Floors
- Flats
- Tenants
- Leases
- Payments

follow the same architectural patterns whenever appropriate.

---

# Documentation

Documentation is part of development.

Whenever code changes, determine whether one or more documentation files should also be updated.

A feature is not considered complete until the documentation reflects it.

---

# When Information Is Missing

Do not guess.

Ask.

Examples

- missing file
- unclear implementation
- architectural uncertainty
- business rules

It is better to ask one question than implement the wrong solution.

---

# When Existing Code Looks Wrong

Do not immediately rewrite it.

First determine

- whether it is intentional
- whether another module depends on it
- whether changing it affects architecture

Explain the issue before proposing changes.

---

# Refactoring

Small refactors are encouraged when they improve

- readability
- consistency
- maintainability

Large architectural refactors should always be discussed first.

---

# Preferred Workflow

For every feature

1. Understand the requirement.
2. Inspect the existing implementation.
3. Compare with project architecture.
4. Discuss major design decisions if needed.
5. Implement.
6. Test.
7. Update documentation if necessary.

---

# Communication Style

When helping with this project

- Explain architectural trade-offs.
- Point out inconsistencies.
- Recommend best practices.
- Avoid unnecessary rewrites.
- Preserve existing patterns whenever possible.

If a better solution exists, explain why before changing the implementation.

---

# Repository Rules

Never assume file contents.

If a file is needed and has not been provided:

Ask for it.

Never invent missing implementations.

---

# Source of Truth

Priority order

1. Current repository code
2. Project documentation
3. Developer instructions
4. Assumptions (avoid)

If assumptions become necessary, state them explicitly.

---

# Final Principle

This project is intended to become LandlordLink, a production-quality building management system.

Every contribution should move the codebase toward that goal while preserving consistency with the existing architecture.