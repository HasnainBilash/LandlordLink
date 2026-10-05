import Link from "next/link";

import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { RequestStatusBadge } from "@/components/ui/status-badges";
import { surface } from "@/components/ui/surface";
import { formatDate, formatFlatNumber, formatFloor, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

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
    <ul className={cn(surface, "divide-y")}>
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
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between md:p-5"
          >
            <div className="flex min-w-0 gap-3">
              <InitialsAvatar name={request.tenant.user.name} />

              <div className="min-w-0 space-y-1.5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{request.tenant.user.name}</p>
                    <RequestStatusBadge status={request.status} />
                  </div>

                  <p className="truncate text-sm text-muted-foreground">
                    {request.tenant.user.email}
                    {request.tenant.occupation && ` · ${request.tenant.occupation}`}
                  </p>
                </div>

                <p className="text-sm">
                  {request.flat.deletedAt ? (
                    <span className="font-medium">{place}</span>
                  ) : (
                    <Link
                      href={`/dashboard/flats/${request.flat.id}`}
                      className="font-medium underline-offset-4 hover:text-primary hover:underline"
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
                  <p className="rounded-xl rounded-tl-sm bg-muted/70 px-3 py-2 text-sm text-muted-foreground">
                    &ldquo;{request.message}&rdquo;
                  </p>
                )}
              </div>
            </div>

            {request.status === "PENDING" && !request.flat.deletedAt && (
              <div className="pl-13 sm:shrink-0 sm:pl-0">
                <RequestActions
                  requestId={request.id}
                  tenantName={request.tenant.user.name}
                  flatLabel={flatLabel}
                  defaultMonthlyRent={request.flat.monthlyRent}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
