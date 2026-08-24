import { notFound } from "next/navigation";

import { getTenantFlatView } from "@/actions/join-request/get-tenant-flat-view";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";

type PageProps = {
  params: Promise<{
    flatId: string;
  }>;
};

const flatStatusVariant = {
  VACANT: "outline",
  OCCUPIED: "default",
  MAINTENANCE: "secondary",
} as const;

const requestStatusVariant = {
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  ENDED: "secondary",
} as const;

export default async function TenantFlatDetailsPage({ params }: PageProps) {
  const { flatId } = await params;

  const result = await getTenantFlatView(flatId);

  if (!result) {
    notFound();
  }

  const { flat, myRequests } = result;

  const floorLabel = flat.floor.name || `Floor ${flat.floor.floorNumber}`;

  return (
    <div className="space-y-6">
      <BackLink href="/tenant/requests" label="My Requests" />

      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Flat {flat.flatNumber}</h1>
        <Badge variant={flatStatusVariant[flat.status]}>{flat.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Building</p>
            <p className="font-semibold">{flat.floor.building.name}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-semibold">
              {flat.floor.building.address}, {flat.floor.building.city}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Floor</p>
            <p className="font-semibold">{floorLabel}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Monthly Rent</p>
            <p className="font-semibold">
              ${Number(flat.monthlyRent).toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Bedrooms</p>
            <p className="font-semibold">{flat.bedrooms}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Bathrooms</p>
            <p className="font-semibold">{flat.bathrooms}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Request History</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {myRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div>
                  {request.message && (
                    <p className="text-sm italic text-muted-foreground">
                      &quot;{request.message}&quot;
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <Badge variant={requestStatusVariant[request.status]}>
                    {request.status}
                  </Badge>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}