"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type FloorFormProps = {
  action: (formData: FormData) => void | Promise<void>;

  submitText: string;

  defaultValues?: {
    floorNumber: number;
    name: string | null;
  };
};

export function FloorForm({
  action,
  submitText,
  defaultValues,
}: FloorFormProps) {
  const { run, isPending } = useSingleFlightAction(action);

  return (
    <form action={run} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="floorNumber">Floor Number</Label>

        <Input
          id="floorNumber"
          name="floorNumber"
          type="number"
          required
          placeholder="1"
          defaultValue={defaultValues?.floorNumber}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Floor Name</Label>

        <Input
          id="name"
          name="name"
          placeholder="Ground Floor (optional)"
          defaultValue={defaultValues?.name ?? ""}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : submitText}
      </Button>
    </form>
  );
}
