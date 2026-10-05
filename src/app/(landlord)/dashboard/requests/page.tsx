import { Inbox } from "lucide-react";

import { getJoinRequests } from "@/actions/join-request/get-join-requests";

import { RequestList } from "@/components/join-request/request-list";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusFilter } from "@/components/ui/status-filter";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

const FILTERS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Lease ended", value: "ENDED" },
  { label: "All", value: "ALL" },
];

export default async function RequestsPage({ searchParams }: PageProps) {
  const { status = "PENDING" } = await searchParams;

  const requests = await getJoinRequests({
    status: status === "ALL" ? undefined : status,
  });

  return (
    <>
      <PageHeader
        title="Requests"
        description="Tenants asking to rent a flat in one of your buildings."
      />

      <StatusFilter
        options={FILTERS}
        active={status}
        hrefFor={(value) => `/dashboard/requests?status=${value}`}
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={status === "PENDING" ? "No requests waiting" : "No requests here"}
          description="Tenants send requests from “Find a flat” using a building's access code. You'll find the code on each building's page."
        />
      ) : (
        <RequestList requests={requests} />
      )}
    </>
  );
}
