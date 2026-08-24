import Link from "next/link";
import { notFound } from "next/navigation";

import { getFloor } from "@/actions/floor/get-floor";
import { getFlats } from "@/actions/flat/get-flats";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackLink } from "@/components/ui/back-link";
import { FlatList } from "@/components/flat/flat-list";

type PageProps = {
  params: Promise<{
    id: string;
    floorId: string;
  }>;
};

export default async function FlatsPage({ params }: PageProps) {
  const { id, floorId } = await params;

  const floor = await getFloor(floorId);

  if (!floor || floor.buildingId !== id) {
    notFound();
  }

  const floorLabel = floor.name || `Floor ${floor.floorNumber}`;

  const flats = (await getFlats(floorId)).map((flat) => ({
    ...flat,
    monthlyRent: Number(flat.monthlyRent),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Buildings", href: "/dashboard/buildings" },
            { label: floor.building.name, href: `/dashboard/buildings/${id}` },
            { label: "Floors", href: `/dashboard/buildings/${id}/floors` },
            {
              label: floorLabel,
              href: `/dashboard/buildings/${id}/floors/${floorId}`,
            },
            { label: "Flats" },
          ]}
        />

        <BackLink
          href={`/dashboard/buildings/${id}/floors/${floorId}`}
          label={floorLabel}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flats</h1>

          <p className="text-muted-foreground">
            {floorLabel} · {floor.building.name}
          </p>
        </div>

        <Link href={`/dashboard/buildings/${id}/floors/${floorId}/flats/new`}>
          <Button>Add Flat</Button>
        </Link>
      </div>

      {flats.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            This floor doesn&apos;t have any flats yet.
          </CardContent>
        </Card>
      ) : (
        <FlatList buildingId={id} floorId={floorId} flats={flats} />
      )}
    </div>
  );
}
