"use client";

import { Button } from "@/components/ui/button";
import { FieldError, FormError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionForm } from "@/hooks/use-action-form";
import type { ActionResult } from "@/types/action-result";

type FloorFormProps = {
  action: (formData: FormData) => Promise<ActionResult | void>;
  submitText: string;
  defaultValues?: {
    floorNumber: number;
    name: string | null;
  };
  onSuccess?: () => void;
};

export function FloorForm({
  action,
  submitText,
  defaultValues,
  onSuccess,
}: FloorFormProps) {
  const { submit, isPending, errors, message } = useActionForm(action, {
    onSuccess,
  });

  return (
    <form action={submit} className="space-y-4">
      <FormError message={message} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="floorNumber">Floor number</Label>
          <Input
            id="floorNumber"
            name="floorNumber"
            type="number"
            required
            placeholder="1"
            defaultValue={defaultValues?.floorNumber}
          />
          <FieldError errors={errors.floorNumber} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="floorName">Name (optional)</Label>
          <Input
            id="floorName"
            name="name"
            placeholder="Ground floor"
            defaultValue={defaultValues?.name ?? ""}
          />
          <FieldError errors={errors.name} />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : submitText}
      </Button>
    </form>
  );
}
