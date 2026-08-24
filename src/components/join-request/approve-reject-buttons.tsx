"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { approveJoinRequest } from "@/actions/join-request/approve-join-request";
import { rejectJoinRequest } from "@/actions/join-request/reject-join-request";

import { Button } from "@/components/ui/button";

type ApproveRejectButtonsProps = {
  requestId: string;
};

export function ApproveRejectButtons({
  requestId,
}: ApproveRejectButtonsProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleApprove() {
    const confirmed = window.confirm(
      "Approve this request? The flat will be marked occupied, and any other pending requests for it will be automatically rejected."
    );

    if (!confirmed) return;

    setIsPending(true);
    const result = await approveJoinRequest(requestId);
    setIsPending(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    router.refresh();
  }

  async function handleReject() {
    const confirmed = window.confirm("Reject this request?");

    if (!confirmed) return;

    setIsPending(true);
    const result = await rejectJoinRequest(requestId);
    setIsPending(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex gap-3">
      <Button size="sm" disabled={isPending} onClick={handleApprove}>
        {isPending ? "Working..." : "Approve"}
      </Button>

      <Button
        size="sm"
        variant="destructive"
        disabled={isPending}
        onClick={handleReject}
      >
        Reject
      </Button>
    </div>
  );
}
