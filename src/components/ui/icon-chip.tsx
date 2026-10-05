import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type IconChipTone = "primary" | "success" | "danger" | "warning" | "info" | "muted";

const TONES: Record<IconChipTone, string> = {
  primary: "bg-primary/10 text-primary dark:bg-primary/20",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  info: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  muted: "bg-muted text-muted-foreground",
};

const SIZES = {
  sm: "size-8 rounded-lg [&>svg]:size-4",
  md: "size-9 rounded-xl [&>svg]:size-4.5",
  lg: "size-11 rounded-2xl [&>svg]:size-5",
} as const;

type IconChipProps = {
  icon: LucideIcon;
  tone?: IconChipTone;
  size?: keyof typeof SIZES;
  className?: string;
};

// A small tinted square holding an icon, used to label stats and list rows.
export function IconChip({ icon: Icon, tone = "primary", size = "md", className }: IconChipProps) {
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center", TONES[tone], SIZES[size], className)}
    >
      <Icon />
    </span>
  );
}
