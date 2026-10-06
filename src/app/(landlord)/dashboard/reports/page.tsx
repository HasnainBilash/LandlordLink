import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  History,
  PieChart,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { getActivityLogsForLandlord } from "@/actions/activity-log/get-activity-logs-for-landlord";
import { getPortfolioReport } from "@/actions/report/get-portfolio-report";
import { getPastDues } from "@/actions/rent/get-past-dues";

import { ActivityLogList } from "@/components/activity-log/activity-log-list";
import { BuildingPerformanceChart } from "@/components/analytics/building-performance-chart";
import { OccupancyBar } from "@/components/analytics/occupancy-bar";
import { ReportDownloads } from "@/components/analytics/report-downloads";
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
import { IconChip } from "@/components/ui/icon-chip";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { StatCard } from "@/components/ui/stat-card";
import { surface } from "@/components/ui/surface";
import { TabNav } from "@/components/ui/tab-nav";
import { formatDate, formatFlatNumber, formatFloor, formatMoney, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

import { InsightsTab } from "./insights-tab";

// Shared styles for the report tables.
const TH = "py-2.5 pr-4 text-xs font-medium tracking-wide uppercase";
const TD = "py-3 pr-4 tabular-nums";
const ROW = "border-b transition-colors last:border-0 hover:bg-muted/40";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

const TABS = ["overview", "insights", "past-dues", "activity"] as const;
type Tab = (typeof TABS)[number];

export default async function ReportsPage({ searchParams }: PageProps) {
  const { tab: tabParam } = await searchParams;
  const tab: Tab = TABS.find((value) => value === tabParam) ?? "overview";

  return (
    <>
      <PageHeader
        title="Reports"
        description="Money, occupancy and history across all of your buildings."
        actions={<ReportDownloads />}
      />

      <TabNav
        active={tab}
        hrefFor={(value) =>
          value === "overview" ? "/dashboard/reports" : `/dashboard/reports?tab=${value}`
        }
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "insights", label: "Insights" },
          { value: "past-dues", label: "Past dues" },
          { value: "activity", label: "Activity" },
        ]}
      />

      {tab === "overview" && <Overview />}
      {tab === "insights" && <InsightsTab />}
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
        icon={BarChart3}
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
          icon={PieChart}
          label="Occupancy"
          value={`${occupancyRate}%`}
          hint={`${report.occupancy.occupied} of ${pluralize(report.occupancy.total, "flat")} rented`}
        />
        <StatCard
          icon={TrendingUp}
          label="Collected this month"
          value={formatMoney(report.revenue.thisMonth)}
          tone="success"
        />
        <StatCard
          icon={Wallet}
          label="Collected all time"
          value={formatMoney(report.revenue.allTime)}
        />
        <StatCard
          icon={AlertTriangle}
          label="Outstanding"
          value={formatMoney(outstanding)}
          hint={`${formatMoney(report.outstanding.rent)} rent · ${formatMoney(report.outstanding.utilityBills)} bills`}
          tone={outstanding > 0 ? "danger" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                  <th className={TH}>Month</th>
                  <th className={cn(TH, "text-right")}>Rent due</th>
                  <th className={cn(TH, "text-right")}>Collected</th>
                  <th className={cn(TH, "pr-0 text-right")}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {report.monthly.map((month) => {
                  const rate =
                    month.due > 0 ? Math.round((month.collected / month.due) * 100) : null;

                  return (
                    <tr key={month.key} className={ROW}>
                      <td className={cn(TD, "font-medium")}>{month.label}</td>
                      <td className={cn(TD, "text-right")}>{formatMoney(month.due)}</td>
                      <td className={cn(TD, "text-right")}>{formatMoney(month.collected)}</td>
                      <td className={cn(TD, "pr-0 text-right")}>
                        {rate === null ? (
                          "—"
                        ) : (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-semibold",
                              rate >= 90
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : rate >= 60
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                  : "bg-red-500/10 text-red-700 dark:text-red-300"
                            )}
                          >
                            {rate}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
                  <th className={TH}>Building</th>
                  <th className={cn(TH, "text-right")}>Rented</th>
                  <th className={cn(TH, "text-right")}>Occupancy</th>
                  <th className={cn(TH, "text-right")}>Collected</th>
                  <th className={cn(TH, "pr-0 text-right")}>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {report.buildings.map((building) => {
                  const buildingOutstanding =
                    building.outstandingRent + building.outstandingUtilityBills;

                  return (
                    <tr key={building.id} className={ROW}>
                      <td className={TD}>
                        <Link
                          href={`/dashboard/buildings/${building.id}`}
                          className="font-medium underline-offset-4 hover:text-primary hover:underline"
                        >
                          {building.name}
                        </Link>
                      </td>
                      <td className={cn(TD, "text-right")}>
                        {building.occupied} / {building.totalFlats}
                      </td>
                      <td className={cn(TD, "text-right")}>
                        {Math.round(building.occupancyRate)}%
                      </td>
                      <td className={cn(TD, "text-right")}>{formatMoney(building.revenue)}</td>
                      <td
                        className={cn(
                          TD,
                          "pr-0 text-right font-medium",
                          buildingOutstanding > 0 && "text-red-600 dark:text-red-400"
                        )}
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
        icon={CheckCircle2}
        title="No past dues"
        description="When a tenant moves out still owing rent or bills, it shows up here so you can record a late payment or write it off."
      />
    );
  }

  const total = pastDues.reduce((sum, lease) => sum + lease.total, 0);

  return (
    <div className="space-y-4">
      <div className={cn(surface, "flex flex-wrap items-center gap-4 p-5")}>
        <IconChip icon={History} tone="warning" size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">
            {pluralize(pastDues.length, "former tenant")}{" "}
            {pastDues.length === 1 ? "still owes" : "still owe"} you
          </p>
          <p className="text-2xl font-semibold tracking-tight text-red-600 tabular-nums dark:text-red-400">
            {formatMoney(total)}
          </p>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Record late payments as they come in, or write off what you won&apos;t
          collect.
        </p>
      </div>

      {pastDues.map((lease) => (
        <Card key={lease.leaseId}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5">
              <InitialsAvatar name={lease.tenantName} size="sm" />
              {lease.tenantName}
            </CardTitle>
            <CardDescription>
              {lease.flat.floor.building.name} · {formatFloor(lease.flat.floor)} · Flat{" "}
              {formatFlatNumber(lease.flat.flatNumber)} · lived there{" "}
              {formatDate(lease.startDate)} –{" "}
              {lease.endDate ? formatDate(lease.endDate) : "?"}
            </CardDescription>
            <CardAction className="flex items-center gap-2">
              <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-sm font-semibold text-red-700 tabular-nums dark:text-red-300">
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
