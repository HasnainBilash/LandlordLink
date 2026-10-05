"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { RequestStatusBadge } from "@/components/ui/status-badges";
import { formatDate } from "@/lib/format";

import { RequestActions } from "./request-actions";

const COLLAPSED_COUNT = 3;

export type FlatRequestRow = {
  id: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ENDED";
  createdAt: Date;
  tenant: {
    user: {
      name: string;
      email: string;
    };
  };
};

type RequestHistoryListProps = {
  requests: FlatRequestRow[];
  flatLabel: string;
  defaultMonthlyRent: number;
};

// Every request ever made for one flat (on the flat page).
export function RequestHistoryList({
  requests,
  flatLabel,
  defaultMonthlyRent,
}: RequestHistoryListProps) {
  const [expanded, setExpanded] = useState(false);

  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No one has requested this flat yet.
      </p>
    );
  }

  const visibleRequests = expanded
    ? requests
    : requests.slice(0, COLLAPSED_COUNT);

  return (
    <div className="divide-y">
      {visibleRequests.map((request) => (
        <div
          key={request.id}
          className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex min-w-0 gap-3">
            <InitialsAvatar name={request.tenant.user.name} size="sm" />

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{request.tenant.user.name}</p>
                <RequestStatusBadge status={request.status} />
              </div>

              <p className="truncate text-sm text-muted-foreground">
                {request.tenant.user.email} · {formatDate(request.createdAt)}
              </p>

              {request.message && (
                <p className="rounded-xl rounded-tl-sm bg-muted/70 px-3 py-2 text-sm text-muted-foreground">
                  &ldquo;{request.message}&rdquo;
                </p>
              )}
            </div>
          </div>

          {request.status === "PENDING" && (
            <div className="pl-11 sm:shrink-0 sm:pl-0">
              <RequestActions
                requestId={request.id}
                tenantName={request.tenant.user.name}
                flatLabel={flatLabel}
                defaultMonthlyRent={defaultMonthlyRent}
              />
            </div>
          )}
        </div>
      ))}

      {requests.length > COLLAPSED_COUNT && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded
              ? "Show less"
              : `Show ${requests.length - COLLAPSED_COUNT} more`}
          </Button>
        </div>
      )}
    </div>
  );
}
