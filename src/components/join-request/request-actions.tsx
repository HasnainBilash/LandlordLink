"use client";

import { approveJoinRequest } from "@/actions/join-request/approve-join-request";
import { rejectJoinRequest } from "@/actions/join-request/reject-join-request";

import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { FieldError, FormError } from "@/components/ui/field-error";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionForm } from "@/hooks/use-action-form";
import { toDateInputValue } from "@/lib/format";

type RequestActionsProps = {
  requestId: string;
  tenantName: string;
  flatLabel: string;
  defaultMonthlyRent: number;
};

// Approve (with the lease details) or reject a pending join request.
export function RequestActions({
  requestId,
  tenantName,
  flatLabel,
  defaultMonthlyRent,
}: RequestActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <FormDialog
        title={`Approve ${tenantName}`}
        description={`This creates a lease for ${flatLabel}. Any other pending requests for the flat are declined.`}
        trigger={<Button size="sm">Approve</Button>}
      >
        {(close) => (
          <ApproveForm
            requestId={requestId}
            defaultMonthlyRent={defaultMonthlyRent}
            onSuccess={close}
          />
        )}
      </FormDialog>

      <ConfirmAction
        title={`Reject ${tenantName}'s request?`}
        description={`They'll see their request for ${flatLabel} as rejected.`}
        confirmLabel="Reject"
        pendingLabel="Rejecting..."
        destructive
        trigger={
          <Button size="sm" variant="outline">
            Reject
          </Button>
        }
        action={() => rejectJoinRequest(requestId)}
      />
    </div>
  );
}

function ApproveForm({
  requestId,
  defaultMonthlyRent,
  onSuccess,
}: {
  requestId: string;
  defaultMonthlyRent: number;
  onSuccess: () => void;
}) {
  const { submit, isPending, errors, message } = useActionForm(
    (formData) => approveJoinRequest(requestId, formData),
    { onSuccess }
  );

  return (
    <form action={submit} className="space-y-4">
      <FormError message={message} />

      <div className="space-y-1.5">
        <Label htmlFor="startDate">Lease start date</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          required
          defaultValue={toDateInputValue(new Date())}
        />
        <p className="text-xs text-muted-foreground">
          Rent is billed from the start month. If the tenant moves in after
          the 20th, that first month is free.
        </p>
        <FieldError errors={errors.startDate} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="monthlyRent">Rent / month (৳)</Label>
          <Input
            id="monthlyRent"
            name="monthlyRent"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
            defaultValue={defaultMonthlyRent}
          />
          <FieldError errors={errors.monthlyRent} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deposit">Deposit (optional)</Label>
          <Input
            id="deposit"
            name="deposit"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0"
          />
          <FieldError errors={errors.deposit} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Approving..." : "Approve & create lease"}
      </Button>
    </form>
  );
}
