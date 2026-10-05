"use client";

import { Plus } from "lucide-react";

import { createBuilding } from "@/actions/building/create-building";

import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/form-dialog";

import { BuildingForm } from "./building-form";

type AddBuildingButtonProps = {
  label?: string;
};

export function AddBuildingButton({ label = "Add building" }: AddBuildingButtonProps) {
  return (
    <FormDialog
      title="Add a building"
      description="You can add floors and flats right after."
      trigger={
        <Button>
          <Plus />
          {label}
        </Button>
      }
    >
      {/* createBuilding redirects to the new building's page. */}
      {() => <BuildingForm action={createBuilding} submitText="Add building" />}
    </FormDialog>
  );
}
