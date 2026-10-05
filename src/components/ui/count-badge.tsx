type CountBadgeProps = {
  count: number;
};

export function CountBadge({ count }: CountBadgeProps) {
  if (count <= 0) return null;

  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white tabular-nums">
      {count}
    </span>
  );
}
