"use client";

import { createFlatsBulk } from "@/actions/flat/create-flats-bulk";

import { Button } from "@/components/ui/button";
import { FieldError, FormError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useActionForm } from "@/hooks/use-action-form";

type FlatBulkFormProps = {
  floorId: string;
  onSuccess?: () => void;
};

export function FlatBulkForm({ floorId, onSuccess }: FlatBulkFormProps) {
  const { submit, isPending, errors, message } = useActionForm(
    (formData) => createFlatsBulk(floorId, formData),
    { onSuccess }
  );

  return (
    <form action={submit} className="space-y-4">
      <FormError message={message} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fromFlatNumber">From flat number</Label>
          <Input
            id="fromFlatNumber"
            name="fromFlatNumber"
            type="number"
            required
            placeholder="101"
          />
          <FieldError errors={errors.fromFlatNumber} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="toFlatNumber">To flat number</Label>
          <Input
            id="toFlatNumber"
            name="toFlatNumber"
            type="number"
            required
            placeholder="104"
          />
          <FieldError errors={errors.toFlatNumber} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="bulkBedrooms">Bedrooms</Label>
          <Input id="bulkBedrooms" name="bedrooms" type="number" required placeholder="3" />
          <FieldError errors={errors.bedrooms} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bulkBathrooms">Bathrooms</Label>
          <Input id="bulkBathrooms" name="bathrooms" type="number" required placeholder="2" />
          <FieldError errors={errors.bathrooms} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bulkRent">Rent / month (৳)</Label>
          <Input
            id="bulkRent"
            name="monthlyRent"
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            placeholder="25000"
          />
          <FieldError errors={errors.monthlyRent} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bulkStatus">Status</Label>
        <NativeSelect id="bulkStatus" name="status" defaultValue="VACANT">
          <option value="VACANT">Vacant</option>
          <option value="MAINTENANCE">Maintenance</option>
        </NativeSelect>
      </div>

      <p className="text-xs text-muted-foreground">
        Creates every number in the range with these details. Numbers that
        already exist on this floor are skipped.
      </p>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create flats"}
      </Button>
    </form>
  );
}
