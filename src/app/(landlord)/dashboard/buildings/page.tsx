import Link from "next/link";
import { MapPin } from "lucide-react";

import { getBuildings } from "@/actions/building/get-buildings";

import { AddBuildingButton } from "@/components/building/add-building-button";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { HiddenBadge } from "@/components/ui/status-badges";
import { pluralize } from "@/lib/format";

export default async function BuildingsPage() {
  const buildings = await getBuildings();

  return (
    <>
      <PageHeader
        title="Buildings"
        description="Open a building to manage its floors, flats, tenants and notices."
        actions={buildings.length > 0 && <AddBuildingButton />}
      />

      {buildings.length === 0 ? (
        <EmptyState
          title="No buildings yet"
          description="Add your first building to start managing flats and tenants."
          action={<AddBuildingButton />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {buildings.map((building) => (
            <Link
              key={building.id}
              href={`/dashboard/buildings/${building.id}`}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-ring"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold group-hover:underline">
                    {building.name}
                  </p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {building.address}, {building.city}
                    </span>
                  </p>
                </div>

                {building.pendingRequests > 0 && (
                  <Badge variant="destructive">
                    {pluralize(building.pendingRequests, "request")}
                  </Badge>
                )}
              </div>

              {building.totalFlats > 0 ? (
                <div className="space-y-1.5">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{
                        width: `${(building.occupied / building.totalFlats) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {building.occupied} of {pluralize(building.totalFlats, "flat")} rented
                    · {building.vacant} vacant
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No flats yet — open it to add floors and flats.
                </p>
              )}

              {building.status === "INACTIVE" && (
                <div>
                  <HiddenBadge />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
