import Link from "next/link";
import { notFound } from "next/navigation";

import { getFloor } from "@/actions/floor/get-floor";
import { DeleteFloorButton } from "@/components/floor/delete-floor-button";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackLink } from "@/components/ui/back-link";
import { StatTile } from "@/components/ui/stat-tile";

type PageProps = {
  params: Promise<{
    id: string;
    floorId: string;
  }>;
};

export default async function FloorDetailsPage({ params }: PageProps) {
  const { id, floorId } = await params;

  const floor = await getFloor(floorId);

  if (!floor || floor.buildingId !== id) {
    notFound();
  }

  const floorLabel = floor.name || `Floor ${floor.floorNumber}`;

  const totalFlats = floor.flats.length;
  const occupied = floor.flats.filter((f) => f.status === "OCCUPIED").length;
  const vacant = floor.flats.filter((f) => f.status === "VACANT").length;
  const maintenance = floor.flats.filter(
    (f) => f.status === "MAINTENANCE"
  ).length;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Buildings", href: "/dashboard/buildings" },
            { label: floor.building.name, href: `/dashboard/buildings/${id}` },
            { label: "Floors", href: `/dashboard/buildings/${id}/floors` },
            { label: floorLabel },
          ]}
        />

        <BackLink
          href={`/dashboard/buildings/${id}/floors`}
          label="Floors"
        />
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{floorLabel}</h1>

        <div className="flex gap-3">
          <Link href={`/dashboard/buildings/${id}/floors/${floor.id}/flats`}>
            <Button variant="outline">Manage Flats</Button>
          </Link>

          <Link
            href={`/dashboard/buildings/${id}/floors/${floor.id}/edit`}
          >
            <Button>Edit Floor</Button>
          </Link>

          <DeleteFloorButton floorId={floor.id} buildingId={id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Floor Number" value={floor.floorNumber} />

          <StatTile
            label="Total Flats"
            value={totalFlats}
            href={`/dashboard/buildings/${id}/floors/${floor.id}/flats`}
          />

          <StatTile label="Occupied" value={occupied} />

          <StatTile label="Vacant" value={vacant} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flats</CardTitle>
        </CardHeader>

        <CardContent>
          {totalFlats === 0 ? (
            <p className="text-muted-foreground">
              No flats have been added to this floor yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {floor.flats.map((flat) => (
                <Link
                  key={flat.id}
                  href={`/dashboard/buildings/${id}/floors/${floor.id}/flats/${flat.id}`}
                >
                  <Badge variant="outline">
                    {flat.flatNumber} · {flat.status}
                  </Badge>
                </Link>
              ))}

              {maintenance > 0 && (
                <Badge variant="secondary">
                  {maintenance} under maintenance
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
