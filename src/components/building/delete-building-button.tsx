"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteBuilding } from "@/actions/building/delete-building";

import { Button } from "@/components/ui/button";

type DeleteBuildingButtonProps = {
  buildingId: string;
};

export function DeleteBuildingButton({
  buildingId,
}: DeleteBuildingButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this building?\n\nThis action can be reversed later by an administrator."
    );

    if (!confirmed) return;

    setIsPending(true);

    const result = await deleteBuilding(buildingId);

    if (!result.success) {
      setIsPending(false);
      alert(result.message);
      return;
    }

    router.replace("/dashboard/buildings");
  }
  return (
    <Button
      type="button"
      variant="destructive"
      disabled={isPending}
      onClick={handleDelete}
    >
      {isPending ? "Deleting..." : "Delete Building"}
    </Button>
  );
}