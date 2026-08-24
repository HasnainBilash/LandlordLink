import { notFound } from "next/navigation";

import { getBuildingForTenant } from "@/actions/join-request/get-building-for-tenant";
import { getVacantFlatsForBuilding } from "@/actions/join-request/get-vacant-flats-for-building";
import { getMyJoinRequests } from "@/actions/join-request/get-my-join-requests";

import { BackLink } from "@/components/ui/back-link";
import { Card, CardContent } from "@/components/ui/card";
import { AvailableFlatCard } from "@/components/join-request/available-flat-card";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BuildingVacantFlatsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const building = await getBuildingForTenant(id);

  if (!building) {
    notFound();
  }

  const [vacantFlats, myRequests] = await Promise.all([
    getVacantFlatsForBuilding(id),
    getMyJoinRequests(),
  ]);

  const flats = vacantFlats.map((flat) => ({
    ...flat,
    monthlyRent: Number(flat.monthlyRent),
  }));

  const requestedFlatIds = new Set(
    myRequests
      .filter((request) => request.status === "PENDING")
      .map((request) => request.flatId)
  );

  return (
    <div className="space-y-6">
      <BackLink href="/tenant/buildings" label="Search Buildings" />

      <div>
        <h1 className="text-3xl font-bold">{building.name}</h1>

        <p className="text-muted-foreground">
          {building.address}, {building.city}
        </p>
      </div>

      {flats.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No vacant flats in this building right now.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {flats.map((flat) => (
            <AvailableFlatCard
              key={flat.id}
              flat={flat}
              alreadyRequested={requestedFlatIds.has(flat.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
