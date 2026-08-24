"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { approveJoinRequest } from "@/actions/join-request/approve-join-request";
import { rejectJoinRequest } from "@/actions/join-request/reject-join-request";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type ApproveRejectButtonsProps = {
  requestId: string;
  defaultMonthlyRent: number | string;
};

export function ApproveRejectButtons({
  requestId,
  defaultMonthlyRent,
}: ApproveRejectButtonsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const { run: runApprove, isPending: isApprovePending } =
    useSingleFlightAction(approveJoinRequest);
  const { run: runReject, isPending: isRejectPending } =
    useSingleFlightAction(rejectJoinRequest);

  async function handleConfirmApprove(formData: FormData) {
    setErrors({});

    const result = await runApprove(requestId, formData);

    if (!result) return;

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    router.refresh();
  }

  async function handleReject() {
    const confirmed = window.confirm("Reject this request?");

    if (!confirmed) return;

    const result = await runReject(requestId);

    if (!result) return;

    if (!result.success) {
      alert(result.message);
      return;
    }

    router.refresh();
  }

  if (isApproving) {
    return (
      <form
        action={handleConfirmApprove}
        className="space-y-3 rounded-lg border p-3"
      >
        <p className="text-sm font-medium">Create Lease &amp; Approve</p>

        <div className="space-y-1">
          <Label htmlFor={`startDate-${requestId}`}>Lease Start Date</Label>

          <Input
            id={`startDate-${requestId}`}
            name="startDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />

          {errors.startDate && (
            <p className="text-sm text-red-500">{errors.startDate[0]}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor={`monthlyRent-${requestId}`}>Monthly Rent</Label>

          <Input
            id={`monthlyRent-${requestId}`}
            name="monthlyRent"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={defaultMonthlyRent}
          />

          {errors.monthlyRent && (
            <p className="text-sm text-red-500">{errors.monthlyRent[0]}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor={`deposit-${requestId}`}>Deposit (optional)</Label>

          <Input
            id={`deposit-${requestId}`}
            name="deposit"
            type="number"
            step="0.01"
            min="0"
          />

          {errors.deposit && (
            <p className="text-sm text-red-500">{errors.deposit[0]}</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" size="sm" disabled={isApprovePending}>
            {isApprovePending ? "Approving..." : "Confirm Approval"}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isApprovePending}
            onClick={() => {
              setIsApproving(false);
              setErrors({});
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex gap-3">
      <Button
        size="sm"
        disabled={isRejectPending}
        onClick={() => setIsApproving(true)}
      >
        Approve
      </Button>

      <Button
        size="sm"
        variant="destructive"
        disabled={isRejectPending}
        onClick={handleReject}
      >
        Reject
      </Button>
    </div>
  );
}
