import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteBuildingButton } from "@/components/building/delete-building-button";
import { getBuilding } from "@/actions/building/get-building";
import { getOutstandingBalanceForBuilding } from "@/actions/rent/get-outstanding-balance-for-building";
import { getPendingJoinRequestsCount } from "@/actions/join-request/get-pending-join-requests-count";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackLink } from "@/components/ui/back-link";
import { StatTile } from "@/components/ui/stat-tile";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BuildingDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const building = await getBuilding(id);

  if (!building) {
    notFound();
  }

  const [{ totalOutstanding, flatsWithOutstandingRent }, pendingRequests] =
    await Promise.all([
      getOutstandingBalanceForBuilding(id),
      getPendingJoinRequestsCount(id),
    ]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Buildings", href: "/dashboard/buildings" },
            { label: building.name },
          ]}
        />

        <BackLink href="/dashboard/buildings" label="Buildings" />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {building.name}
          </h1>

          <p className="text-muted-foreground">
            {building.address}, {building.city}
          </p>
        </div>

        <div className="flex gap-3">
          <Link href={`/dashboard/buildings/${building.id}/quick-setup`}>
            <Button variant="outline">
              Quick Setup
            </Button>
          </Link>

          <Link href={`/dashboard/buildings/${building.id}/edit`}>
            <Button variant="outline">
              Edit Building
            </Button>
          </Link>

          <DeleteBuildingButton
            buildingId={building.id}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Status" value={building.status} />

          <StatTile
            label="Floors"
            value={building.floors.length}
            href={`/dashboard/buildings/${building.id}/floors`}
          />

          <StatTile
            label="Requests"
            value={pendingRequests > 0 ? `${pendingRequests} pending` : "View"}
            href={`/dashboard/buildings/${building.id}/requests`}
            destructive={pendingRequests > 0}
          />

          <StatTile
            label="Notices"
            value={building.notices.length}
            href={`/dashboard/buildings/${building.id}/notices`}
          />

          <StatTile
            label="Outstanding Rent"
            value={
              <>
                ${totalOutstanding.toFixed(2)}
                {flatsWithOutstandingRent > 0 &&
                  ` (${flatsWithOutstandingRent} flat${
                    flatsWithOutstandingRent === 1 ? "" : "s"
                  })`}
              </>
            }
            destructive={totalOutstanding > 0}
          />

          <StatTile
            label="Activity"
            value="View"
            href={`/dashboard/buildings/${building.id}/activity`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access Code</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Give this code to prospective tenants after they&apos;ve contacted you
            directly. They&apos;ll need it to submit a request for any flat in
            this building — it prevents strangers from mass-requesting
            without ever speaking to you.
          </p>

          <p className="mt-3 font-mono text-2xl font-bold tracking-widest">
            {building.accessCode ?? "—"}
          </p>

          {!building.accessCode && (
            <p className="mt-2 text-sm text-destructive">
              This building has no access code yet (it was created before
              this feature existed), so tenants can&apos;t submit requests
              for it. Run the backfill script to generate one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
