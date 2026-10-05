import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ChevronRight,
  History,
  Inbox,
  PieChart,
  Wallet,
} from "lucide-react";

import { auth } from "@/auth";
import { getNeedsAttention } from "@/actions/report/get-needs-attention";
import { getPortfolioReport } from "@/actions/report/get-portfolio-report";

import { AddBuildingButton } from "@/components/building/add-building-button";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconChip } from "@/components/ui/icon-chip";
import { StatCard } from "@/components/ui/stat-card";
import { formatFlatNumber, formatMoney, pluralize } from "@/lib/format";
import { MONTH_NAMES } from "@/lib/rent";

const ATTENTION_STYLES = {
  requests: { icon: Inbox, tone: "primary" },
  overdue: { icon: AlertTriangle, tone: "danger" },
  pastDues: { icon: History, tone: "warning" },
} as const;

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
          icon={Building2}
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

  const thisMonth = report.monthly[report.monthly.length - 1];
  const collectedPct =
    thisMonth && thisMonth.due > 0
      ? Math.min(Math.round((thisMonth.collected / thisMonth.due) * 100), 100)
      : 0;
  // Same calendar (UTC) as the report numbers above.
  const monthName = MONTH_NAMES[new Date().getUTCMonth()];

  const attentionItems = [
    ...(attention.pendingRequests > 0
      ? [
          {
            key: "requests",
            kind: "requests" as const,
            href: "/dashboard/requests",
            title: `${pluralize(attention.pendingRequests, "join request")} waiting for you`,
            detail: "Approve or reject tenants who want to rent a flat.",
            amount: null,
          },
        ]
      : []),
    ...attention.overdueFlats.map((flat) => ({
      key: flat.flatId,
      kind: "overdue" as const,
      href: `/dashboard/flats/${flat.flatId}`,
      title: `${flat.tenantName} is behind on rent`,
      detail: `Flat ${formatFlatNumber(flat.flatNumber)} · ${flat.buildingName}`,
      amount: flat.amount,
    })),
    ...(attention.pastDues.tenants > 0
      ? [
          {
            key: "past-dues",
            kind: "pastDues" as const,
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
      {/* Welcome banner */}
      <section className="bg-brand-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-blue-600/20 md:p-8">
        <div className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-sky-400/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-white/75">Welcome back, {firstName}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                {formatMoney(report.revenue.thisMonth)} collected in {monthName}
              </h1>
            </div>

            {thisMonth && thisMonth.due > 0 && (
              <div className="max-w-md space-y-2">
                <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-2.5 rounded-full bg-white"
                    style={{ width: `${collectedPct}%` }}
                  />
                </div>
                <p className="text-sm text-white/80">
                  {collectedPct}% of {formatMoney(thisMonth.due)} rent due this month
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <ButtonLink
              href="/dashboard/requests"
              className="bg-white text-blue-800 hover:bg-white/90"
            >
              Requests
              {attention.pendingRequests > 0 && (
                <span className="rounded-full bg-blue-700 px-1.5 text-xs text-white">
                  {attention.pendingRequests}
                </span>
              )}
            </ButtonLink>
            <ButtonLink
              href="/dashboard/reports"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              Reports
              <ArrowRight />
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard
          icon={PieChart}
          label="Occupancy"
          value={`${occupancyRate}%`}
          hint={`${report.occupancy.occupied} of ${pluralize(report.occupancy.total, "flat")} rented`}
        />
        <StatCard
          icon={Wallet}
          label="Collected all time"
          value={formatMoney(report.revenue.allTime)}
          hint="Rent and bills received"
          tone="success"
        />
        <StatCard
          icon={AlertTriangle}
          label="Outstanding"
          value={formatMoney(outstanding)}
          hint="Rent and bills still unpaid"
          tone={outstanding > 0 ? "danger" : "default"}
          href="/dashboard/reports"
        />
        <StatCard
          icon={Inbox}
          label="Requests"
          value={attention.pendingRequests}
          hint="Waiting for a decision"
          href="/dashboard/requests"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
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
              <ul className="-my-1 divide-y">
                {attentionItems.map((item) => {
                  const { icon, tone } = ATTENTION_STYLES[item.kind];

                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-muted/60"
                      >
                        <IconChip icon={icon} tone={tone} />

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 font-medium">{item.title}</p>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{item.detail}</p>
                        </div>

                        {item.amount !== null && (
                          <span className="shrink-0 font-semibold text-red-600 tabular-nums dark:text-red-400">
                            {formatMoney(item.amount)}
                          </span>
                        )}

                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  );
                })}
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
                className="text-sm font-medium text-primary hover:underline"
              >
                See all
              </Link>
            </CardAction>
          </CardHeader>

          <CardContent>
            <ul className="-my-1 divide-y">
              {report.buildings.map((building) => {
                const due = building.outstandingRent + building.outstandingUtilityBills;

                return (
                  <li key={building.id}>
                    <Link
                      href={`/dashboard/buildings/${building.id}`}
                      className="-mx-2 block space-y-2 rounded-xl px-2 py-3 transition-colors hover:bg-muted/60"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-medium">{building.name}</p>
                        {due > 0 && (
                          <span className="shrink-0 text-sm font-medium text-red-600 tabular-nums dark:text-red-400">
                            {formatMoney(due)} due
                          </span>
                        )}
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="bg-brand-gradient h-2 rounded-full"
                          style={{ width: `${building.occupancyRate}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {building.occupied} of {pluralize(building.totalFlats, "flat")} rented ·{" "}
                        {Math.round(building.occupancyRate)}% occupied
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
