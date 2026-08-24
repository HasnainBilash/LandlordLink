import Link from "next/link";
import { notFound } from "next/navigation";

import { getFlat } from "@/actions/flat/get-flat";
import { DeleteFlatButton } from "@/components/flat/delete-flat-button";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackLink } from "@/components/ui/back-link";
import { ApproveRejectButtons } from "@/components/join-request/approve-reject-buttons";
import { EndTenancyButton } from "@/components/join-request/end-tenancy-button";

type PageProps = {
  params: Promise<{
    id: string;
    floorId: string;
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

export default async function FlatDetailsPage({ params }: PageProps) {
  const { id, floorId, flatId } = await params;

  const flat = await getFlat(flatId);

  if (!flat || flat.floorId !== floorId || flat.floor.buildingId !== id) {
    notFound();
  }

  const floorLabel = flat.floor.name || `Floor ${flat.floor.floorNumber}`;

  const currentTenantRequest = flat.joinRequests.find(
    (request) => request.status === "APPROVED"
  );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Buildings", href: "/dashboard/buildings" },
            { label: flat.floor.building.name, href: `/dashboard/buildings/${id}` },
            { label: "Floors", href: `/dashboard/buildings/${id}/floors` },
            {
              label: floorLabel,
              href: `/dashboard/buildings/${id}/floors/${floorId}`,
            },
            {
              label: "Flats",
              href: `/dashboard/buildings/${id}/floors/${floorId}/flats`,
            },
            { label: `Flat ${flat.flatNumber}` },
          ]}
        />

        <BackLink
          href={`/dashboard/buildings/${id}/floors/${floorId}/flats`}
          label="Flats"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Flat {flat.flatNumber}</h1>
          <Badge variant={flatStatusVariant[flat.status]}>{flat.status}</Badge>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/dashboard/buildings/${id}/floors/${floorId}/flats/${flat.id}/edit`}
          >
            <Button>Edit Flat</Button>
          </Link>

          <DeleteFlatButton
            flatId={flat.id}
            buildingId={id}
            floorId={floorId}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Bedrooms</p>
            <p className="font-semibold">{flat.bedrooms}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Bathrooms</p>
            <p className="font-semibold">{flat.bathrooms}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Monthly Rent</p>
            <p className="font-semibold">
              ${Number(flat.monthlyRent).toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-semibold">{flat.status}</p>
          </div>
        </CardContent>
      </Card>

      {currentTenantRequest && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Current Tenant</CardTitle>
            <EndTenancyButton requestId={currentTenantRequest.id} />
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">
                {currentTenantRequest.tenant.user.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">
                {currentTenantRequest.tenant.user.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Occupation</p>
              <p className="font-semibold">
                {currentTenantRequest.tenant.occupation || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Emergency Contact
              </p>
              <p className="font-semibold">
                {currentTenantRequest.tenant.emergencyContact || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="font-semibold">
                {new Date(
                  currentTenantRequest.updatedAt
                ).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
        </CardHeader>

        <CardContent>
          {flat.joinRequests.length === 0 ? (
            <p className="text-muted-foreground">
              No one has requested this flat yet.
            </p>
          ) : (
            <div className="space-y-4">
              {flat.joinRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold">
                      {request.tenant.user.name}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {request.tenant.user.email}
                    </p>

                    {request.message && (
                      <p className="mt-1 text-sm italic text-muted-foreground">
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

                    {request.status === "PENDING" && (
                      <div className="mt-2">
                        <ApproveRejectButtons requestId={request.id} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}