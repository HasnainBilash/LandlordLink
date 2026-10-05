"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Building2, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { startDemo } from "@/actions/demo";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoButtonsProps = {
  className?: string;
  // "hero" = large buttons on the landing page, "compact" = under a form.
  variant?: "hero" | "compact";
};

export function DemoButtons({ className, variant = "hero" }: DemoButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [opening, setOpening] = useState<"landlord" | "tenant" | null>(null);

  function open(role: "landlord" | "tenant") {
    setOpening(role);
    startTransition(async () => {
      const result = await startDemo(role);

      // On success the action redirects and this never returns.
      if (result && !result.success) {
        toast.error(result.message);
        setOpening(null);
      }
    });
  }

  const size = variant === "hero" ? "lg" : "default";
  const big = variant === "hero" ? "h-11 px-5 text-[15px]" : "";

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", className)}>
      <Button
        type="button"
        size={size}
        className={cn("gap-2 shadow-md shadow-blue-600/25", big)}
        disabled={isPending}
        onClick={() => open("landlord")}
      >
        {opening === "landlord" ? <Loader2 className="animate-spin" /> : <Building2 />}
        Try as landlord
        <ArrowRight className="opacity-70" />
      </Button>

      <Button
        type="button"
        size={size}
        variant="outline"
        className={cn("gap-2 bg-background/70 backdrop-blur", big)}
        disabled={isPending}
        onClick={() => open("tenant")}
      >
        {opening === "tenant" ? <Loader2 className="animate-spin" /> : <KeyRound />}
        Try as tenant
      </Button>
    </div>
  );
}
