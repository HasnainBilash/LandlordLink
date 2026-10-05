"use client";

import { recordPayment } from "@/actions/payment/record-payment";

import { Button } from "@/components/ui/button";
import { FieldError, FormError } from "@/components/ui/field-error";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionForm } from "@/hooks/use-action-form";
import { formatMoney } from "@/lib/format";

type PaymentTarget =
  | { type: "RENT"; id: string }
  | { type: "UTILITY_BILL"; id: string };

type RecordPaymentButtonProps = {
  target: PaymentTarget;
  label: string;
  remaining: number;
};

export function RecordPaymentButton({
  target,
  label,
  remaining,
}: RecordPaymentButtonProps) {
  return (
    <FormDialog
      title="Record payment"
      description={`${label} · ${formatMoney(remaining)} still due`}
      trigger={
        <Button size="sm" variant="outline">
          Record payment
        </Button>
      }
    >
      {(close) => (
        <RecordPaymentForm target={target} remaining={remaining} onDone={close} />
      )}
    </FormDialog>
  );
}

function RecordPaymentForm({
  target,
  remaining,
  onDone,
}: {
  target: PaymentTarget;
  remaining: number;
  onDone: () => void;
}) {
  // The dialog closes on success, so the form can't be submitted twice.
  const { submit, isPending, errors, message } = useActionForm(
    (formData) => recordPayment(target, formData),
    { onSuccess: onDone }
  );

  return (
    <form action={submit} className="space-y-4">
      <FormError message={message} />

      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (৳)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          max={remaining}
          required
          autoFocus
          defaultValue={Math.round(remaining * 100) / 100}
        />
        <FieldError errors={errors.amount} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="transactionRef">Reference (optional)</Label>
        <Input
          id="transactionRef"
          name="transactionRef"
          placeholder="e.g. bKash TrxID or receipt number"
        />
        <FieldError errors={errors.transactionRef} />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : "Save payment"}
      </Button>
    </form>
  );
}
