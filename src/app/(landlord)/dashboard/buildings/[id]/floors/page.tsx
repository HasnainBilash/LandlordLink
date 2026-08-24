import Link from "next/link";
import { notFound } from "next/navigation";

import { getBuilding } from "@/actions/building/get-building";
import { getFloors } from "@/actions/floor/get-floors";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackLink } from "@/components/ui/back-link";
import { FloorList } from "@/components/floor/floor-list";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FloorsPage({ params }: PageProps) {
  const { id } = await params;

  const building = await getBuilding(id);

  if (!building) {
    notFound();
  }

  const floors = await getFloors(id);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Buildings", href: "/dashboard/buildings" },
            { label: building.name, href: `/dashboard/buildings/${id}` },
            { label: "Floors" },
          ]}
        />

        <BackLink
          href={`/dashboard/buildings/${id}`}
          label={building.name}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Floors</h1>

          <p className="text-muted-foreground">
            {building.name}
          </p>
        </div>

        <Link href={`/dashboard/buildings/${id}/floors/new`}>
          <Button>Add Floor</Button>
        </Link>
      </div>

      {floors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            This building doesn&apos;t have any floors yet.
          </CardContent>
        </Card>
      ) : (
        <FloorList floors={floors} />
      )}
    </div>
  );
}