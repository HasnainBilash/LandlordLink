import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";

import { getBuildingForTenant } from "@/actions/join-request/get-building-for-tenant";
import { getMyJoinRequests } from "@/actions/join-request/get-my-join-requests";
import { getVacantFlatsForBuilding } from "@/actions/join-request/get-vacant-flats-for-building";

import { AvailableFlatCard } from "@/components/join-request/available-flat-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
};

export default async function BuildingVacantFlatsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { code } = await searchParams;

  const [building, flats, myPendingRequests] = await Promise.all([
    getBuildingForTenant(id),
    getVacantFlatsForBuilding(id),
    getMyJoinRequests("PENDING"),
  ]);

  if (!building) {
    notFound();
  }

  const requestedFlatIds = new Set(myPendingRequests.map((request) => request.flatId));

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Find a flat", href: "/tenant/buildings" },
          { label: building.name },
        ]}
        title={building.name}
        description={
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {building.address}, {building.city}
          </span>
        }
      />

      {building.description && (
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">
          {building.description}
        </p>
      )}

      {flats.length === 0 ? (
        <EmptyState
          title="No vacant flats right now"
          description="Every flat in this building is taken. Check back later."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {flats.map((flat) => (
            <AvailableFlatCard
              key={flat.id}
              flat={flat}
              alreadyRequested={requestedFlatIds.has(flat.id)}
              accessCode={code}
            />
          ))}
        </div>
      )}
    </>
  );
}
