import Link from "next/link";

import { getActivityLogsForLandlord } from "@/actions/activity-log/get-activity-logs-for-landlord";
import { getPortfolioReport } from "@/actions/report/get-portfolio-report";
import { getPastDues } from "@/actions/rent/get-past-dues";

import { ActivityLogList } from "@/components/activity-log/activity-log-list";
import { BuildingPerformanceChart } from "@/components/analytics/building-performance-chart";
import { OccupancyBar } from "@/components/analytics/occupancy-bar";
import { RevenueTrendChart } from "@/components/analytics/revenue-trend-chart";
import { BillingTable } from "@/components/billing/billing-table";
import { WriteOffButton } from "@/components/billing/write-off-button";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { TabNav } from "@/components/ui/tab-nav";
import { formatDate, formatFlatNumber, formatFloor, formatMoney, pluralize } from "@/lib/format";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

const TABS = ["overview", "past-dues", "activity"] as const;
type Tab = (typeof TABS)[number];

export default async function ReportsPage({ searchParams }: PageProps) {
  const { tab: tabParam } = await searchParams;
  const tab: Tab = TABS.find((value) => value === tabParam) ?? "overview";

  return (
    <>
      <PageHeader
        title="Reports"
        description="Money, occupancy and history across all of your buildings."
      />

      <TabNav
        active={tab}
        hrefFor={(value) =>
          value === "overview" ? "/dashboard/reports" : `/dashboard/reports?tab=${value}`
        }
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "past-dues", label: "Past dues" },
          { value: "activity", label: "Activity" },
        ]}
      />

      {tab === "overview" && <Overview />}
      {tab === "past-dues" && <PastDues />}
      {tab === "activity" && <Activity />}
    </>
  );
}

async function Overview() {
  const report = await getPortfolioReport();

  if (!report || report.buildings.length === 0) {
    return (
      <EmptyState
        title="Nothing to report yet"
        description="Add a building and some tenants, and their rent and occupancy will show up here."
      />
    );
  }

  const occupancyRate =
    report.occupancy.total > 0
      ? Math.round((report.occupancy.occupied / report.occupancy.total) * 100)
      : 0;

  const outstanding = report.outstanding.rent + report.outstanding.utilityBills;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Occupancy"
          value={`${occupancyRate}%`}
          hint={`${report.occupancy.occupied} of ${pluralize(report.occupancy.total, "flat")} rented`}
        />
        <StatCard
          label="Collected this month"
          value={formatMoney(report.revenue.thisMonth)}
          tone="success"
        />
        <StatCard label="Collected all time" value={formatMoney(report.revenue.allTime)} />
        <StatCard
          label="Outstanding"
          value={formatMoney(outstanding)}
          hint={`${formatMoney(report.outstanding.rent)} rent · ${formatMoney(report.outstanding.utilityBills)} bills`}
          tone={outstanding > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Money collected per month</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueTrendChart
              data={report.monthly.map((month) => ({
                label: month.label,
                value: month.collected,
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flats</CardTitle>
          </CardHeader>
          <CardContent>
            <OccupancyBar
              occupied={report.occupancy.occupied}
              vacant={report.occupancy.vacant}
              maintenance={report.occupancy.maintenance}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rent due vs. collected</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Month</th>
                  <th className="py-2 pr-4 text-right font-medium">Rent due</th>
                  <th className="py-2 pr-4 text-right font-medium">Collected</th>
                  <th className="py-2 text-right font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {report.monthly.map((month) => (
                  <tr key={month.key} className="border-b last:border-0">
                    <td className="py-2 pr-4">{month.label}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatMoney(month.due)}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {formatMoney(month.collected)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {month.due > 0
                        ? `${Math.round((month.collected / month.due) * 100)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            &ldquo;Collected&rdquo; counts every rent and bill payment recorded in
            that month — including catch-up payments for earlier months — so it
            can be higher than the rent due.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By building</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Building</th>
                  <th className="py-2 pr-4 text-right font-medium">Rented</th>
                  <th className="py-2 pr-4 text-right font-medium">Occupancy</th>
                  <th className="py-2 pr-4 text-right font-medium">Collected</th>
                  <th className="py-2 text-right font-medium">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {report.buildings.map((building) => {
                  const buildingOutstanding =
                    building.outstandingRent + building.outstandingUtilityBills;

                  return (
                    <tr key={building.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <Link
                          href={`/dashboard/buildings/${building.id}`}
                          className="font-medium hover:underline"
                        >
                          {building.name}
                        </Link>
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {building.occupied} / {building.totalFlats}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {Math.round(building.occupancyRate)}%
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">
                        {formatMoney(building.revenue)}
                      </td>
                      <td
                        className={`py-2 text-right tabular-nums ${
                          buildingOutstanding > 0 ? "text-destructive" : ""
                        }`}
                      >
                        {formatMoney(buildingOutstanding)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {report.buildings.length > 1 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Collected by building</CardTitle>
            </CardHeader>
            <CardContent>
              <BuildingPerformanceChart
                data={report.buildings.map((building) => ({
                  id: building.id,
                  name: building.name,
                  value: building.revenue,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Occupancy by building</CardTitle>
            </CardHeader>
            <CardContent>
              <BuildingPerformanceChart
                data={report.buildings.map((building) => ({
                  id: building.id,
                  name: building.name,
                  value: building.occupancyRate,
                }))}
                valueLabel={(value) => `${Math.round(value)}%`}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

async function PastDues() {
  const pastDues = await getPastDues();

  if (pastDues.length === 0) {
    return (
      <EmptyState
        title="No past dues"
        description="When a tenant moves out still owing rent or bills, it shows up here so you can record a late payment or write it off."
      />
    );
  }

  const total = pastDues.reduce((sum, lease) => sum + lease.total, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {pluralize(pastDues.length, "former tenant")} owe{" "}
        <span className="font-semibold text-destructive">{formatMoney(total)}</span>{" "}
        in total.
      </p>

      {pastDues.map((lease) => (
        <Card key={lease.leaseId}>
          <CardHeader>
            <CardTitle>{lease.tenantName}</CardTitle>
            <CardDescription>
              {lease.flat.floor.building.name} · {formatFloor(lease.flat.floor)} · Flat{" "}
              {formatFlatNumber(lease.flat.flatNumber)} · lived there{" "}
              {formatDate(lease.startDate)} –{" "}
              {lease.endDate ? formatDate(lease.endDate) : "?"}
            </CardDescription>
            <CardAction className="flex items-center gap-2">
              <span className="font-semibold text-destructive">
                {formatMoney(lease.total)}
              </span>
              <WriteOffButton
                leaseId={lease.leaseId}
                tenantName={lease.tenantName}
                amount={lease.total}
              />
            </CardAction>
          </CardHeader>

          <CardContent>
            <BillingTable rows={lease.rows} canManage />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function Activity() {
  const logs = await getActivityLogsForLandlord();

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        The latest 200 things that happened in your buildings and account.
      </p>
      <ActivityLogList logs={logs} />
    </div>
  );
}
