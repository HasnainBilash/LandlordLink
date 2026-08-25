# Project Documentation

Welcome to the internal documentation for **LandLordLink**.

These documents are considered part of the project itself and should always remain synchronized with the source code.

---

# Documentation Structure

## 00_PROJECT_MEMORY.md

The project's second brain.

Contains everything needed to continue development without reconstructing previous conversations.

Includes:

- Current project status
- Folder structure
- Features
- Authentication
- Environment
- Installed packages
- Current sprint
- Future plans
- Important decisions
- Known issues
- Current implementation state

This is the **first document** that should be read before starting development or opening a new ChatGPT conversation.

---

## 01_ROADMAP.md

Tracks project progress.

Contains

- Sprints
- Completed work
- Current work
- Upcoming work
- Overall project completion

Update whenever a feature is completed.

---

## 02_ARCHITECTURE.md

Describes how the project is built.

Includes

- System architecture
- Folder structure
- File responsibilities
- Authentication flow
- Request flow
- Database flow
- Route organization
- Design decisions

Update whenever architecture changes.

---

## 03_DATABASE.md

Documents the database.

Includes

- Prisma models
- Enums
- Relationships
- Lifecycle of each entity
- Indexes
- Constraints
- Future database plans

Update whenever `schema.prisma` changes.

---

## 04_CHANGELOG.md

Historical record of development.

Contains

- Completed features
- Major milestones
- Important architectural changes
- Version history

Never remove previous entries.

---

## 05_CONVENTIONS.md

Project rules.

Contains coding standards and development philosophy.

Examples

- Folder organization
- Naming conventions
- Server Actions
- Validation
- Authentication
- Git workflow
- Documentation rules

Update only when a permanent project rule changes.

---

# Documentation Rules

These documents are part of the project.

Whenever a feature is completed:

- Update Project Memory
- Update Roadmap
- Update Changelog

If architecture changes:

- Update Architecture

If the database changes:

- Update Database documentation

If a permanent rule changes:

- Update Conventions

---

# Development Workflow

1. Plan the feature.
2. Implement the feature.
3. Test the feature.
4. Refactor if necessary.
5. Update documentation.
6. Commit changes.

A feature is **not considered complete** until its documentation has been updated.

---

# Philosophy

The documentation exists so that no developer—including future versions of ourselves—has to guess how the project works.

Whenever information is missing:

**Ask. Never guess.**