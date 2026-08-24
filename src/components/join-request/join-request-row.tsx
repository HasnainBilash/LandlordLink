import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApproveRejectButtons } from "./approve-reject-buttons";
import { EndLeaseButton } from "./end-lease-button";

const statusVariant = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  ENDED: "secondary",
} as const;

type JoinRequestRowProps = {
  request: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "ENDED";
    message: string | null;
    createdAt: Date;
    building: {
      name: string;
    };
    tenant: {
      user: {
        name: string;
        email: string;
      };
    };
    flat: {
      flatNumber: string;
      monthlyRent: number | string;
      floor: {
        floorNumber: number;
        name: string | null;
      };
    };
  };
};

export function JoinRequestRow({ request }: JoinRequestRowProps) {
  const floorLabel =
    request.flat.floor.name || `Floor ${request.flat.floor.floorNumber}`;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{request.tenant.user.name}</CardTitle>
        <Badge variant={statusVariant[request.status]}>
          {request.status}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {request.building.name} · {floorLabel} · Flat {request.flat.flatNumber}
        </p>

        <p className="text-sm text-muted-foreground">
          {request.tenant.user.email}
        </p>

        {request.message && (
          <p className="text-sm italic">&quot;{request.message}&quot;</p>
        )}

        {request.status === "PENDING" && (
          <ApproveRejectButtons
            requestId={request.id}
            defaultMonthlyRent={request.flat.monthlyRent}
          />
        )}

        {request.status === "APPROVED" && (
          <EndLeaseButton requestId={request.id} />
        )}
      </CardContent>
    </Card>
  );
}