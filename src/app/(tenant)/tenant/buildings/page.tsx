import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, MapPin, Search } from "lucide-react";

import { findBuildingByAccessCode } from "@/actions/join-request/get-building-for-tenant";
import { searchBuildingsWithVacantFlats } from "@/actions/join-request/search-buildings-with-vacant-flats";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatMoney, pluralize } from "@/lib/format";

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />
            Have an access code?
          </CardTitle>
          <CardDescription>
            Landlords share it after you&apos;ve talked to them. It takes you
            straight to their building.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-2 sm:flex-row">
            <Input
              name="code"
              required
              autoComplete="off"
              placeholder="e.g. 7K4XPQ2M"
              defaultValue={code ?? ""}
              aria-label="Access code"
              className="font-mono uppercase placeholder:normal-case sm:max-w-xs"
            />
            <Button type="submit">Go to building</Button>
          </form>
          {codeNotFound && (
            <p className="mt-2 text-sm text-destructive">
              No building matches that code. Check it with your landlord.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <form className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search by building name, area or city"
              aria-label="Search buildings"
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        {buildings.length === 0 ? (
          <EmptyState
            title={q ? "No buildings match that search" : "No vacant flats right now"}
            description={q ? "Try another name, area or city." : "Check back later, or ask your landlord for their access code."}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buildings.map((building) => (
              <Link
                key={building.id}
                href={`/tenant/buildings/${building.id}/flats`}
                className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-ring"
              >
                <p className="font-semibold">{building.name}</p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {building.address}, {building.city}
                  </span>
                </p>
                <p className="mt-auto text-sm">
                  {pluralize(building.vacantFlats, "vacant flat")}
                  {building.lowestRent !== null && (
                    <span className="text-muted-foreground">
                      {" "}
                      · from {formatMoney(building.lowestRent)}/mo
                    </span>
                  )}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
