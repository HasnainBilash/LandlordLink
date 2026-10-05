import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { auth } from "@/auth";
import { getNeedsAttention } from "@/actions/report/get-needs-attention";
import { getPortfolioReport } from "@/actions/report/get-portfolio-report";

import { AddBuildingButton } from "@/components/building/add-building-button";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { formatFlatNumber, formatMoney, pluralize } from "@/lib/format";

export default async function DashboardPage() {
  const [session, attention, report] = await Promise.all([
    auth(),
    getNeedsAttention(),
    getPortfolioReport(),
  ]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  if (!report || report.buildings.length === 0) {
    return (
      <>
        <PageHeader
          title={`Welcome, ${firstName}`}
          description="Let's get your first building set up."
        />

        <EmptyState
          title="Add your first building"
          description="Add a building, then create its floors and flats in one go with Quick setup. Share the building's access code with tenants so they can request a flat."
          action={<AddBuildingButton />}
        />
      </>
    );
  }

  const occupancyRate =
    report.occupancy.total > 0
      ? Math.round((report.occupancy.occupied / report.occupancy.total) * 100)
      : 0;

  const outstanding = report.outstanding.rent + report.outstanding.utilityBills;

  const attentionItems = [
    ...(attention.pendingRequests > 0
      ? [
          {
            key: "requests",
            href: "/dashboard/requests",
            title: `${pluralize(attention.pendingRequests, "join request")} waiting for you`,
            detail: "Approve or reject tenants who want to rent a flat.",
            amount: null,
          },
        ]
      : []),
    ...attention.overdueFlats.map((flat) => ({
      key: flat.flatId,
      href: `/dashboard/flats/${flat.flatId}`,
      title: `${flat.tenantName} is behind on rent`,
      detail: `Flat ${formatFlatNumber(flat.flatNumber)} · ${flat.buildingName}`,
      amount: flat.amount,
    })),
    ...(attention.pastDues.tenants > 0
      ? [
          {
            key: "past-dues",
            href: "/dashboard/reports?tab=past-dues",
            title: `${pluralize(attention.pastDues.tenants, "former tenant")} still owe${
              attention.pastDues.tenants === 1 ? "s" : ""
            } you`,
            detail: "Record late payments or write the balance off.",
            amount: attention.pastDues.amount,
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's how your buildings are doing."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Occupancy"
          value={`${occupancyRate}%`}
          hint={`${report.occupancy.occupied} of ${pluralize(report.occupancy.total, "flat")} rented`}
        />
        <StatCard
          label="Collected this month"
          value={formatMoney(report.revenue.thisMonth)}
          hint={`${formatMoney(report.revenue.allTime)} all time`}
          tone="success"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(outstanding)}
          hint="Rent and bills still unpaid"
          tone={outstanding > 0 ? "danger" : "default"}
          href="/dashboard/reports"
        />
        <StatCard
          label="Requests"
          value={attention.pendingRequests}
          hint="Waiting for a decision"
          href="/dashboard/requests"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Needs attention</CardTitle>
        </CardHeader>

        <CardContent>
          {attentionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up — no pending requests or late rent.
            </p>
          ) : (
            <ul className="divide-y">
              {attentionItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>

                    {item.amount !== null && (
                      <span className="shrink-0 font-semibold text-destructive">
                        {formatMoney(item.amount)}
                      </span>
                    )}

                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your buildings</CardTitle>
          <CardAction>
            <Link
              href="/dashboard/buildings"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              See all
            </Link>
          </CardAction>
        </CardHeader>

        <CardContent>
          <ul className="divide-y">
            {report.buildings.map((building) => (
              <li key={building.id}>
                <Link
                  href={`/dashboard/buildings/${building.id}`}
                  className="-mx-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{building.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {building.occupied} of {pluralize(building.totalFlats, "flat")} rented
                    </p>
                  </div>

                  <div className="w-32">
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${building.occupancyRate}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-muted-foreground">
                      {Math.round(building.occupancyRate)}% occupied
                    </p>
                  </div>

                  {building.outstandingRent + building.outstandingUtilityBills > 0 && (
                    <span className="text-sm font-medium text-destructive">
                      {formatMoney(
                        building.outstandingRent + building.outstandingUtilityBills
                      )}{" "}
                      due
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
