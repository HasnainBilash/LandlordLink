import Link from "next/link";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatTileProps = {
  label: string;
  value: ReactNode;
  href?: string;
  destructive?: boolean;
};

export function StatTile({ label, value, href, destructive }: StatTileProps) {
  const valueClass = cn("font-semibold", destructive && "text-destructive");

  if (!href) {
    return (
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={valueClass}>{value}</p>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="block rounded-lg border p-3 transition-colors hover:bg-muted hover:border-ring"
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={valueClass}>{value}</p>
    </Link>
  );
}
