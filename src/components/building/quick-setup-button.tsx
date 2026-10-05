"use client";

import { Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/ui/form-dialog";

import { QuickSetupForm } from "./quick-setup-form";

export function QuickSetupButton({ buildingId }: { buildingId: string }) {
  return (
    <FormDialog
      title="Quick setup"
      description="Create many floors and flats in one go. Existing floors and flats are never changed."
      trigger={
        <Button variant="outline">
          <Wand2 />
          Quick setup
        </Button>
      }
    >
      {(close) => <QuickSetupForm buildingId={buildingId} onSuccess={close} />}
    </FormDialog>
  );
}
