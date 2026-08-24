import { getJoinRequests } from "@/actions/join-request/get-join-requests";

import { Card, CardContent } from "@/components/ui/card";
import { JoinRequestRow } from "@/components/join-request/join-request-row";
import { StatusFilter } from "@/components/ui/status-filter";

type PageProps = {
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

export default async function RequestsInboxPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const activeStatus = status ?? "PENDING";

  const requests = (await getJoinRequests(activeStatus || undefined)).map(
    (request) => ({
      ...request,
      flat: {
        ...request.flat,
        monthlyRent: Number(request.flat.monthlyRent),
      },
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Join Requests</h1>

        <p className="text-muted-foreground">
          Requests from tenants across all of your buildings.
        </p>
      </div>

      <StatusFilter
        basePath="/dashboard/requests"
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