"use client";

import { writeOffLeaseBalance } from "@/actions/rent/write-off-lease-balance";

import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { formatMoney } from "@/lib/format";

type WriteOffButtonProps = {
  leaseId: string;
  tenantName: string;
  amount: number;
};

export function WriteOffButton({ leaseId, tenantName, amount }: WriteOffButtonProps) {
  return (
    <ConfirmAction
      title={`Write off ${formatMoney(amount)}?`}
      description={`You're giving up on collecting what ${tenantName} still owes. The bills stay in the history marked "Written off" and stop counting as outstanding. This can't be undone.`}
      confirmLabel="Write off"
      pendingLabel="Writing off..."
      destructive
      trigger={
        <Button size="sm" variant="ghost">
          Write off
        </Button>
      }
      action={() => writeOffLeaseBalance(leaseId)}
    />
  );
}
