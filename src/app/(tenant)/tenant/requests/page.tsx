import { getMyJoinRequests } from "@/actions/join-request/get-my-join-requests";

import { Card, CardContent } from "@/components/ui/card";
import { MyRequestCard } from "@/components/join-request/my-request-card";
import { StatusFilter } from "@/components/ui/status-filter";

type PageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Ended", value: "ENDED" },
];

export default async function MyRequestsPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const activeStatus = status ?? "";

  const requests = await getMyJoinRequests(activeStatus || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Requests</h1>

        <p className="text-muted-foreground">
          Track the status of the flats you&apos;ve requested.
        </p>
      </div>

      <StatusFilter
        basePath="/tenant/requests"
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
            <MyRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}