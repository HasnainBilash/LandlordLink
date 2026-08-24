import { notFound } from "next/navigation";

import { getBuilding } from "@/actions/building/get-building";
import { getJoinRequestsForBuilding } from "@/actions/join-request/get-join-requests-for-building";

import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackLink } from "@/components/ui/back-link";
import { StatusFilter } from "@/components/ui/status-filter";
import { JoinRequestRow } from "@/components/join-request/join-request-row";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

const FILTER_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Ended", value: "ENDED" },
  { label: "All", value: "" },
];

export default async function BuildingRequestsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { status } = await searchParams;
  const activeStatus = status ?? "PENDING";

  const building = await getBuilding(id);

  if (!building) {
    notFound();
  }

  const requests = (
    await getJoinRequestsForBuilding(id, activeStatus || undefined)
  ).map((request) => ({
    ...request,
    flat: {
      ...request.flat,
      monthlyRent: Number(request.flat.monthlyRent),
    },
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Buildings", href: "/dashboard/buildings" },
            { label: building.name, href: `/dashboard/buildings/${id}` },
            { label: "Requests" },
          ]}
        />

        <BackLink
          href={`/dashboard/buildings/${id}`}
          label={building.name}
        />
      </div>

      <div>
        <h1 className="text-3xl font-bold">Join Requests</h1>
        <p className="text-muted-foreground">{building.name}</p>
      </div>

      <StatusFilter
        basePath={`/dashboard/buildings/${id}/requests`}
        options={FILTER_OPTIONS}
        active={activeStatus}
      />

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No requests match this filter.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((request) => (
            <JoinRequestRow key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}