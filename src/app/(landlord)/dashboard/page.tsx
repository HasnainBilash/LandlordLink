import Link from "next/link";

import { getPortfolioReport } from "@/actions/report/get-portfolio-report";
import { OccupancyBar } from "@/components/analytics/occupancy-bar";
import { RevenueTrendChart } from "@/components/analytics/revenue-trend-chart";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const report = await getPortfolioReport();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <p className="mt-2 text-muted-foreground">
          Welcome to the Building Management System.
        </p>
      </div>

      {report && report.buildings.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Occupancy</CardTitle>
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
        </div>
      )}

      {report && report.buildings.length > 0 && (
        <p className="text-sm text-muted-foreground">
          See <Link href="/dashboard/reports" className="underline">Reports</Link>{" "}
          for the full numbers, or{" "}
          <Link href="/dashboard/analytics" className="underline">Analytics</Link>{" "}
          for more charts.
        </p>
      )}
    </div>
  );
}
