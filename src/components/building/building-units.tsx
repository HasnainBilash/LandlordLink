import { getBuildingUnits } from "@/actions/building/get-building-units";

import { AddFloorButton } from "@/components/floor/add-floor-button";
import { FloorActions } from "@/components/floor/floor-actions";
import { FlatTile } from "@/components/flat/flat-tile";
import { EmptyState } from "@/components/ui/empty-state";
import { formatFloor, pluralize } from "@/lib/format";

import { QuickSetupButton } from "./quick-setup-button";

// The "Units" tab: every floor of the building with its flats, so the
// landlord sees the whole building on one page.
export async function BuildingUnits({ buildingId }: { buildingId: string }) {
  const floors = await getBuildingUnits(buildingId);

  if (floors.length === 0) {
    return (
      <EmptyState
        title="No floors yet"
        description="Add floors one at a time, or use Quick setup to create every floor and flat in one go."
        action={
          <>
            <QuickSetupButton buildingId={buildingId} />
            <AddFloorButton buildingId={buildingId} />
          </>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <AddFloorButton buildingId={buildingId} variant="outline" />
      </div>

      {floors.map((floor) => {
        const occupied = floor.flats.filter((flat) => flat.status === "OCCUPIED").length;

        return (
          <section key={floor.id} className="rounded-xl border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
              <div>
                <h3 className="font-medium">{formatFloor(floor)}</h3>
                <p className="text-xs text-muted-foreground">
                  {pluralize(floor.flats.length, "flat")}
                  {floor.flats.length > 0 && ` · ${occupied} occupied`}
                </p>
              </div>

              <FloorActions
                floor={{ id: floor.id, floorNumber: floor.floorNumber, name: floor.name }}
              />
            </header>

            {floor.flats.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                No flats on this floor yet. Use &ldquo;Add flats&rdquo; to add them.
              </p>
            ) : (
              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {floor.flats.map((flat) => (
                  <FlatTile key={flat.id} flat={flat} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
