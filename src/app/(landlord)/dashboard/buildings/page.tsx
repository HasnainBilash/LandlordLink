import Link from "next/link";
import { Building2, ChevronRight, Inbox, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { getBuildings } from "@/actions/building/get-buildings";

import { AddBuildingButton } from "@/components/building/add-building-button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { HiddenBadge } from "@/components/ui/status-badges";
import { surface, surfaceLink } from "@/components/ui/surface";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

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
          icon={Building2}
          title="No buildings yet"
          description="Add your first building to start managing flats and tenants."
          action={<AddBuildingButton />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {buildings.map((building) => {
            const occupancy =
              building.totalFlats > 0
                ? Math.round((building.occupied / building.totalFlats) * 100)
                : 0;

            return (
              <Link
                key={building.id}
                href={`/dashboard/buildings/${building.id}`}
                className={cn(surface, surfaceLink, "group flex flex-col gap-5 p-5")}
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

                {building.totalFlats > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {building.occupied} of {pluralize(building.totalFlats, "flat")} rented
                      </span>
                      <span className="font-semibold tabular-nums">{occupancy}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="bg-brand-gradient h-2 rounded-full"
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No flats yet — open it to add floors and flats.
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-4">
                  <Chip>{pluralize(building.floorCount, "floor")}</Chip>
                  {building.totalFlats > 0 && <Chip>{building.vacant} vacant</Chip>}
                  {building.pendingRequests > 0 && (
                    <Chip className="bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      <Inbox className="size-3.5" />
                      {pluralize(building.pendingRequests, "request")}
                    </Chip>
                  )}
                  {building.status === "INACTIVE" && <HiddenBadge />}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}
