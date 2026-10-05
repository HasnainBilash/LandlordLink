import { Bath, BedDouble, CheckCircle2 } from "lucide-react";

import { surface } from "@/components/ui/surface";
import { formatFloor, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import { RequestFlatButton } from "./request-flat-button";

type AvailableFlatCardProps = {
  flat: {
    id: string;
    flatNumber: string;
    bedrooms: number;
    bathrooms: number;
    monthlyRent: number;
    floor: {
      floorNumber: number;
      name: string | null;
    };
  };
  alreadyRequested: boolean;
  accessCode?: string;
};

export function AvailableFlatCard({
  flat,
  alreadyRequested,
  accessCode,
}: AvailableFlatCardProps) {
  return (
    <article className={cn(surface, "flex flex-col gap-4 p-5")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-semibold">Flat {flat.flatNumber}</p>
          <p className="text-sm text-muted-foreground">{formatFloor(flat.floor)}</p>
        </div>
        <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
          Vacant
        </span>
      </div>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <BedDouble className="size-4" />
          {flat.bedrooms} bed
        </span>
        <span className="flex items-center gap-1.5">
          <Bath className="size-4" />
          {flat.bathrooms} bath
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-4">
        <p className="text-lg font-semibold tabular-nums">
          {formatMoney(flat.monthlyRent)}
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
        </p>

        {alreadyRequested ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            Requested
          </span>
        ) : (
          <RequestFlatButton
            flatId={flat.id}
            flatLabel={`flat ${flat.flatNumber}`}
            accessCode={accessCode}
          />
        )}
      </div>
    </article>
  );
}
