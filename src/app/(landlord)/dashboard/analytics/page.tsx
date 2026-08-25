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

export default async function AnalyticsPage() {
  const report = await getPortfolioReport();

  if (!report) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Unauthorized.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>

        <p className="text-muted-foreground">
          Visualizing the same numbers as Reports, across every building you
          own.
        </p>
      </div>

      {report.buildings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Add a building to start seeing analytics.
          </CardContent>
        </Card>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
