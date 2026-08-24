"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createUtilityBill } from "@/actions/utility-bill/create-utility-bill";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type AddUtilityBillFormProps = {
  leaseId: string;
};

export function AddUtilityBillForm({ leaseId }: AddUtilityBillFormProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const { run, isPending } = useSingleFlightAction((formData: FormData) =>
    createUtilityBill(leaseId, formData)
  );

  async function handleSubmit(formData: FormData) {
    setErrors({});

    const result = await run(formData);

    if (!result) return;

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setIsAdding(false);
    router.refresh();
  }

  if (!isAdding) {
    return (
      <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
        Add Utility Bill
      </Button>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-lg border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="type">Type</Label>

          <select
            id="type"
            name="type"
            defaultValue="ELECTRICITY"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="ELECTRICITY">Electricity</option>
            <option value="GAS">Gas</option>
            <option value="WATER">Water</option>
            <option value="INTERNET">Internet</option>
            <option value="SECURITY">Security</option>
            <option value="OTHER">Other</option>
          </select>

          {errors.type && (
            <p className="text-sm text-red-500">{errors.type[0]}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="period">Billing Month</Label>

          <Input
            id="period"
            name="period"
            type="month"
            required
            defaultValue={new Date().toISOString().slice(0, 7)}
          />

          {errors.period && (
            <p className="text-sm text-red-500">{errors.period[0]}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="amount">Amount</Label>

          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
          />

          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount[0]}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="dueDate">Due Date</Label>

          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />

          {errors.dueDate && (
            <p className="text-sm text-red-500">{errors.dueDate[0]}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Adding..." : "Add Bill"}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            setIsAdding(false);
            setErrors({});
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
