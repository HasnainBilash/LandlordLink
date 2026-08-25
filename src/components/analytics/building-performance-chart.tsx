import { CHART_COLORS } from "@/lib/chart-colors";

type BuildingPerformanceChartProps = {
  data: { id: string; name: string; value: number }[];
  valueLabel?: (value: number) => string;
};

export function BuildingPerformanceChart({
  data,
  valueLabel = (value) => `$${value.toFixed(2)}`,
}: BuildingPerformanceChartProps) {
  if (data.length === 0) {
    return <p className="text-muted-foreground">No buildings yet.</p>;
  }

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const maxValue = Math.max(...sorted.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {sorted.map((item) => {
        const widthPct = (item.value / maxValue) * 100;

        return (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium">{item.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {valueLabel(item.value)}
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: CHART_COLORS.blue,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
