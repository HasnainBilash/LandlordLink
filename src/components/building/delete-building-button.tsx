"use client";

import { useRouter } from "next/navigation";
import { deleteBuilding } from "@/actions/building/delete-building";

import { Button } from "@/components/ui/button";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type DeleteBuildingButtonProps = {
  buildingId: string;
};

export function DeleteBuildingButton({
  buildingId,
}: DeleteBuildingButtonProps) {
  const router = useRouter();
  const { run, isPending } = useSingleFlightAction(deleteBuilding);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this building?\n\nThis action can be reversed later by an administrator."
    );

    if (!confirmed) return;

    const result = await run(buildingId);

    if (!result) return;

    if (!result.success) {
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
