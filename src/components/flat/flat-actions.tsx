"use client";

import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { deleteFlat } from "@/actions/flat/delete-flat";
import { updateFlat } from "@/actions/flat/update-flat";

import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { FormDialog } from "@/components/ui/form-dialog";

import { FlatForm } from "./flat-form";

type FlatActionsProps = {
  flat: {
    id: string;
    flatNumber: string;
    bedrooms: number;
    bathrooms: number;
    monthlyRent: number;
    status: "VACANT" | "OCCUPIED" | "MAINTENANCE";
  };
  buildingId: string;
  isLeased: boolean;
};

export function FlatActions({ flat, buildingId, isLeased }: FlatActionsProps) {
  const router = useRouter();

  return (
    <>
      <FormDialog
        title={`Edit flat ${flat.flatNumber}`}
        trigger={
          <Button variant="outline">
            <Pencil />
            Edit
          </Button>
        }
      >
        {(close) => (
          <FlatForm
            action={(formData) => updateFlat(flat.id, formData)}
            submitText="Save changes"
            defaultValues={flat}
            isLeased={isLeased}
            onSuccess={close}
          />
        )}
      </FormDialog>

      <ConfirmAction
        title={`Delete flat ${flat.flatNumber}?`}
        description={
          isLeased
            ? "This flat has a tenant. End the lease first, then you can delete it."
            : "The flat will be removed and pending requests for it will be declined. Its rent and payment history is kept."
        }
        confirmLabel="Delete flat"
        pendingLabel="Deleting..."
        destructive
        trigger={
          <Button variant="outline" aria-label="Delete flat">
            <Trash2 />
          </Button>
        }
        action={() => deleteFlat(flat.id)}
        onSuccess={() => router.push(`/dashboard/buildings/${buildingId}`)}
      />
    </>
  );
}
