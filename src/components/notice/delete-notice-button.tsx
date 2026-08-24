"use client";

import { useRouter } from "next/navigation";

import { deleteNotice } from "@/actions/notice/delete-notice";

import { Button } from "@/components/ui/button";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type DeleteNoticeButtonProps = {
  noticeId: string;
};

export function DeleteNoticeButton({ noticeId }: DeleteNoticeButtonProps) {
  const router = useRouter();
  const { run, isPending } = useSingleFlightAction(deleteNotice);

  async function handleDelete() {
    const confirmed = window.confirm("Delete this notice?");

    if (!confirmed) return;

    const result = await run(noticeId);

    if (!result) return;

    if (!result.success) {
      alert(result.message);
      return;
    }

    router.refresh();
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      disabled={isPending}
      onClick={handleDelete}
    >
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
