# LandlordLink

A modern, production-ready building management system built with Next.js, Prisma, PostgreSQL and Auth.js.

LandlordLink lets landlords manage buildings, floors, flats, tenants, leases, rent collection, utility bills, notices, activity logs, and reports through a secure web application — and gives tenants a structured, secure way to find a flat, request to join, and track their own lease and payments.

---

## Project Status

Current Stage

🟢 Active Development

All 7 phases of the original roadmap are complete, followed by a UX
simplification pass. See `docs/01_ROADMAP.md` for what's next
(Future Enhancements — unsequenced).

---

## Features

### Authentication

- User Registration
- User Login
- Password Hashing (bcrypt)
- JWT Authentication
- Protected Routes
- Session Management
- Role-based Authentication (Landlord / Tenant)
- Server Actions
- Zod Validation

### Building Management

- Building, Floor, and Flat CRUD
- Quick Setup (bulk-generate floors + flats in one transaction)
- Building Access Codes

### Tenant Management

- Tenant Profiles
- Join Requests (search, request, approve/reject, end lease)
- Lease Management (open-ended — no fixed term)

### Finance

- Rent Management (auto-generated per month, status tracking)
- Utility Bills
- Payment History (partial payments supported)
- Reports (occupancy, revenue, outstanding balances, monthly trends)
- Analytics charts (folded into Reports)

### Communication

- Notices (building-scoped, audience-targeted, auto-expiring)
- Unread notice badge for tenants

### Monitoring

- Activity Logs (building-scoped + a global landlord feed)

---

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4

### Backend

- Server Actions
- Auth.js v5

### Database

- PostgreSQL
- Prisma ORM

### Validation

- Zod

### Authentication

- Auth.js
- JWT
- bcrypt

---

## Project Structure

See

```

docs/02_ARCHITECTURE.md

```

for the complete project architecture.

---

## Documentation

Project documentation is available inside the `docs/` directory.

- Project Memory
- Roadmap
- Architecture
- Database
- Changelog
- Conventions
- Navigation & UX

---

## Installation

Install dependencies

```bash
npm install
```

Generate Prisma Client

```bash
npx prisma generate
```

Run migrations

```bash
npx prisma migrate dev
```

Start development server

```bash
npm run dev
```

### Demo Data (optional)

To populate the database with a demo landlord, buildings, tenants, and
billing history for exploring the app:

```bash
npx tsx prisma/seed-demo-landlord.ts
```

This is purely additive — it never touches or deletes existing data.

---

## Environment Variables

Create a `.env` file.

Required variables include:

```env
DATABASE_URL=
AUTH_SECRET=
```

---

## Development Philosophy

This project prioritizes:

- Clean Architecture
- Production-ready code
- Reusable Components
- Type Safety
- Scalability
- Maintainability

---

## License

Private project.
