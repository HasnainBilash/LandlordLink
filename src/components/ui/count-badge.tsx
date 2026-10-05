type CountBadgeProps = {
  count: number;
};

export function CountBadge({ count }: CountBadgeProps) {
  if (count <= 0) return null;

  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
      {count}
    </span>
  );
}
