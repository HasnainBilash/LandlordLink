"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RecordPaymentButton } from "./record-payment-button";

const statusVariant = {
  PENDING: "outline",
  PARTIAL: "secondary",
  PAID: "default",
  OVERDUE: "destructive",
} as const;

const COLLAPSED_COUNT = 3;

export type BillingRow = {
  id: string;
  label: string;
  amount: number;
  paidTotal: number;
  dueDate: Date;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
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
  emptyMessage = "No billing periods yet.",
}: BillingTableProps) {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) {
    return <p className="text-muted-foreground">{emptyMessage}</p>;
  }

  const visibleRows = expanded ? rows : rows.slice(0, COLLAPSED_COUNT);
  const hiddenCount = rows.length - visibleRows.length;

  return (
    <div className="space-y-3">
      {visibleRows.map((row) => {
        const remaining = row.amount - row.paidTotal;

        return (
          <div
            key={row.id}
            className="space-y-2 border-b pb-3 last:border-0 last:pb-0"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{row.label}</p>
              <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              ${row.amount.toFixed(2)} · Due{" "}
              {new Date(row.dueDate).toLocaleDateString()}
              {row.paidTotal > 0 && row.status !== "PAID" && (
                <> · ${row.paidTotal.toFixed(2)} paid so far</>
              )}
            </p>

            {canManage && row.status !== "PAID" && (
              <RecordPaymentButton target={row.target} remaining={remaining} />
            )}
          </div>
        );
      })}

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

      {expanded && rows.length > COLLAPSED_COUNT && (
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
