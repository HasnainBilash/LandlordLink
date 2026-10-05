"use client";

import { Plus } from "lucide-react";

import { createUtilityBill } from "@/actions/utility-bill/create-utility-bill";

import { Button } from "@/components/ui/button";
import { FieldError, FormError } from "@/components/ui/field-error";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useActionForm } from "@/hooks/use-action-form";
import { toDateInputValue } from "@/lib/format";
import { UTILITY_TYPE_LABELS } from "@/lib/utility-bill";

type AddUtilityBillButtonProps = {
  leaseId: string;
};

export function AddUtilityBillButton({ leaseId }: AddUtilityBillButtonProps) {
  return (
    <FormDialog
      title="Add a utility bill"
      description="The tenant sees it on their flat page."
      trigger={
        <Button size="sm" variant="outline">
          <Plus />
          Add bill
        </Button>
      }
    >
      {(close) => <AddUtilityBillForm leaseId={leaseId} onSuccess={close} />}
    </FormDialog>
  );
}

function AddUtilityBillForm({
  leaseId,
  onSuccess,
}: {
  leaseId: string;
  onSuccess: () => void;
}) {
  const { submit, isPending, errors, message } = useActionForm(
    (formData) => createUtilityBill(leaseId, formData),
    { onSuccess }
  );

  const today = toDateInputValue(new Date());

  return (
    <form action={submit} className="space-y-4">
      <FormError message={message} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <NativeSelect id="type" name="type" defaultValue="ELECTRICITY">
            {Object.entries(UTILITY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
          <FieldError errors={errors.type} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="period">Billing month</Label>
          <Input
            id="period"
            name="period"
            type="month"
            required
            defaultValue={today.slice(0, 7)}
          />
          <FieldError errors={errors.period} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (৳)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
            placeholder="1500"
          />
          <FieldError errors={errors.amount} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" name="dueDate" type="date" required defaultValue={today} />
          <FieldError errors={errors.dueDate} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Adding..." : "Add bill"}
      </Button>
    </form>
  );
}
