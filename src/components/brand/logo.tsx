import Link from "next/link";
import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  className?: string;
  // White version for coloured backgrounds (e.g. the brand panel).
  inverted?: boolean;
};

export function LogoMark({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-xl shadow-sm",
        inverted
          ? "bg-white text-blue-700 shadow-black/10"
          : "bg-brand-gradient text-white shadow-blue-600/30",
        className
      )}
    >
      <Building2 className="size-4.5" strokeWidth={2.25} />
    </span>
  );
}

export function Logo({ href = "/", className, inverted = false }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}
    >
      <LogoMark inverted={inverted} />
      <span className="text-[15px]">
        Landlord
        <span className={inverted ? "text-sky-200" : "text-primary"}>Link</span>
      </span>
    </Link>
  );
}
