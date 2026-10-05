"use client";

import { Button } from "@/components/ui/button";
import { FieldError, FormError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useActionForm } from "@/hooks/use-action-form";
import type { ActionResult } from "@/types/action-result";

export type BuildingFormValues = {
  name: string;
  address: string;
  city: string;
  postcode: string | null;
  country: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
};

type BuildingFormProps = {
  action: (formData: FormData) => Promise<ActionResult | void>;
  submitText: string;
  defaultValues?: BuildingFormValues;
  onSuccess?: () => void;
};

export function BuildingForm({
  action,
  submitText,
  defaultValues,
  onSuccess,
}: BuildingFormProps) {
  const { submit, isPending, errors, message } = useActionForm(action, {
    onSuccess,
  });

  return (
    <form action={submit} className="space-y-4">
      <FormError message={message} />

      <div className="space-y-1.5">
        <Label htmlFor="name">Building name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Sunrise Apartments"
          defaultValue={defaultValues?.name}
        />
        <FieldError errors={errors.name} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          required
          placeholder="House 12, Road 5, Banani"
          defaultValue={defaultValues?.address}
        />
        <FieldError errors={errors.address} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            required
            placeholder="Dhaka"
            defaultValue={defaultValues?.city}
          />
          <FieldError errors={errors.city} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="postcode">Postcode</Label>
          <Input
            id="postcode"
            name="postcode"
            placeholder="1213"
            defaultValue={defaultValues?.postcode ?? ""}
          />
          <FieldError errors={errors.postcode} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            defaultValue={defaultValues?.country ?? "Bangladesh"}
          />
          <FieldError errors={errors.country} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Lift, parking, generator backup..."
          defaultValue={defaultValues?.description ?? ""}
        />
        <FieldError errors={errors.description} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Tenant search</Label>
        <NativeSelect
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? "ACTIVE"}
        >
          <option value="ACTIVE">Show in tenant search</option>
          <option value="INACTIVE">Hide from tenant search</option>
        </NativeSelect>
        <p className="text-xs text-muted-foreground">
          Tenants also need this building&apos;s access code to send a request.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : submitText}
      </Button>
    </form>
  );
}
