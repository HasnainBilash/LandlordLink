"use client";

import { endLease } from "@/actions/join-request/end-lease";

import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";

type EndLeaseButtonProps = {
  requestId: string;
  tenantName: string;
};

export function EndLeaseButton({ requestId, tenantName }: EndLeaseButtonProps) {
  return (
    <ConfirmAction
      title={`End ${tenantName}'s lease?`}
      description="The flat becomes vacant and no more rent is billed. Anything still unpaid stays on record under Reports → Past dues."
      confirmLabel="End lease"
      pendingLabel="Ending..."
      destructive
      trigger={
        <Button size="sm" variant="outline">
          End lease
        </Button>
      }
      action={() => endLease(requestId)}
    />
  );
}
