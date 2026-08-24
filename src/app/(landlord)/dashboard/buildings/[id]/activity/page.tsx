import { notFound } from "next/navigation";

import { getBuilding } from "@/actions/building/get-building";
import { getActivityLogsForBuilding } from "@/actions/activity-log/get-activity-logs-for-building";
import { ActivityLogList } from "@/components/activity-log/activity-log-list";

import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackLink } from "@/components/ui/back-link";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BuildingActivityPage({ params }: PageProps) {
  const { id } = await params;

  const building = await getBuilding(id);

  if (!building) {
    notFound();
  }

  const logs = await getActivityLogsForBuilding(id);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Buildings", href: "/dashboard/buildings" },
            { label: building.name, href: `/dashboard/buildings/${id}` },
            { label: "Activity" },
          ]}
        />

        <BackLink href={`/dashboard/buildings/${id}`} label={building.name} />
      </div>

      <div>
        <h1 className="text-3xl font-bold">Activity</h1>
        <p className="text-muted-foreground">{building.name}</p>
      </div>

      <ActivityLogList logs={logs} />
    </div>
  );
}
