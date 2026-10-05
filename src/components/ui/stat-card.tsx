import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { IconChip, type IconChipTone } from "./icon-chip";
import { surface, surfaceLink } from "./surface";

type Tone = "default" | "danger" | "success" | "warning";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  tone?: Tone;
  icon?: LucideIcon;
};

const ICON_TONES: Record<Tone, IconChipTone> = {
  default: "primary",
  success: "success",
  danger: "danger",
  warning: "warning",
};

const VALUE_TONES: Record<Tone, string> = {
  default: "",
  success: "text-emerald-600 dark:text-emerald-400",
  danger: "text-red-600 dark:text-red-400",
  warning: "text-amber-600 dark:text-amber-400",
};

export function StatCard({
  label,
  value,
  hint,
  href,
  tone = "default",
  icon,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <IconChip icon={icon} tone={ICON_TONES[tone]} />}
      </div>

      <p className={cn("text-2xl font-semibold tracking-tight tabular-nums md:text-[1.7rem]", VALUE_TONES[tone])}>
        {value}
      </p>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </>
  );

  const className = cn(surface, "flex flex-col gap-1.5 p-4 md:p-5");

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={cn(className, surfaceLink)}>
      {content}
    </Link>
  );
}
