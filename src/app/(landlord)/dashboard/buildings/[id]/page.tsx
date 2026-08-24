import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteBuildingButton } from "@/components/building/delete-building-button";
import { getBuilding } from "@/actions/building/get-building";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackLink } from "@/components/ui/back-link";

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

          <Link href={`/dashboard/buildings/${building.id}/floors`}>
            <Button variant="outline">
              Manage Floors
            </Button>
          </Link>

          <Link href={`/dashboard/buildings/${building.id}/requests`}>
            <Button variant="outline">
              View Requests
            </Button>
          </Link>

          <Link href={`/dashboard/buildings/${building.id}/edit`}>
            <Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">
              Status
            </p>

            <p className="font-semibold">
              {building.status}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Floors
            </p>

            <Link
              href={`/dashboard/buildings/${building.id}/floors`}
              className="font-semibold hover:underline"
            >
              {building.floors.length}
            </Link>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              Notices
            </p>

            <p className="font-semibold">
              {building.notices.length}
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}