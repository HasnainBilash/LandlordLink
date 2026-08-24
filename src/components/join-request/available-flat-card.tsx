import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AvailableFlatCardProps = {
  flat: {
    id: string;
    flatNumber: string;
    bedrooms: number;
    bathrooms: number;
    monthlyRent: number | string;
    floor: {
      floorNumber: number;
      name: string | null;
      building: {
        name: string;
        city: string;
      };
    };
  };
  alreadyRequested: boolean;
};

export function AvailableFlatCard({
  flat,
  alreadyRequested,
}: AvailableFlatCardProps) {
  const floorLabel = flat.floor.name || `Floor ${flat.floor.floorNumber}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flat {flat.flatNumber}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{floorLabel}</p>

        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>
            {flat.bedrooms} bed · {flat.bathrooms} bath
          </span>

          <span>·</span>

          <span>${Number(flat.monthlyRent).toFixed(2)}/mo</span>
        </div>

        {alreadyRequested ? (
          <Badge variant="secondary">Already Requested</Badge>
        ) : (
          <Link href={`/tenant/flats/${flat.id}/request`}>
            <Button size="sm">Request to Join</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}