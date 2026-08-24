"use client";

import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type QuickSetupFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function QuickSetupForm({ action }: QuickSetupFormProps) {
  const { run, isPending } = useSingleFlightAction(action);

  return (
    <form action={run} className="space-y-6">
      <Alert>
        <Info />
        <AlertTitle>This is just a starting point</AlertTitle>
        <AlertDescription>
          Every floor and flat generated here can still be edited, renamed,
          or deleted individually afterward — including per-floor differences
          in flat count, rent, or room counts.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fromFloor">From Floor</Label>

          <Input
            id="fromFloor"
            name="fromFloor"
            type="number"
            required
            placeholder="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toFloor">To Floor</Label>

          <Input
            id="toFloor"
            name="toFloor"
            type="number"
            required
            placeholder="12"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="flatsPerFloor">Flats Per Floor</Label>

        <Input
          id="flatsPerFloor"
          name="flatsPerFloor"
          type="number"
          required
          placeholder="8"
        />

        <p className="text-sm text-muted-foreground">
          Flats are numbered using the floor number, e.g. Floor 3 with 8
          flats becomes 301–308.
        </p>
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
        Bedrooms, bathrooms, rent, and status apply to every flat generated.
        Existing floors or flats with matching numbers are left untouched —
        nothing is overwritten.
      </p>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Generating..." : "Generate Floors & Flats"}
      </Button>
    </form>
  );
}