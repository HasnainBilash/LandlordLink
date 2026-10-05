import Link from "next/link";

import {
  FlatStatusBadge,
  OverdueBadge,
  type FlatStatus,
} from "@/components/ui/status-badges";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type FlatTileProps = {
  flat: {
    id: string;
    flatNumber: string;
    bedrooms: number;
    bathrooms: number;
    status: FlatStatus;
    rent: number;
    tenantName: string | null;
    isOverdue: boolean;
  };
};

export function FlatTile({ flat }: FlatTileProps) {
  return (
    <Link
      href={`/dashboard/flats/${flat.id}`}
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-background p-3 transition-colors hover:border-ring",
        flat.isOverdue && "border-red-300 dark:border-red-500/40"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">Flat {flat.flatNumber}</p>
        <FlatStatusBadge status={flat.status} />
      </div>

      <p className="truncate text-sm text-muted-foreground">
        {flat.tenantName ?? `${flat.bedrooms} bed · ${flat.bathrooms} bath`}
      </p>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {formatMoney(flat.rent)}
          <span className="font-normal text-muted-foreground">/mo</span>
        </p>
        {flat.isOverdue && <OverdueBadge />}
      </div>
    </Link>
  );
}
