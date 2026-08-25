"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const requestStatusVariant = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  ENDED: "secondary",
} as const;

const COLLAPSED_COUNT = 3;

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
            {request.message && (
              <p className="text-sm italic text-muted-foreground">
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
