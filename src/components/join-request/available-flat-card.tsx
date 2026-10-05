import { Badge } from "@/components/ui/badge";
import { formatFloor, formatMoney } from "@/lib/format";

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
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div>
        <p className="font-semibold">Flat {flat.flatNumber}</p>
        <p className="text-sm text-muted-foreground">
          {formatFloor(flat.floor)} · {flat.bedrooms} bed · {flat.bathrooms} bath
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <p className="font-semibold">
          {formatMoney(flat.monthlyRent)}
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
        </p>

        {alreadyRequested ? (
          <Badge variant="secondary">Requested</Badge>
        ) : (
          <RequestFlatButton
            flatId={flat.id}
            flatLabel={`flat ${flat.flatNumber}`}
            accessCode={accessCode}
          />
        )}
      </div>
    </div>
  );
}
