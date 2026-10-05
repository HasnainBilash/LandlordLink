# Upgrade Plan (v2 → production-ready)

> Work is done in large phases. Each phase ends with a commit and a
> **test checklist** for the owner. The next phase starts only after the
> owner has tested and approved the previous one.
>
> Scope of this plan: fix what exists today. New features (receipts,
> reminders, bKash, maintenance requests, …) are discussed after Phase 3.

Context: database is **Neon**, slowness observed in the **production build**.

---

## Phase 1 — Speed & Correctness (no visible redesign)

Goal: every page loads fast, data is correct, nothing is broken.
Page layout and navigation stay exactly as they are, so any difference
the owner notices should be speed only.

### Performance
- [x] Rent reconciliation: replace "3 queries per lease, on every page
      view" with a bulk version (≈3 queries total, regardless of lease
      count). Used by Reports, Building page, Flat page, Tenant flat view.
- [x] Reports: compute revenue / outstanding / monthly totals in the
      database (aggregates) instead of loading every payment ever made.
- [x] `auth()` deduplicated per request with React `cache()`.
- [x] Sidebar and tenant-nav badge counts stream in via `<Suspense>`, so
      they no longer block every page.
- [x] Independent queries run in parallel (`Promise.all`); count-only
      data uses `_count` instead of loading whole lists.
- [x] New composite indexes (Rent, Lease, JoinRequest, Notice).
- [x] Neon: pooled connection string for the app, direct one for
      migrations (`DIRECT_URL`); region guidance in README.

### Bug fixes
- [x] Payments recorded inside a transaction (no double-pay on fast clicks).
- [x] Login respects `callbackUrl` (returns to the page you came from).
- [x] Auth route moved to the standard `/api/auth/[...nextauth]`.
- [x] Proxy no longer runs on static files in `/public`.
- [x] `npm run lint` works on Next 16; dev-only packages moved to devDependencies.
- [x] `error.tsx` and `not-found.tsx` (friendly error pages).
- [x] Remove developer-only text shown to users (backfill script note);
      buildings without an access code now get one automatically.
- [x] `npm run build` and `tsc` pass with zero errors.

### Also fixed (found while working)
- [x] "Needs attention" now refreshes rent status first, and also lists
      partly-paid rent from past months (it used to miss both).
- [x] Floor count on the building page no longer counts deleted floors.
- [x] `prisma/seed.ts` (wipes the whole DB) now refuses to run unless
      `ALLOW_DB_WIPE=yes`; `prisma db seed` points at the safe test seed.

**How to test:** see [TESTING.md](TESTING.md) (test accounts, every-time
checks, Phase 1 checks).

---

## Phase 2 — Simpler Structure & UI

Goal: fewer pages, fewer clicks, works on a phone.

- [ ] Building page becomes the hub, with tabs: Units · Requests · Notices · Activity.
      Floors are shown as sections with their flats in a grid
      (Floor detail and Floor-flats pages are merged away).
- [ ] Flat page at a short URL: `/dashboard/flats/[id]`.
- [ ] Create/edit forms for floors, flats and notices open in dialogs
      instead of separate pages (~15 page files removed).
- [ ] Landlord nav: Home · Buildings · Requests · Reports (Activity lives
      in Reports and in each building).
- [ ] Home combines "Needs attention" with the key report numbers.
- [ ] Tenant area: Home (my flat, bills, notices) · Find a flat · Requests · Profile.
- [ ] Mobile layout: collapsible sidebar (sheet), responsive tables.
- [ ] Money shown via one `formatMoney()` helper, default ৳ BDT.
- [ ] Fix `<Link><Button>` nesting (invalid HTML) everywhere.
- [ ] Old URLs redirect to the new ones.
- [ ] Past dues: rent left unpaid when a lease ends is kept (never
      deleted — it is financial history and feeds Reports). It is shown
      in a "Past tenants with dues" list where the landlord can record a
      late payment or **write it off** (new WRITTEN_OFF status, excluded
      from outstanding totals).

---

## Phase 3 — Production Hardening

Goal: safe to deploy and maintain.

- [ ] Environment variables validated at startup (clear error if missing).
- [ ] Login rate limiting.
- [ ] Unit tests (Vitest) for rent, payment status and money logic.
- [ ] End-to-end smoke tests (Playwright): register, login, create
      building, approve tenant, record payment.
- [ ] GitHub Actions CI: lint, typecheck, test, build.
- [ ] Security headers; error monitoring hook (Sentry-ready).
- [ ] README: setup, Neon, deploy, seed/demo account.

---

## After Phase 3

Discuss and plan new features (separate plan).
