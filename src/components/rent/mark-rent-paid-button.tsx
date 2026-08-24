"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { markRentPaid } from "@/actions/rent/mark-rent-paid";

import { Button } from "@/components/ui/button";

type MarkRentPaidButtonProps = {
  rentId: string;
};

export function MarkRentPaidButton({ rentId }: MarkRentPaidButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleMarkPaid() {
    const confirmed = window.confirm("Mark this rent period as paid?");

    if (!confirmed) return;

    setIsPending(true);
    const result = await markRentPaid(rentId);
    setIsPending(false);

    if (!result.success) {
      alert(result.message);
      return;
    }

    router.refresh();
  }

  return (
    <Button size="sm" disabled={isPending} onClick={handleMarkPaid}>
      {isPending ? "Working..." : "Mark Paid"}
    </Button>
  );
}
