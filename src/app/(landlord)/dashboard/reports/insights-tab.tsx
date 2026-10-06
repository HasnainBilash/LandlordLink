import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  DoorOpen,
  LineChart,
  TrendingUp,
} from "lucide-react";

import { getInsights } from "@/actions/report/get-insights";

import { CollectionRateChart } from "@/components/analytics/collection-rate-chart";
import { TrendLineChart } from "@/components/analytics/trend-line-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { FlatStatusBadge, PunctualityBadge } from "@/components/ui/status-badges";
import { formatDate, formatMoney, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

// Same table styles as the other report tabs.
const TH = "py-2.5 pr-4 text-xs font-medium tracking-wide uppercase";
const TD = "py-3 pr-4 tabular-nums";
const ROW = "border-b transition-colors last:border-0 hover:bg-muted/40";

// Due this month → 3+ months overdue: blue, amber, orange, red.
const AGING_COLORS = [
  "var(--chart-2)",
  "var(--chart-4)",
  "color-mix(in oklch, var(--chart-4), var(--chart-5))",
  "var(--chart-5)",
];

function percent(value: number | null) {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

function ordinal(day: number) {
  const teen = day % 100 >= 11 && day % 100 <= 13;
  const suffix = teen ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[day % 10] ?? "th";
  return `${day}${suffix}`;
}

// When a tenant usually has the month's rent paid in full.
function payDayText(day: number | null) {
  if (day === null) return "—";
  if (day <= 28) return `By the ${ordinal(day)}`;
  if (day <= 31) return "At the month's end";
  return "After the month ends";
}

function TrendsComing() {
  return (
    <p className="text-sm text-muted-foreground">
      The daily numbers start with the next nightly update.
    </p>
  );
}

function TenantCell({ tenant, flatId, flat, building }: { tenant: string; flatId: string; flat: string; building: string }) {
  return (
    <td className={cn(TD, "min-w-0")}>
      <Link
        href={`/dashboard/flats/${flatId}`}
        className="font-medium underline-offset-4 hover:text-primary hover:underline"
      >
        {tenant}
      </Link>
      <p className="text-xs text-muted-foreground">
        {building} · {flat}
      </p>
    </td>
  );
}

export async function InsightsTab() {
  const insights = await getInsights();

  if (!insights || (insights.habits.length === 0 && insights.vacancy.emptyFlats.length === 0)) {
    return (
      <EmptyState
        icon={LineChart}
        title="No insights yet"
        description="Once you have flats and tenants, this shows who owes and for how long, who pays late, what empty flats cost you, and the rent to expect."
      />
    );
  }

  const { aging, habits, collection, vacancy, forecast, trends } = insights;
  const vacantFlats = vacancy.emptyFlats.filter((flat) => flat.status === "VACANT").length;

  // The table lists who is behind; those who only owe this month's rent
  // (normal early in the month) are summed up in one line.
  const behind = aging.debtors.filter((debtor) => debtor.buckets.slice(1).some((amount) => amount > 0));
  const thisMonthOnly = aging.debtors.filter((debtor) => !behind.includes(debtor));
  const thisMonthOnlyTotal = thisMonthOnly.reduce((sum, debtor) => sum + debtor.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={formatMoney(aging.overdue)}
          hint="Unpaid from past months"
          tone={aging.overdue > 0 ? "danger" : "default"}
        />
        <StatCard
          icon={TrendingUp}
          label="Rent collected"
          value={percent(forecast.recentRate)}
          hint={
            forecast.basisMonths > 0
              ? `Of rent due, last ${pluralize(forecast.basisMonths, "month")}`
              : "No full month yet"
          }
          tone="success"
        />
        <StatCard
          icon={DoorOpen}
          label="Missed while empty"
          value={formatMoney(Math.round(vacancy.missedLastYear))}
          hint="Rent of empty flats, last 12 months"
          tone={vacancy.missedLastYear > 0 ? "warning" : "default"}
        />
        <StatCard
          icon={CalendarClock}
          label="Expected rent"
          value={formatMoney(Math.round(forecast.total))}
          hint="Next 3 months"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Who owes, and for how long</CardTitle>
          <CardDescription>
            Unpaid rent and bills of your current tenants, by how long they&apos;ve been overdue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {aging.total > 0 ? (
            <>
              <div className="space-y-3">
                <div
                  className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
                  role="img"
                  aria-label={aging.buckets.map((bucket) => `${bucket.label}: ${formatMoney(bucket.amount)}`).join(", ")}
                >
                  {aging.buckets.map((bucket, i) =>
                    bucket.amount > 0 ? (
                      <div
                        key={bucket.label}
                        className="h-full"
                        style={{ width: `${(bucket.amount / aging.total) * 100}%`, backgroundColor: AGING_COLORS[i] }}
                      />
                    ) : null
                  )}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                  {aging.buckets.map((bucket, i) => (
                    <div key={bucket.label} className="flex items-center gap-1.5">
                      <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: AGING_COLORS[i] }} />
                      <span className="text-muted-foreground">{bucket.label}</span>
                      <span className="font-medium tabular-nums">{formatMoney(bucket.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {behind.length > 0 ? (
                <div className="-mx-4 overflow-x-auto px-4">
                  <table className="w-full min-w-[36rem] text-sm" data-testid="insights-debtors">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className={TH}>Tenant</th>
                        <th className={cn(TH, "text-right")}>This month</th>
                        <th className={cn(TH, "text-right")}>1 month</th>
                        <th className={cn(TH, "text-right")}>2 months</th>
                        <th className={cn(TH, "text-right")}>3+ months</th>
                        <th className={cn(TH, "pr-0 text-right")}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {behind.map((debtor) => (
                        <tr key={debtor.leaseId} className={ROW}>
                          <TenantCell {...debtor} />
                          {debtor.buckets.map((amount, i) => (
                            <td
                              key={aging.buckets[i].label}
                              className={cn(TD, "text-right", amount === 0 && "text-muted-foreground", amount > 0 && i > 0 && "text-red-600 dark:text-red-400")}
                            >
                              {amount > 0 ? formatMoney(amount) : "—"}
                            </td>
                          ))}
                          <td className={cn(TD, "pr-0 text-right font-semibold")}>{formatMoney(debtor.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nobody is behind — only this month&apos;s rent is still open.</p>
              )}

              {behind.length > 0 && thisMonthOnly.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {pluralize(thisMonthOnly.length, "more tenant")} {thisMonthOnly.length === 1 ? "owes" : "owe"} only
                  this month&apos;s rent ({formatMoney(thisMonthOnlyTotal)}), which isn&apos;t overdue yet.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Your current tenants owe nothing right now.</p>
          )}

          {aging.formerTenantsOwe > 0 && (
            <p className="text-sm text-muted-foreground">
              Former tenants owe {formatMoney(aging.formerTenantsOwe)} more —{" "}
              <Link href="/dashboard/reports?tab=past-dues" className="font-medium text-primary underline-offset-4 hover:underline">
                see Past dues
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Owed, day by day</CardTitle>
            <CardDescription>
              Unpaid rent and bills (current and former tenants) at the end of each day, last 90 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trends.length >= 2 ? (
              <TrendLineChart
                title="Money owed per day"
                data={trends.map((day) => ({ label: day.label, value: day.owed }))}
                format={(value) => formatMoney(Math.round(value))}
              />
            ) : (
              <TrendsComing />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Occupancy, day by day</CardTitle>
            <CardDescription>Share of your flats with a tenant at the end of each day, last 90 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {trends.length >= 2 ? (
              <TrendLineChart
                title="Occupancy per day"
                data={trends.map((day) => ({ label: day.label, value: day.occupancy }))}
                format={(value) => `${Math.round(value * 100)}%`}
                max={1}
              />
            ) : (
              <TrendsComing />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rent paid, by month</CardTitle>
            <CardDescription>
              How much of each month&apos;s rent has been paid, whenever it came in. This month is still in progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CollectionRateChart data={collection} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>The next 3 months</CardTitle>
            <CardDescription>A simple forecast from your current leases.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {formatMoney(Math.round(forecast.perMonth))}
              <span className="text-base font-normal text-muted-foreground"> a month</span>
            </p>
            <p className="text-muted-foreground">
              Your current leases bring in {formatMoney(forecast.fullRent)} a month.
              {forecast.basisMonths > 0
                ? ` Over the last ${pluralize(forecast.basisMonths, "month")} you collected ${percent(forecast.recentRate)} of the rent due, so expect about this much.`
                : " With no full month of history yet, this assumes all of it is paid."}
            </p>
            {vacantFlats > 0 && forecast.ifAllLet > 0 && (
              <p className="text-muted-foreground">
                Letting your {pluralize(vacantFlats, "vacant flat")} would add up to{" "}
                <span className="font-medium text-foreground">{formatMoney(forecast.ifAllLet)}</span> a month.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment habits</CardTitle>
          <CardDescription>
            Months in the last year each tenant paid in full before the month ended.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {habits.length > 0 ? (
            <div className="-mx-4 overflow-x-auto px-4">
              <table className="w-full min-w-[34rem] text-sm" data-testid="insights-habits">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className={TH}>Tenant</th>
                    <th className={cn(TH, "text-right")}>On time</th>
                    <th className={TH}>Usually pays</th>
                    <th className={cn(TH, "text-right")}>Owes now</th>
                    <th className={cn(TH, "pr-0 text-right")}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {habits.map((habit) => (
                    <tr key={habit.leaseId} className={ROW}>
                      <TenantCell {...habit} />
                      <td className={cn(TD, "text-right")}>
                        {habit.months > 0 ? `${habit.onTime} of ${habit.months}` : "—"}
                      </td>
                      <td className={cn(TD, "text-muted-foreground")}>{payDayText(habit.typicalPayDay)}</td>
                      <td className={cn(TD, "text-right", habit.owes > 0 && "font-medium text-red-600 dark:text-red-400")}>
                        {habit.owes > 0 ? formatMoney(habit.owes) : "—"}
                      </td>
                      <td className={cn(TD, "pr-0 text-right")}>
                        <PunctualityBadge rating={habit.rating} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No current tenants.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empty flats</CardTitle>
          <CardDescription>Flats without a tenant right now, and the rent they&apos;ve missed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {vacancy.emptyFlats.length > 0 ? (
            <div className="-mx-4 overflow-x-auto px-4">
              <table className="w-full min-w-[32rem] text-sm" data-testid="insights-empty-flats">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className={TH}>Flat</th>
                    <th className={TH}>Status</th>
                    <th className={TH}>Empty since</th>
                    <th className={cn(TH, "pr-0 text-right")}>Rent missed</th>
                  </tr>
                </thead>
                <tbody>
                  {vacancy.emptyFlats.map((flat) => (
                    <tr key={flat.flatId} className={ROW}>
                      <td className={TD}>
                        <Link
                          href={`/dashboard/flats/${flat.flatId}`}
                          className="font-medium underline-offset-4 hover:text-primary hover:underline"
                        >
                          {flat.flat}
                        </Link>
                        <p className="text-xs text-muted-foreground">{flat.building}</p>
                      </td>
                      <td className={TD}>
                        <FlatStatusBadge status={flat.status} />
                      </td>
                      <td className={TD}>
                        {formatDate(flat.since)}
                        <p className="text-xs text-muted-foreground">{pluralize(flat.days, "day")}</p>
                      </td>
                      <td className={cn(TD, "pr-0 text-right font-medium")}>
                        {formatMoney(Math.round(flat.missedSoFar))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Every flat has a tenant.</p>
          )}

          <p className="text-sm text-muted-foreground">
            {vacancy.averageReletDays === null
              ? "No flat changed tenants in the last 12 months."
              : `On average a flat stood empty for ${pluralize(Math.round(vacancy.averageReletDays), "day")} between tenants (${pluralize(vacancy.relets, "move-in")} in the last 12 months).`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
