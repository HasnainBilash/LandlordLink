"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type FloorBulkFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function FloorBulkForm({ action }: FloorBulkFormProps) {
  const { run, isPending } = useSingleFlightAction(action);

  return (
    <form action={run} className="space-y-6">
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

      <p className="text-sm text-muted-foreground">
        This creates one floor for every number in the range, inclusive.
        Floor numbers that already exist in this building are skipped
        automatically. Each floor is named &quot;Floor N&quot; by default and
        can be renamed individually afterward.
      </p>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create Floors"}
      </Button>
    </form>
  );
}
