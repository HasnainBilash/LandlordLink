import Link from "next/link";
import { Building2, ChevronRight, Inbox } from "lucide-react";

import { getMyJoinRequests } from "@/actions/join-request/get-my-join-requests";

import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { IconChip } from "@/components/ui/icon-chip";
import { RequestStatusBadge } from "@/components/ui/status-badges";
import { StatusFilter } from "@/components/ui/status-filter";
import { surface } from "@/components/ui/surface";
import { formatDate, formatFlatNumber, formatFloor } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

const FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Lease ended", value: "ENDED" },
];

export default async function MyRequestsPage({ searchParams }: PageProps) {
  const { status = "ALL" } = await searchParams;

  const requests = await getMyJoinRequests(status === "ALL" ? undefined : status);

  return (
    <>
      <PageHeader
        title="My requests"
        description="Flats you've asked to rent, and what the landlord said."
      />

      <StatusFilter
        options={FILTERS}
        active={status}
        hrefFor={(value) => `/tenant/requests?status=${value}`}
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests here"
          description="Find a flat you like and send the landlord a request."
          action={<ButtonLink href="/tenant/buildings">Find a flat</ButtonLink>}
        />
      ) : (
        <ul className={cn(surface, "divide-y overflow-hidden")}>
          {requests.map((request) => (
            <li key={request.id}>
              <Link
                href={`/tenant/flats/${request.flatId}`}
                className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/50 md:p-5"
              >
                <IconChip icon={Building2} />

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      Flat {formatFlatNumber(request.flat.flatNumber)} · {request.building.name}
                    </p>
                    <RequestStatusBadge status={request.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatFloor(request.flat.floor)} · requested {formatDate(request.createdAt)}
                  </p>
                  {request.message && (
                    <p className="truncate text-sm text-muted-foreground italic">
                      &ldquo;{request.message}&rdquo;
                    </p>
                  )}
                </div>

                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
