"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { createFlat } from "@/actions/flat/create-flat";
import { deleteFloor } from "@/actions/floor/delete-floor";
import { updateFloor } from "@/actions/floor/update-floor";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlatBulkForm } from "@/components/flat/flat-bulk-form";
import { FlatForm } from "@/components/flat/flat-form";
import { formatFloor } from "@/lib/format";

import { FloorForm } from "./floor-form";

type FloorActionsProps = {
  floor: {
    id: string;
    floorNumber: number;
    name: string | null;
  };
};

type OpenDialog = "add-flats" | "edit" | "delete" | null;

export function FloorActions({ floor }: FloorActionsProps) {
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const label = formatFloor(floor);

  const onOpenChange = (name: OpenDialog) => (open: boolean) =>
    setDialog(open ? name : null);

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="ghost" onClick={() => setDialog("add-flats")}>
        <Plus />
        Add flats
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label={`${label} actions`} />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem onClick={() => setDialog("edit")}>
            <Pencil />
            Edit floor
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
            <Trash2 />
            Delete floor
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FormDialog
        title={`Add flats to ${label}`}
        open={dialog === "add-flats"}
        onOpenChange={onOpenChange("add-flats")}
      >
        {(close) => (
          <Tabs defaultValue="single">
            <TabsList>
              <TabsTrigger value="single">One flat</TabsTrigger>
              <TabsTrigger value="range">Several flats</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="pt-3">
              <FlatForm
                action={(formData) => createFlat(floor.id, formData)}
                submitText="Add flat"
                onSuccess={close}
              />
            </TabsContent>

            <TabsContent value="range" className="pt-3">
              <FlatBulkForm floorId={floor.id} onSuccess={close} />
            </TabsContent>
          </Tabs>
        )}
      </FormDialog>

      <FormDialog
        title={`Edit ${label}`}
        open={dialog === "edit"}
        onOpenChange={onOpenChange("edit")}
      >
        {(close) => (
          <FloorForm
            action={(formData) => updateFloor(floor.id, formData)}
            submitText="Save changes"
            defaultValues={{ floorNumber: floor.floorNumber, name: floor.name }}
            onSuccess={close}
          />
        )}
      </FormDialog>

      <ConfirmAction
        title={`Delete ${label}?`}
        description="The floor and all of its flats will be removed, and pending requests for those flats will be declined. Rent and payment history is kept. You can't delete a floor while a tenant still lives on it."
        confirmLabel="Delete floor"
        pendingLabel="Deleting..."
        destructive
        open={dialog === "delete"}
        onOpenChange={onOpenChange("delete")}
        action={() => deleteFloor(floor.id)}
      />
    </div>
  );
}
