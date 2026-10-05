"use client";

import { Button } from "@/components/ui/button";
import { FieldError, FormError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useActionForm } from "@/hooks/use-action-form";
import type { ActionResult } from "@/types/action-result";

type FlatFormProps = {
  action: (formData: FormData) => Promise<ActionResult | void>;
  submitText: string;
  defaultValues?: {
    flatNumber: string;
    bedrooms: number;
    bathrooms: number;
    monthlyRent: number;
    status: "VACANT" | "OCCUPIED" | "MAINTENANCE";
  };
  // A leased flat is always "Occupied"; its status can't be changed here.
  isLeased?: boolean;
  onSuccess?: () => void;
};

export function FlatForm({
  action,
  submitText,
  defaultValues,
  isLeased = false,
  onSuccess,
}: FlatFormProps) {
  const { submit, isPending, errors, message } = useActionForm(action, {
    onSuccess,
  });

  return (
    <form action={submit} className="space-y-4">
      <FormError message={message} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="flatNumber">Flat number</Label>
          <Input
            id="flatNumber"
            name="flatNumber"
            required
            placeholder="A1 or 101"
            defaultValue={defaultValues?.flatNumber}
          />
          <FieldError errors={errors.flatNumber} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="monthlyRent">Rent / month (৳)</Label>
          <Input
            id="monthlyRent"
            name="monthlyRent"
            type="number"
            inputMode="decimal"
            step="0.01"
            required
            placeholder="25000"
            defaultValue={defaultValues?.monthlyRent}
          />
          <FieldError errors={errors.monthlyRent} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input
            id="bedrooms"
            name="bedrooms"
            type="number"
            required
            placeholder="3"
            defaultValue={defaultValues?.bedrooms}
          />
          <FieldError errors={errors.bedrooms} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            name="bathrooms"
            type="number"
            required
            placeholder="2"
            defaultValue={defaultValues?.bathrooms}
          />
          <FieldError errors={errors.bathrooms} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          {isLeased ? (
            <NativeSelect id="status" disabled defaultValue="OCCUPIED">
              <option value="OCCUPIED">Occupied</option>
            </NativeSelect>
          ) : (
            <NativeSelect
              id="status"
              name="status"
              defaultValue={
                defaultValues?.status === "MAINTENANCE" ? "MAINTENANCE" : "VACANT"
              }
            >
              <option value="VACANT">Vacant</option>
              <option value="MAINTENANCE">Maintenance</option>
            </NativeSelect>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {isLeased
          ? "This flat has a tenant, so it stays Occupied until the lease ends. Changing the rent here only affects future leases."
          : "Flats become Occupied automatically when you approve a tenant."}
      </p>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : submitText}
      </Button>
    </form>
  );
}
