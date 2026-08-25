import { CHART_COLORS, CHART_INK } from "@/lib/chart-colors";

type RevenueTrendChartProps = {
  data: { label: string; value: number }[];
};

const WIDTH = 600;
const HEIGHT = 220;
const PADDING_LEFT = 8;
const PADDING_RIGHT = 8;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 28;

function roundUpToCleanStep(value: number) {
  if (value <= 0) return 100;

  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;

  let step = 1;
  if (normalized > 5) step = 10;
  else if (normalized > 2) step = 5;
  else if (normalized > 1) step = 2;

  return Math.ceil(value / (step * magnitude)) * step * magnitude;
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const maxValue = roundUpToCleanStep(
    Math.max(...data.map((d) => d.value), 1)
  );

  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const step = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: PADDING_LEFT + i * step,
    y: PADDING_TOP + plotHeight - (d.value / maxValue) * plotHeight,
    ...d,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${
    PADDING_TOP + plotHeight
  } L ${points[0]?.x ?? 0} ${PADDING_TOP + plotHeight} Z`;

  const last = points[points.length - 1];

  const gridlineCount = 3;
  const gridlines = Array.from({ length: gridlineCount + 1 }, (_, i) => {
    const y = PADDING_TOP + (plotHeight / gridlineCount) * i;
    const value = maxValue * (1 - i / gridlineCount);
    return { y, value };
  });

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      height={HEIGHT}
      role="img"
      aria-label={`Revenue by month: ${data
        .map((d) => `${d.label} $${d.value.toFixed(2)}`)
        .join(", ")}`}
    >
      {gridlines.map((line) => (
        <g key={line.y}>
          <line
            x1={PADDING_LEFT}
            x2={WIDTH - PADDING_RIGHT}
            y1={line.y}
            y2={line.y}
            stroke={CHART_INK.gridline}
            strokeWidth={1}
          />
          <text
            x={PADDING_LEFT}
            y={line.y - 4}
            fontSize={10}
            fill={CHART_INK.muted}
          >
            ${Math.round(line.value).toLocaleString()}
          </text>
        </g>
      ))}

      <path
        d={areaPath}
        fill={CHART_COLORS.blue}
        opacity={0.1}
        stroke="none"
      />

      <path
        d={linePath}
        fill="none"
        stroke={CHART_COLORS.blue}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((p, i) => (
        <g key={p.label}>
          <circle
            cx={p.x}
            cy={p.y}
            r={4}
            fill={CHART_COLORS.blue}
            stroke={CHART_INK.surface}
            strokeWidth={2}
          >
            <title>
              {p.label}: ${p.value.toFixed(2)}
            </title>
          </circle>

          <text
            x={p.x}
            y={HEIGHT - 8}
            fontSize={10}
            fill={CHART_INK.muted}
            textAnchor={
              i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"
            }
          >
            {p.label.split(" ")[0]}
          </text>
        </g>
      ))}

      {last && (
        <text
          x={last.x}
          y={last.y - 10}
          fontSize={11}
          fontWeight={600}
          fill={CHART_INK.primary}
          textAnchor="end"
        >
          ${last.value.toFixed(2)}
        </text>
      )}
    </svg>
  );
}
