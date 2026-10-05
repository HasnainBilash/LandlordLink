"use client";

import { quickSetupBuilding } from "@/actions/quick-setup/quick-setup-building";

import { Button } from "@/components/ui/button";
import { FieldError, FormError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useActionForm } from "@/hooks/use-action-form";

type QuickSetupFormProps = {
  buildingId: string;
  onSuccess?: () => void;
};

export function QuickSetupForm({ buildingId, onSuccess }: QuickSetupFormProps) {
  const { submit, isPending, errors, message } = useActionForm(
    (formData) => quickSetupBuilding(buildingId, formData),
    { onSuccess }
  );

  return (
    <form action={submit} className="space-y-4">
      <FormError message={message} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="fromFloor">From floor</Label>
          <Input id="fromFloor" name="fromFloor" type="number" required placeholder="1" />
          <FieldError errors={errors.fromFloor} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="toFloor">To floor</Label>
          <Input id="toFloor" name="toFloor" type="number" required placeholder="6" />
          <FieldError errors={errors.toFloor} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="flatsPerFloor">Flats per floor</Label>
          <Input
            id="flatsPerFloor"
            name="flatsPerFloor"
            type="number"
            required
            placeholder="4"
          />
          <FieldError errors={errors.flatsPerFloor} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Flats are numbered by floor: floor 3 with 4 flats gets 301–304.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input id="bedrooms" name="bedrooms" type="number" required placeholder="3" />
          <FieldError errors={errors.bedrooms} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input id="bathrooms" name="bathrooms" type="number" required placeholder="2" />
          <FieldError errors={errors.bathrooms} />
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
          />
          <FieldError errors={errors.monthlyRent} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <NativeSelect id="status" name="status" defaultValue="VACANT">
          <option value="VACANT">Vacant</option>
          <option value="MAINTENANCE">Maintenance</option>
        </NativeSelect>
      </div>

      <p className="text-xs text-muted-foreground">
        These values apply to every flat created. You can change any flat
        afterwards.
      </p>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create floors & flats"}
      </Button>
    </form>
  );
}
