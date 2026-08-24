import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusVariant = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  ENDED: "secondary",
} as const;

type MyRequestCardProps = {
  request: {
    id: string;
    flatId: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "ENDED";
    message: string | null;
    createdAt: Date;
    building: {
      name: string;
    };
    flat: {
      flatNumber: string;
      floor: {
        floorNumber: number;
        name: string | null;
      };
    };
  };
};

export function MyRequestCard({ request }: MyRequestCardProps) {
  const floorLabel =
    request.flat.floor.name || `Floor ${request.flat.floor.floorNumber}`;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{request.building.name}</CardTitle>
        <Badge variant={statusVariant[request.status]}>
          {request.status}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          {floorLabel} · Flat {request.flat.flatNumber}
        </p>

        {request.message && (
          <p className="italic">&quot;{request.message}&quot;</p>
        )}

        <p>Requested {new Date(request.createdAt).toLocaleDateString()}</p>

        <Link href={`/tenant/flats/${request.flatId}`}>
          <Button size="sm" variant="outline">
            View Flat Details
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}