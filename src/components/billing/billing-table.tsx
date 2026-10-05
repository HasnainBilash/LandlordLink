"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  PaymentStatusBadge,
  type PaymentStatus,
} from "@/components/ui/status-badges";
import { formatDate, formatMoney } from "@/lib/format";

import { RecordPaymentButton } from "./record-payment-button";

const COLLAPSED_COUNT = 4;

export type BillingRow = {
  id: string;
  label: string;
  amount: number;
  paidTotal: number;
  dueDate: Date;
  status: PaymentStatus;
  target: { type: "RENT" | "UTILITY_BILL"; id: string };
};

type BillingTableProps = {
  rows: BillingRow[];
  canManage?: boolean;
  emptyMessage?: string;
};

export function BillingTable({
  rows,
  canManage = false,
  emptyMessage = "Nothing billed yet.",
}: BillingTableProps) {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  const visibleRows = expanded ? rows : rows.slice(0, COLLAPSED_COUNT);
  const hiddenCount = rows.length - visibleRows.length;

  return (
    <div className="divide-y">
      {visibleRows.map((row) => {
        const remaining = Math.max(row.amount - row.paidTotal, 0);
        const isSettled = row.status === "PAID" || row.status === "WRITTEN_OFF";
        const paidPct = row.amount > 0 ? Math.min((row.paidTotal / row.amount) * 100, 100) : 0;

        return (
          <div
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{row.label}</p>
                <PaymentStatusBadge status={row.status} />
              </div>

              <p className="text-sm text-muted-foreground">
                {formatMoney(row.amount)} · due {formatDate(row.dueDate)}
                {!isSettled && row.paidTotal > 0 && (
                  <> · {formatMoney(row.paidTotal)} paid, {formatMoney(remaining)} left</>
                )}
              </p>

              {!isSettled && row.paidTotal > 0 && (
                <div className="h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
              )}
            </div>

            {canManage && !isSettled && (
              <RecordPaymentButton
                target={row.target}
                label={row.label}
                remaining={remaining}
              />
            )}
          </div>
        );
      })}

      {(hiddenCount > 0 || expanded) && rows.length > COLLAPSED_COUNT && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show less" : `Show ${hiddenCount} more`}
          </Button>
        </div>
      )}
    </div>
  );
}
