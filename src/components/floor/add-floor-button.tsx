"use client";

import { Plus } from "lucide-react";

import { createFloor } from "@/actions/floor/create-floor";

import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/form-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FloorBulkForm } from "./floor-bulk-form";
import { FloorForm } from "./floor-form";

type AddFloorButtonProps = {
  buildingId: string;
  variant?: "default" | "outline";
};

export function AddFloorButton({ buildingId, variant = "default" }: AddFloorButtonProps) {
  return (
    <FormDialog
      title="Add floors"
      trigger={
        <Button variant={variant}>
          <Plus />
          Add floor
        </Button>
      }
    >
      {(close) => (
        <Tabs defaultValue="single">
          <TabsList>
            <TabsTrigger value="single">One floor</TabsTrigger>
            <TabsTrigger value="range">Several floors</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="pt-3">
            <FloorForm
              action={(formData) => createFloor(buildingId, formData)}
              submitText="Add floor"
              onSuccess={close}
            />
          </TabsContent>

          <TabsContent value="range" className="pt-3">
            <FloorBulkForm buildingId={buildingId} onSuccess={close} />
          </TabsContent>
        </Tabs>
      )}
    </FormDialog>
  );
}
