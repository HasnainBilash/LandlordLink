"use client";

import { useRouter } from "next/navigation";

import { endLease } from "@/actions/join-request/end-lease";

import { Button } from "@/components/ui/button";
import { useSingleFlightAction } from "@/hooks/use-single-flight-action";

type EndLeaseButtonProps = {
  requestId: string;
};

export function EndLeaseButton({ requestId }: EndLeaseButtonProps) {
  const router = useRouter();
  const { run, isPending } = useSingleFlightAction(endLease);

  async function handleEndLease() {
    const confirmed = window.confirm(
      "End this lease? The flat will be marked vacant again, and this tenant will no longer see it as their current flat."
    );

    if (!confirmed) return;

    const result = await run(requestId);

    if (!result) return;

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
