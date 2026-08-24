"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type FlatFormProps = {
  action: (formData: FormData) => void | Promise<void>;

  submitText: string;

  defaultValues?: {
    flatNumber: string;
    bedrooms: number;
    bathrooms: number;
    monthlyRent: number | string;
    status: "VACANT" | "OCCUPIED" | "MAINTENANCE";
  };
};

export function FlatForm({
  action,
  submitText,
  defaultValues,
}: FlatFormProps) {
  const { run, isPending } = useSingleFlightAction(action);

  return (
    <form action={run} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="flatNumber">Flat Number</Label>

        <Input
          id="flatNumber"
          name="flatNumber"
          required
          placeholder="101"
          defaultValue={defaultValues?.flatNumber}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>

          <Input
            id="bedrooms"
            name="bedrooms"
            type="number"
            required
            placeholder="2"
            defaultValue={defaultValues?.bedrooms}
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
            defaultValue={defaultValues?.bathrooms}
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
            defaultValue={defaultValues?.monthlyRent}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>

          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? "VACANT"}
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="VACANT">Vacant</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : submitText}
      </Button>
    </form>
  );
}
