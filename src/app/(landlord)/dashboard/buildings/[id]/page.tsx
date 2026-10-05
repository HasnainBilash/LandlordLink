import { notFound } from "next/navigation";
import { AlertTriangle, Building2, Inbox, KeyRound, MapPin } from "lucide-react";

import { getActivityLogsForBuilding } from "@/actions/activity-log/get-activity-logs-for-building";
import { getBuilding, getBuildingOccupancy } from "@/actions/building/get-building";
import { getJoinRequests } from "@/actions/join-request/get-join-requests";
import { getOutstandingBalanceForBuilding } from "@/actions/rent/get-outstanding-balance-for-building";

import { ActivityLogList } from "@/components/activity-log/activity-log-list";
import { BuildingActions } from "@/components/building/building-actions";
import { BuildingUnits } from "@/components/building/building-units";
import { RequestList } from "@/components/join-request/request-list";
import { PageHeader } from "@/components/layout/page-header";
import { BuildingNotices } from "@/components/notice/building-notices";
import { CopyButton } from "@/components/ui/copy-button";
import { CountBadge } from "@/components/ui/count-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { IconChip } from "@/components/ui/icon-chip";
import { StatCard } from "@/components/ui/stat-card";
import { HiddenBadge } from "@/components/ui/status-badges";
import { StatusFilter } from "@/components/ui/status-filter";
import { surface } from "@/components/ui/surface";
import { TabNav } from "@/components/ui/tab-nav";
import { formatMoney, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; status?: string }>;
};

const TABS = ["units", "requests", "notices", "activity"] as const;
type Tab = (typeof TABS)[number];

const REQUEST_FILTERS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Lease ended", value: "ENDED" },
  { label: "All", value: "ALL" },
];

export default async function BuildingPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab: tabParam, status } = await searchParams;

  const tab: Tab = TABS.find((value) => value === tabParam) ?? "units";

  // All three check ownership themselves, so they can run together.
  const [building, occupancy, balance] = await Promise.all([
    getBuilding(id),
    getBuildingOccupancy(id),
    getOutstandingBalanceForBuilding(id),
  ]);

  if (!building) {
    notFound();
  }

  const basePath = `/dashboard/buildings/${id}`;
  const pendingRequests = building._count.joinRequests;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Buildings", href: "/dashboard/buildings" },
          { label: building.name },
        ]}
        title={building.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {building.address}, {building.city}
            </span>
            {building.status === "INACTIVE" && <HiddenBadge />}
          </span>
        }
        actions={
          <BuildingActions
            building={{
              id: building.id,
              name: building.name,
              address: building.address,
              city: building.city,
              postcode: building.postcode,
              country: building.country,
              description: building.description,
              status: building.status,
            }}
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Flats rented"
          value={`${occupancy.occupied} / ${occupancy.total}`}
          hint={`${pluralize(building._count.floors, "floor")} · ${occupancy.vacant} vacant`}
        />
        <StatCard
          icon={AlertTriangle}
          label="Rent outstanding"
          value={formatMoney(balance.totalOutstanding)}
          hint={
            balance.flatsWithOutstandingRent > 0
              ? `Across ${pluralize(balance.flatsWithOutstandingRent, "flat")}`
              : "Everyone is paid up"
          }
          tone={balance.totalOutstanding > 0 ? "danger" : "default"}
        />
        <StatCard
          icon={Inbox}
          label="Pending requests"
          value={pendingRequests}
          href={`${basePath}?tab=requests`}
        />
        <div className={cn(surface, "flex flex-col gap-1.5 p-4 md:p-5")}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">Access code</p>
            <IconChip icon={KeyRound} />
          </div>
          <div className="flex items-center gap-1">
            <p className="font-mono text-xl font-semibold tracking-widest md:text-2xl">
              {building.accessCode ?? "—"}
            </p>
            {building.accessCode && (
              <CopyButton value={building.accessCode} label="Copy access code" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Give it to tenants you&apos;ve spoken to
          </p>
        </div>
      </div>

      <TabNav
        active={tab}
        hrefFor={(value) => (value === "units" ? basePath : `${basePath}?tab=${value}`)}
        tabs={[
          { value: "units", label: "Floors & flats" },
          {
            value: "requests",
            label: "Requests",
            badge: <CountBadge count={pendingRequests} />,
          },
          { value: "notices", label: "Notices" },
          { value: "activity", label: "Activity" },
        ]}
      />

      {tab === "units" && <BuildingUnits buildingId={id} />}

      {tab === "requests" && (
        <BuildingRequests
          buildingId={id}
          status={status ?? "PENDING"}
          basePath={basePath}
        />
      )}

      {tab === "notices" && <BuildingNotices buildingId={id} />}

      {tab === "activity" && <BuildingActivity buildingId={id} />}
    </>
  );
}

async function BuildingRequests({
  buildingId,
  status,
  basePath,
}: {
  buildingId: string;
  status: string;
  basePath: string;
}) {
  const requests = await getJoinRequests({
    buildingId,
    status: status === "ALL" ? undefined : status,
  });

  return (
    <div className="space-y-4">
      <StatusFilter
        options={REQUEST_FILTERS}
        active={status}
        hrefFor={(value) => `${basePath}?tab=requests&status=${value}`}
      />

      {requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No requests here"
          description="Tenants request flats from “Find a flat” using this building's access code."
        />
      ) : (
        <RequestList requests={requests} showBuilding={false} />
      )}
    </div>
  );
}

async function BuildingActivity({ buildingId }: { buildingId: string }) {
  const logs = await getActivityLogsForBuilding(buildingId);

  return <ActivityLogList logs={logs} />;
}
