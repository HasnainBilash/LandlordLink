"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Wand2 } from "lucide-react";

import { deleteBuilding } from "@/actions/building/delete-building";
import { updateBuilding } from "@/actions/building/update-building";

import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormDialog } from "@/components/ui/form-dialog";

import { BuildingForm, type BuildingFormValues } from "./building-form";
import { QuickSetupForm } from "./quick-setup-form";

type BuildingActionsProps = {
  building: BuildingFormValues & { id: string };
};

type OpenDialog = "edit" | "quick-setup" | "delete" | null;

// The building page's "⋯" menu. The dialogs live outside the menu so
// they stay open after the menu closes.
export function BuildingActions({ building }: BuildingActionsProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<OpenDialog>(null);

  const onOpenChange = (name: OpenDialog) => (open: boolean) =>
    setDialog(open ? name : null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="icon" aria-label="Building actions" />}
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem onClick={() => setDialog("edit")}>
            <Pencil />
            Edit building
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setDialog("quick-setup")}>
            <Wand2 />
            Quick setup
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
            <Trash2 />
            Delete building
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FormDialog
        title="Edit building"
        open={dialog === "edit"}
        onOpenChange={onOpenChange("edit")}
      >
        {(close) => (
          <BuildingForm
            action={(formData) => updateBuilding(building.id, formData)}
            submitText="Save changes"
            defaultValues={building}
            onSuccess={close}
          />
        )}
      </FormDialog>

      <FormDialog
        title="Quick setup"
        description="Create many floors and flats in one go. Existing floors and flats are never changed."
        open={dialog === "quick-setup"}
        onOpenChange={onOpenChange("quick-setup")}
      >
        {(close) => <QuickSetupForm buildingId={building.id} onSuccess={close} />}
      </FormDialog>

      <ConfirmAction
        title={`Delete ${building.name}?`}
        description="The building, its floors and flats will be removed from your account, and pending requests for it will be declined. Rent and payment history is kept. You can't delete a building while tenants still have active leases."
        confirmLabel="Delete building"
        pendingLabel="Deleting..."
        destructive
        open={dialog === "delete"}
        onOpenChange={onOpenChange("delete")}
        action={() => deleteBuilding(building.id)}
        onSuccess={() => router.push("/dashboard/buildings")}
      />
    </>
  );
}
