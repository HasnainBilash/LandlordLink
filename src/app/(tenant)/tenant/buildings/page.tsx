import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ChevronRight, KeyRound, MapPin, Search } from "lucide-react";

import { findBuildingByAccessCode } from "@/actions/join-request/get-building-for-tenant";
import { searchBuildingsWithVacantFlats } from "@/actions/join-request/search-buildings-with-vacant-flats";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { surface, surfaceLink } from "@/components/ui/surface";
import { formatMoney, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<{ q?: string; code?: string }>;
};

export default async function FindFlatPage({ searchParams }: PageProps) {
  const { q, code } = await searchParams;

  // "I have a code" goes straight to that building's flats, with the code
  // filled in for the request.
  let codeNotFound = false;

  if (code?.trim()) {
    const building = await findBuildingByAccessCode(code);

    if (building) {
      redirect(
        `/tenant/buildings/${building.id}/flats?code=${encodeURIComponent(code.trim().toUpperCase())}`
      );
    }

    codeNotFound = true;
  }

  const buildings = await searchBuildingsWithVacantFlats(q?.trim() || undefined);

  return (
    <>
      <PageHeader
        title="Find a flat"
        description="Use the access code your landlord gave you, or browse buildings with vacant flats."
      />

      <section className="bg-brand-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-blue-600/20 md:p-8">
        <div className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full bg-white/10 blur-2xl" />

        <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-2">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
              <KeyRound className="size-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">Have an access code?</h2>
            <p className="max-w-lg text-sm text-white/80">
              Landlords share it after you&apos;ve talked to them. It takes you
              straight to their building.
            </p>
          </div>

          <form className="flex flex-col gap-2 sm:flex-row">
            <Input
              name="code"
              required
              autoComplete="off"
              placeholder="e.g. 7K4XPQ2M"
              defaultValue={code ?? ""}
              aria-label="Access code"
              className="h-10 border-white/40 bg-white font-mono text-slate-900 uppercase placeholder:font-sans placeholder:text-slate-500 placeholder:normal-case focus-visible:ring-white/50 sm:w-56 dark:bg-white"
            />
            <Button type="submit" size="lg" className="bg-white text-blue-800 hover:bg-white/90">
              Go to building
            </Button>
          </form>
        </div>

        {codeNotFound && (
          <p role="alert" className="relative mt-4 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium">
            No building matches that code. Check it with your landlord.
          </p>
        )}
      </section>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Buildings with vacant flats</h2>

          <form className="flex gap-2 sm:w-96">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Name, area or city"
                aria-label="Search buildings"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>
        </div>

        {buildings.length === 0 ? (
          <EmptyState
            icon={q ? Search : Building2}
            title={q ? "No buildings match that search" : "No vacant flats right now"}
            description={q ? "Try another name, area or city." : "Check back later, or ask your landlord for their access code."}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buildings.map((building) => (
              <Link
                key={building.id}
                href={`/tenant/buildings/${building.id}/flats`}
                className={cn(surface, surfaceLink, "group flex flex-col gap-4 p-5")}
              >
                <div className="flex items-start gap-3">
                  <span className="bg-brand-gradient flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md shadow-blue-600/20">
                    <Building2 className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{building.name}</p>
                    <p className="flex gap-1 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      <span className="line-clamp-2">
                        {building.address}, {building.city}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm">
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {pluralize(building.vacantFlats, "vacant flat")}
                  </span>
                  {building.lowestRent !== null && (
                    <span className="text-muted-foreground">
                      from{" "}
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatMoney(building.lowestRent)}
                      </span>
                      /mo
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
