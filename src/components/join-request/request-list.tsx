import Link from "next/link";

import { RequestStatusBadge } from "@/components/ui/status-badges";
import { formatDate, formatFlatNumber, formatFloor, formatMoney } from "@/lib/format";

import { RequestActions } from "./request-actions";

type RequestListProps = {
  requests: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "ENDED";
    message: string | null;
    createdAt: Date;
    tenant: {
      occupation: string | null;
      user: { name: string; email: string };
    };
    building: { id: string; name: string };
    flat: {
      id: string;
      flatNumber: string;
      monthlyRent: number;
      deletedAt: Date | null;
      floor: { floorNumber: number; name: string | null };
    };
  }[];
  // Hide the building name when the list is already inside one building.
  showBuilding?: boolean;
};

export function RequestList({ requests, showBuilding = true }: RequestListProps) {
  return (
    <ul className="divide-y rounded-xl border bg-card">
      {requests.map((request) => {
        const flatNumber = formatFlatNumber(request.flat.flatNumber);
        const flatLabel = `flat ${flatNumber}`;
        const place = [
          showBuilding ? request.building.name : null,
          formatFloor(request.flat.floor),
          `Flat ${flatNumber}`,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <li
            key={request.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{request.tenant.user.name}</p>
                <RequestStatusBadge status={request.status} />
              </div>

              <p className="text-sm text-muted-foreground">
                {request.tenant.user.email}
                {request.tenant.occupation && ` · ${request.tenant.occupation}`}
              </p>

              <p className="text-sm">
                {request.flat.deletedAt ? (
                  place
                ) : (
                  <Link
                    href={`/dashboard/flats/${request.flat.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {place}
                  </Link>
                )}
                <span className="text-muted-foreground">
                  {" "}
                  · {formatMoney(request.flat.monthlyRent)}/mo · requested{" "}
                  {formatDate(request.createdAt)}
                </span>
              </p>

              {request.message && (
                <p className="text-sm text-muted-foreground italic">
                  &ldquo;{request.message}&rdquo;
                </p>
              )}
            </div>

            {request.status === "PENDING" && !request.flat.deletedAt && (
              <RequestActions
                requestId={request.id}
                tenantName={request.tenant.user.name}
                flatLabel={flatLabel}
                defaultMonthlyRent={request.flat.monthlyRent}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
