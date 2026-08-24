"use client";

import { useRouter } from "next/navigation";
import { deleteFlat } from "@/actions/flat/delete-flat";

import { Button } from "@/components/ui/button";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type DeleteFlatButtonProps = {
  flatId: string;
  buildingId: string;
  floorId: string;
};

export function DeleteFlatButton({
  flatId,
  buildingId,
  floorId,
}: DeleteFlatButtonProps) {
  const router = useRouter();
  const { run, isPending } = useSingleFlightAction(deleteFlat);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this flat?\n\nThis action can be reversed later by an administrator."
    );

    if (!confirmed) return;

    const result = await run(flatId);

    if (!result) return;

    if (!result.success) {
      alert(result.message);
      return;
    }

    router.replace(
      `/dashboard/buildings/${buildingId}/floors/${floorId}/flats`
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={isPending}
      onClick={handleDelete}
    >
      {isPending ? "Deleting..." : "Delete Flat"}
    </Button>
  );
}
