import Link from "next/link";

import { getPortfolioReport } from "@/actions/report/get-portfolio-report";
import { OccupancyBar } from "@/components/analytics/occupancy-bar";
import { RevenueTrendChart } from "@/components/analytics/revenue-trend-chart";
import { BuildingPerformanceChart } from "@/components/analytics/building-performance-chart";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export default async function ReportsPage() {
  const report = await getPortfolioReport();

  if (!report) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Unauthorized.</p>
      </div>
    );
  }

  const occupancyRate =
    report.occupancy.total > 0
      ? (report.occupancy.occupied / report.occupancy.total) * 100
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>

        <p className="text-muted-foreground">
          Across every building you own.
        </p>
      </div>

      {report.buildings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Add a building to start seeing reports.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Occupancy</CardTitle>
              </CardHeader>

              <CardContent className="space-y-1">
                <p className="text-2xl font-bold">
                  {occupancyRate.toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {report.occupancy.occupied} occupied ·{" "}
                  {report.occupancy.vacant} vacant ·{" "}
                  {report.occupancy.maintenance} maintenance (
                  {report.occupancy.total} total)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
              </CardHeader>

              <CardContent className="space-y-1">
                <p className="text-2xl font-bold">
                  {formatCurrency(report.revenue.thisMonth)}
                </p>
                <p className="text-sm text-muted-foreground">
                  this month · {formatCurrency(report.revenue.allTime)}{" "}
                  all-time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outstanding</CardTitle>
              </CardHeader>

              <CardContent className="space-y-1">
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(
                    report.outstanding.rent + report.outstanding.utilityBills
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(report.outstanding.rent)} rent ·{" "}
                  {formatCurrency(report.outstanding.utilityBills)} utilities
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Occupancy Breakdown</CardTitle>
            </CardHeader>

            <CardContent>
              <OccupancyBar
                occupied={report.occupancy.occupied}
                vacant={report.occupancy.vacant}
                maintenance={report.occupancy.maintenance}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
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
              <CardTitle>Monthly Rent — Due vs. Collected</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4">Month</th>
                      <th className="py-2 pr-4">Due</th>
                      <th className="py-2 pr-4">Collected</th>
                      <th className="py-2">Collection Rate</th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.monthly.map((month) => (
                      <tr key={month.key} className="border-b last:border-0">
                        <td className="py-2 pr-4">{month.label}</td>
                        <td className="py-2 pr-4">
                          {formatCurrency(month.due)}
                        </td>
                        <td className="py-2 pr-4">
                          {formatCurrency(month.collected)}
                        </td>
                        <td className="py-2">
                          {month.due > 0
                            ? `${((month.collected / month.due) * 100).toFixed(0)}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                &quot;Collected&quot; is all rent + utility payments recorded
                in that calendar month, not only payments toward that
                month&apos;s rent — the two can differ if a tenant catches up
                on a past-due month.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Building Statistics</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4">Building</th>
                      <th className="py-2 pr-4">Flats</th>
                      <th className="py-2 pr-4">Occupancy</th>
                      <th className="py-2 pr-4">Revenue</th>
                      <th className="py-2">Outstanding</th>
                    </tr>
                  </thead>

                  <tbody>
                    {report.buildings.map((building) => (
                      <tr key={building.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          <Link
                            href={`/dashboard/buildings/${building.id}`}
                            className="font-medium hover:underline"
                          >
                            {building.name}
                          </Link>
                        </td>

                        <td className="py-2 pr-4">
                          {building.occupied} / {building.totalFlats}
                        </td>

                        <td className="py-2 pr-4">
                          {building.occupancyRate.toFixed(0)}%
                        </td>

                        <td className="py-2 pr-4">
                          {formatCurrency(building.revenue)}
                        </td>

                        <td className="py-2">
                          {formatCurrency(
                            building.outstandingRent +
                              building.outstandingUtilityBills
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {report.buildings.length > 1 && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Building</CardTitle>
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
                  <CardTitle>Occupancy Rate by Building</CardTitle>
                </CardHeader>

                <CardContent>
                  <BuildingPerformanceChart
                    data={report.buildings.map((building) => ({
                      id: building.id,
                      name: building.name,
                      value: building.occupancyRate,
                    }))}
                    valueLabel={(value) => `${value.toFixed(0)}%`}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
