"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { endLease } from "@/actions/join-request/end-lease";

import { Button } from "@/components/ui/button";

type EndLeaseButtonProps = {
  requestId: string;
};

export function EndLeaseButton({ requestId }: EndLeaseButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleEndLease() {
    const confirmed = window.confirm(
      "End this lease? The flat will be marked vacant again, and this tenant will no longer see it as their current flat."
    );

    if (!confirmed) return;

    setIsPending(true);
    const result = await endLease(requestId);
    setIsPending(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    router.refresh();
  }

  return (
    <Button
      size="sm"
      variant="destructive"
      disabled={isPending}
      onClick={handleEndLease}
    >
      {isPending ? "Working..." : "End Lease"}
    </Button>
  );
}
