"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type BuildingFormProps = {
  action: (formData: FormData) => void | Promise<void>;

  submitText: string;

  defaultValues?: {
    name: string;
    address: string;
    city: string;
    postcode: string | null;
    country: string;
    description: string | null;
  };
};

export function BuildingForm({
  action,
  submitText,
  defaultValues,
}: BuildingFormProps) {
  const { run, isPending } = useSingleFlightAction(action);

  return (
    <form action={run} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Building Name</Label>

        <Input
          id="name"
          name="name"
          required
          placeholder="Sunrise Apartment"
          defaultValue={defaultValues?.name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>

        <Input
          id="address"
          name="address"
          required
          placeholder="123 Main Road"
          defaultValue={defaultValues?.address}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>

        <Input
          id="city"
          name="city"
          required
          placeholder="Dhaka"
          defaultValue={defaultValues?.city}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="postcode">Postcode</Label>

          <Input
            id="postcode"
            name="postcode"
            placeholder="1207"
            defaultValue={defaultValues?.postcode ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>

          <Input
            id="country"
            name="country"
            defaultValue={defaultValues?.country ?? "Bangladesh"}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>

        <Textarea
          id="description"
          name="description"
          rows={5}
          placeholder="Optional description..."
          defaultValue={defaultValues?.description ?? ""}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : submitText}
      </Button>
    </form>
  );
}