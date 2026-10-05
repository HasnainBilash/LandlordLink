import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

// Each person keeps the same colour everywhere: it's picked from their
// name, so server and client always agree.
const COLORS = [
  "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
];

function colorFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

type InitialsAvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

export function InitialsAvatar({ name, size = "md", className }: InitialsAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        SIZES[size],
        colorFor(name),
        className
      )}
    >
      {getInitials(name)}
    </span>
  );
}
