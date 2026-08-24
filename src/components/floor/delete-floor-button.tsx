"use client";

import { useRouter } from "next/navigation";
import { deleteFloor } from "@/actions/floor/delete-floor";

import { Button } from "@/components/ui/button";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type DeleteFloorButtonProps = {
  floorId: string;
  buildingId: string;
};

export function DeleteFloorButton({
  floorId,
  buildingId,
}: DeleteFloorButtonProps) {
  const router = useRouter();
  const { run, isPending } = useSingleFlightAction(deleteFloor);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this floor?\n\nThis action can be reversed later by an administrator."
    );

    if (!confirmed) return;

    const result = await run(floorId);

    if (!result) return;

    if (!result.success) {
      alert(result.message);
      return;
    }

    router.replace(`/dashboard/buildings/${buildingId}/floors`);
  }

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={isPending}
      onClick={handleDelete}
    >
      {isPending ? "Deleting..." : "Delete Floor"}
    </Button>
  );
}
