"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type FlatBulkFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function FlatBulkForm({ action }: FlatBulkFormProps) {
  const { run, isPending } = useSingleFlightAction(action);

  return (
    <form action={run} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fromFlatNumber">From Flat Number</Label>

          <Input
            id="fromFlatNumber"
            name="fromFlatNumber"
            type="number"
            required
            placeholder="101"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toFlatNumber">To Flat Number</Label>

          <Input
            id="toFlatNumber"
            name="toFlatNumber"
            type="number"
            required
            placeholder="112"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        This creates one flat for every number in the range, inclusive.
        Flat numbers that already exist on this floor are skipped
        automatically.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>

          <Input
            id="bedrooms"
            name="bedrooms"
            type="number"
            required
            placeholder="2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>

          <Input
            id="bathrooms"
            name="bathrooms"
            type="number"
            required
            placeholder="1"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="monthlyRent">Monthly Rent</Label>

          <Input
            id="monthlyRent"
            name="monthlyRent"
            type="number"
            step="0.01"
            required
            placeholder="1200.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>

          <select
            id="status"
            name="status"
            defaultValue="VACANT"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="VACANT">Vacant</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Bedrooms, bathrooms, rent, and status apply to every flat created in
        this batch. Each flat can be adjusted individually afterward.
      </p>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create Flats"}
      </Button>
    </form>
  );
}