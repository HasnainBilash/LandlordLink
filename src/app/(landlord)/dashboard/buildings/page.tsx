import Link from "next/link";

import { getBuildings } from "@/actions/building/get-buildings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackLink } from "@/components/ui/back-link";
import { StatusFilter } from "@/components/ui/status-filter";
import { BuildingList } from "@/components/building/building-list";

type PageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const FILTER_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "All", value: "" },
];

export default async function BuildingsPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const activeStatus = status ?? "ACTIVE";

  const buildings = await getBuildings(activeStatus || undefined);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Buildings" },
          ]}
        />

        <BackLink href="/dashboard" label="Dashboard" />
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Buildings</h1>
        <Link href="/dashboard/buildings/new">
          <Button>
            Add Building
          </Button>
        </Link>
      </div>

      <StatusFilter
        basePath="/dashboard/buildings"
        options={FILTER_OPTIONS}
        active={activeStatus}
      />

      {buildings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {activeStatus
              ? "No buildings match this filter."
              : "You haven't created any buildings yet."}
          </CardContent>
        </Card>
      ) : (
        <BuildingList buildings={buildings} />
      )}
    </div>
  );
}