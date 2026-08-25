# Navigation & UX Design

> This document defines how a user moves through LandLordLink —
> what every page does, how the user arrives there, and how they leave it.
>
> It exists because navigation was added ad-hoc during the Floors module build
> (2 of 10 pages got a back button, 8 didn't). This document fixes that by
> designing navigation once, consistently, before more modules are added.

---

# Problem Being Solved

Today, a user can go **forward** through the hierarchy (Buildings → Building →
Floors → Floor) but has no reliable way to go **back** except the browser's
back button — which breaks after a form submission/redirect. Concretely:

| Page | Has back navigation today? |
|---|---|
| Buildings List | ❌ No |
| New Building | ❌ No |
| Building Details | ❌ No |
| Edit Building | ❌ No |
| Floors List | ✅ Yes |
| New Floor | ❌ No |
| Bulk Create Floors | ✅ Yes |
| Floor Details | ❌ No (has a link to Building, but skips Floors List) |
| Edit Floor | ❌ No |
| Dashboard | N/A (it's the root) |

This document defines the fix and the target state for every page above.

---

# Navigation Philosophy

Two complementary mechanisms, used together on every nested page:

## 1. Breadcrumbs (full path awareness)

A single line at the top of every page below the root, showing the entire
path from Dashboard down to the current page. Every segment except the
current one is a clickable link.

Example, on the Edit Floor page:

```
Dashboard / Buildings / Sunrise Apartment / Floors / Floor 3 / Edit
```

This lets a user jump back to **any** ancestor level in one click, not just
one step back.

## 2. Back Button (one-step muscle memory)

A single "← [Destination]" button, using the existing `BackLink` component,
placed above the page title. This is the fast, thumb-friendly option for the
most common action: going back exactly one level.

**Why both:** breadcrumbs solve "I want to jump to Buildings from deep inside
a Floor", while the back button solves "I just want to go back one step,
right now, without reading a breadcrumb trail." Mobile users especially lean
on the second.

## 3. Sidebar (top-level jumps only)

The existing sidebar stays as-is for jumping between top-level modules
(Dashboard, Buildings). It is not responsible for traversing *within* a
module — that's what breadcrumbs + back buttons do.

**Sidebar fix needed:** it currently links to `/dashboard/flats`,
`/dashboard/tenants`, `/dashboard/payments` — none of which exist yet. These
should be visually disabled (grayed out, non-clickable, "Coming soon" label)
until those modules are actually built, so the user never hits a dead 404
from the sidebar itself.

---

# Component Plan

## `Breadcrumbs` (new component)

`src/components/ui/breadcrumbs.tsx` — generic, reusable, takes a list of
`{ label, href }` items (last item has no `href`, rendered as plain text).

## `BackLink` (already built)

`src/components/ui/back-link.tsx` — already exists and works. No changes
needed, just needs to be added to the pages that are missing it.

## Sidebar update

`src/components/layout/app-sidebar.tsx` — mark unbuilt modules as disabled.

---

# Page-by-Page Specification

For every page: **Purpose**, **How the user arrives**, **Primary actions**,
**Breadcrumb trail**, **Back button destination**.

## Dashboard — `/dashboard`

- **Purpose:** Landing page after login. Overview of the account.
- **Arrives from:** Login, or sidebar "Dashboard" link.
- **Primary actions:** Link into Buildings.
- **Breadcrumb:** _(none — this is the root)_
- **Back button:** _(none)_

## Buildings List — `/dashboard/buildings`

- **Purpose:** List every building the landlord owns.
- **Arrives from:** Sidebar "Buildings" link, or any breadcrumb's "Buildings" crumb.
- **Primary actions:** "Add Building" → New Building. Click a card → Building Details.
- **Breadcrumb:** `Dashboard / Buildings`
- **Back button:** → Dashboard

## New Building — `/dashboard/buildings/new`

- **Purpose:** Create a building.
- **Arrives from:** "Add Building" button on Buildings List.
- **Primary actions:** Submit → redirects to the new Building's Details page.
- **Breadcrumb:** `Dashboard / Buildings / New`
- **Back button:** → Buildings List

## Building Details — `/dashboard/buildings/[id]`

- **Purpose:** Hub for one building. Overview stats, entry point to Floors.
- **Arrives from:** Clicking a building card, or a breadcrumb.
- **Primary actions:** "Manage Floors", "Edit Building", "Delete Building".
- **Breadcrumb:** `Dashboard / Buildings / {Building Name}`
- **Back button:** → Buildings List

## Edit Building — `/dashboard/buildings/[id]/edit`

- **Purpose:** Edit a building's fields.
- **Arrives from:** "Edit Building" button on Building Details.
- **Primary actions:** Save → redirects to Building Details.
- **Breadcrumb:** `Dashboard / Buildings / {Building Name} / Edit`
- **Back button:** → Building Details

## Floors List — `/dashboard/buildings/[id]/floors`

- **Purpose:** List floors for one building.
- **Arrives from:** "Manage Floors" button or Floors stat link on Building Details.
- **Primary actions:** "Add Floor", "Add Multiple" (bulk). Click a floor card → Floor Details.
- **Breadcrumb:** `Dashboard / Buildings / {Building Name} / Floors`
- **Back button:** → Building Details ✅ *(already correct)*

## New Floor — `/dashboard/buildings/[id]/floors/new`

- **Purpose:** Create a single floor.
- **Arrives from:** "Add Floor" button on Floors List.
- **Primary actions:** Submit → redirects to the new Floor's Details page.
- **Breadcrumb:** `Dashboard / Buildings / {Building Name} / Floors / New`
- **Back button:** → Floors List *(currently missing — needs adding)*

## Bulk Create Floors — `/dashboard/buildings/[id]/floors/bulk`

- **Purpose:** Create a range of floors at once.
- **Arrives from:** "Add Multiple" button on Floors List.
- **Primary actions:** Submit → redirects to Floors List.
- **Breadcrumb:** `Dashboard / Buildings / {Building Name} / Floors / Add Multiple`
- **Back button:** → Floors List ✅ *(already correct)*

## Floor Details — `/dashboard/buildings/[id]/floors/[floorId]`

- **Purpose:** Hub for one floor. Flat statistics, entry point to Flats (once that module exists).
- **Arrives from:** Clicking a floor card on Floors List.
- **Primary actions:** "Edit Floor", "Delete Floor".
- **Breadcrumb:** `Dashboard / Buildings / {Building Name} / Floors / {Floor Name}`
- **Back button:** → Floors List *(currently jumps straight to Building, skipping Floors List — needs fixing)*

## Edit Floor — `/dashboard/buildings/[id]/floors/[floorId]/edit`

- **Purpose:** Edit a floor's fields.
- **Arrives from:** "Edit Floor" button on Floor Details.
- **Primary actions:** Save → redirects to Floor Details.
- **Breadcrumb:** `Dashboard / Buildings / {Building Name} / Floors / {Floor Name} / Edit`
- **Back button:** → Floor Details *(currently missing — needs adding)*

---

# Rollout Plan (incremental, one page tested at a time)

Matches the same one-step-at-a-time process used for the Floors module itself.

1. Build the `Breadcrumbs` component in isolation, test it on **one** page (Floors List, since it already has a working `BackLink` to compare against).
2. Add breadcrumbs + fix the missing/incorrect back button on **New Floor**.
3. Add breadcrumbs + fix the missing back button on **Floor Details** and **Edit Floor**.
4. Add breadcrumbs + back button to **Building Details**, **Edit Building**, **New Building**, **Buildings List**.
5. Disable the dead sidebar links (Flats, Tenants, Payments) with a "Coming soon" state.
6. Update `02_ARCHITECTURE.md`'s Navigation Philosophy section to reference this document, since it now supersedes the informal notes there.

Each step ships as its own small diff and gets tested before the next one starts.

---

# Future Modules

Every future module (Flats, Tenants, Leases, Payments) should follow this
same breadcrumb + back-button pattern from the start, rather than retrofitting
it afterward as happened with Floors.
