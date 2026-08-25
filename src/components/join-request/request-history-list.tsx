"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApproveRejectButtons } from "./approve-reject-buttons";

const requestStatusVariant = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  ENDED: "secondary",
} as const;

const COLLAPSED_COUNT = 3;

export type JoinRequestRow = {
  id: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ENDED";
  createdAt: Date;
  tenant: {
    user: {
      name: string | null;
      email: string | null;
    };
  };
};

type RequestHistoryListProps = {
  requests: JoinRequestRow[];
  defaultMonthlyRent: number;
};

export function RequestHistoryList({
  requests,
  defaultMonthlyRent,
}: RequestHistoryListProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleRequests = expanded
    ? requests
    : requests.slice(0, COLLAPSED_COUNT);
  const hiddenCount = requests.length - visibleRequests.length;

  return (
    <div className="space-y-4">
      {visibleRequests.map((request) => (
        <div
          key={request.id}
          className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
        >
          <div>
            <p className="font-semibold">{request.tenant.user.name}</p>

            <p className="text-sm text-muted-foreground">
              {request.tenant.user.email}
            </p>

            {request.message && (
              <p className="mt-1 text-sm italic text-muted-foreground">
                &quot;{request.message}&quot;
              </p>
            )}
          </div>

          <div className="text-right">
            <Badge variant={requestStatusVariant[request.status]}>
              {request.status}
            </Badge>

            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(request.createdAt).toLocaleDateString()}
            </p>

            {request.status === "PENDING" && (
              <div className="mt-2">
                <ApproveRejectButtons
                  requestId={request.id}
                  defaultMonthlyRent={defaultMonthlyRent}
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {hiddenCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setExpanded(true)}
        >
          Show {hiddenCount} more
        </Button>
      )}

      {expanded && requests.length > COLLAPSED_COUNT && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setExpanded(false)}
        >
          Show less
        </Button>
      )}
    </div>
  );
}
