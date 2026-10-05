"use client";

import { upsertTenantProfile } from "@/actions/tenant-profile/upsert-tenant-profile";

import { Button } from "@/components/ui/button";
import { FieldError, FormError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionForm } from "@/hooks/use-action-form";

type TenantProfileFormProps = {
  defaultValues: {
    occupation: string;
    nationalId: string;
    emergencyContact: string;
  };
};

export function TenantProfileForm({ defaultValues }: TenantProfileFormProps) {
  const { submit, isPending, errors, message } = useActionForm(upsertTenantProfile);

  return (
    <form action={submit} className="space-y-4">
      <FormError message={message} />

      <div className="space-y-1.5">
        <Label htmlFor="occupation">Occupation</Label>
        <Input
          id="occupation"
          name="occupation"
          placeholder="Software engineer"
          defaultValue={defaultValues.occupation}
        />
        <FieldError errors={errors.occupation} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nationalId">National ID (NID)</Label>
        <Input
          id="nationalId"
          name="nationalId"
          placeholder="NID number"
          defaultValue={defaultValues.nationalId}
        />
        <FieldError errors={errors.nationalId} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="emergencyContact">Emergency contact</Label>
        <Input
          id="emergencyContact"
          name="emergencyContact"
          placeholder="Name and phone number"
          defaultValue={defaultValues.emergencyContact}
        />
        <FieldError errors={errors.emergencyContact} />
      </div>

      <p className="text-xs text-muted-foreground">
        Everything here is optional. Landlords you send a request to can see it.
      </p>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
