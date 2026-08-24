"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { endTenancy } from "@/actions/join-request/end-tenancy";

import { Button } from "@/components/ui/button";

type EndTenancyButtonProps = {
  requestId: string;
};

export function EndTenancyButton({ requestId }: EndTenancyButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleEndTenancy() {
    const confirmed = window.confirm(
      "End this tenancy? The flat will be marked vacant again, and this tenant will no longer see it as their current flat."
    );

    if (!confirmed) return;

    setIsPending(true);
    const result = await endTenancy(requestId);
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
      onClick={handleEndTenancy}
    >
      {isPending ? "Working..." : "End Tenancy"}
    </Button>
  );
}