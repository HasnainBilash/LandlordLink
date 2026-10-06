import { CHART_COLORS, CHART_INK } from "@/lib/chart-colors";
import { formatMoney } from "@/lib/format";

type CollectionRateChartProps = {
  data: { label: string; due: number; collected: number; rate: number | null; isCurrent: boolean }[];
};

const WIDTH = 600;
const HEIGHT = 200;
const PADDING_TOP = 22;
const PADDING_BOTTOM = 26;
const BAR_GAP = 0.3; // share of each slot left empty

// One bar per rent month: how much of that month's rent has been paid.
// The current month is lighter — it isn't over yet.
export function CollectionRateChart({ data }: CollectionRateChartProps) {
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const slot = WIDTH / Math.max(data.length, 1);
  const barWidth = slot * (1 - BAR_GAP);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      height={HEIGHT}
      role="img"
      aria-label={`Share of each month's rent paid: ${data
        .map((month) => `${month.label} ${month.rate === null ? "no rent due" : `${Math.round(month.rate * 100)}%`}`)
        .join(", ")}`}
    >
      {[0, 0.5, 1].map((level) => {
        const y = PADDING_TOP + plotHeight * (1 - level);

        return (
          <g key={level}>
            <line x1={0} x2={WIDTH} y1={y} y2={y} style={{ stroke: CHART_INK.gridline }} strokeWidth={1} />
            {level > 0 && (
              <text x={2} y={y - 4} fontSize={10} style={{ fill: CHART_INK.muted }}>
                {level * 100}%
              </text>
            )}
          </g>
        );
      })}

      {data.map((month, i) => {
        const rate = Math.min(month.rate ?? 0, 1);
        const height = plotHeight * rate;
        const x = i * slot + (slot - barWidth) / 2;
        const y = PADDING_TOP + plotHeight - height;
        const percent = month.rate === null ? "—" : `${Math.round(month.rate * 100)}%`;

        return (
          <g key={month.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(height, 0)}
              rx={3}
              style={{ fill: CHART_COLORS.brand }}
              opacity={month.isCurrent ? 0.4 : 0.9}
            >
              <title>
                {month.rate === null
                  ? `${month.label}: no rent due`
                  : `${month.label}${month.isCurrent ? " (so far)" : ""}: ${formatMoney(month.collected)} of ${formatMoney(month.due)} paid`}
              </title>
            </rect>

            <text
              x={x + barWidth / 2}
              y={Math.max(y - 5, 10)}
              fontSize={10}
              fontWeight={600}
              textAnchor="middle"
              style={{ fill: CHART_INK.primary }}
            >
              {percent}
            </text>

            <text
              x={x + barWidth / 2}
              y={HEIGHT - 8}
              fontSize={10}
              textAnchor="middle"
              style={{ fill: CHART_INK.muted }}
            >
              {month.label.slice(0, 3)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
