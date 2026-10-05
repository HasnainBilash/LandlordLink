"use client";

import { createFloorsBulk } from "@/actions/floor/create-floors-bulk";

import { Button } from "@/components/ui/button";
import { FieldError, FormError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionForm } from "@/hooks/use-action-form";

type FloorBulkFormProps = {
  buildingId: string;
  onSuccess?: () => void;
};

export function FloorBulkForm({ buildingId, onSuccess }: FloorBulkFormProps) {
  const { submit, isPending, errors, message } = useActionForm(
    (formData) => createFloorsBulk(buildingId, formData),
    { onSuccess }
  );

  return (
    <form action={submit} className="space-y-4">
      <FormError message={message} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fromFloor">From floor</Label>
          <Input id="fromFloor" name="fromFloor" type="number" required placeholder="1" />
          <FieldError errors={errors.fromFloor} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="toFloor">To floor</Label>
          <Input id="toFloor" name="toFloor" type="number" required placeholder="10" />
          <FieldError errors={errors.toFloor} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Creates every floor in the range. Floors that already exist are
        skipped.
      </p>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create floors"}
      </Button>
    </form>
  );
}
