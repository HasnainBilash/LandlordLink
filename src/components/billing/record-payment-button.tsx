"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { recordPayment } from "@/actions/payment/record-payment";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type PaymentTarget =
  | { type: "RENT"; id: string }
  | { type: "UTILITY_BILL"; id: string };

type RecordPaymentButtonProps = {
  target: PaymentTarget;
  remaining: number;
};

export function RecordPaymentButton({
  target,
  remaining,
}: RecordPaymentButtonProps) {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const { run, isPending } = useSingleFlightAction((formData: FormData) =>
    recordPayment(target, formData)
  );

  async function handleSubmit(formData: FormData) {
    setErrors({});

    const result = await run(formData);

    if (!result) return;

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    router.refresh();
  }

  if (isRecording) {
    return (
      <form
        action={handleSubmit}
        className="space-y-3 rounded-lg border p-3"
      >
        <div className="space-y-1">
          <Label htmlFor={`amount-${target.id}`}>Amount</Label>

          <Input
            id={`amount-${target.id}`}
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            max={remaining}
            required
            defaultValue={remaining.toFixed(2)}
          />

          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount[0]}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor={`transactionRef-${target.id}`}>
            Transaction Reference (optional)
          </Label>

          <Input
            id={`transactionRef-${target.id}`}
            name="transactionRef"
            placeholder="e.g. bank transfer ID"
          />

          {errors.transactionRef && (
            <p className="text-sm text-red-500">{errors.transactionRef[0]}</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Recording..." : "Confirm Payment"}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => {
              setIsRecording(false);
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
    <Button size="sm" onClick={() => setIsRecording(true)}>
      Record Payment
    </Button>
  );
}
