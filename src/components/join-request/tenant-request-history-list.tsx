import { RequestStatusBadge } from "@/components/ui/status-badges";
import { formatDate } from "@/lib/format";

export type TenantJoinRequestRow = {
  id: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ENDED";
  createdAt: Date;
};

type TenantRequestHistoryListProps = {
  requests: TenantJoinRequestRow[];
};

export function TenantRequestHistoryList({
  requests,
}: TenantRequestHistoryListProps) {
  return (
    <ul className="divide-y">
      {requests.map((request) => (
        <li
          key={request.id}
          className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="text-sm">Requested {formatDate(request.createdAt)}</p>
            {request.message && (
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{request.message}&rdquo;
              </p>
            )}
          </div>

          <RequestStatusBadge status={request.status} />
        </li>
      ))}
    </ul>
  );
}
