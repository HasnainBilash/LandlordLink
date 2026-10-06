import { CHART_COLORS, CHART_INK } from "@/lib/chart-colors";

type TrendLineChartProps = {
  data: { label: string; value: number }[];
  format: (value: number) => string;
  // Read out by screen readers before the values.
  title: string;
  // Top of the scale; by default the largest value, rounded up.
  max?: number;
};

const WIDTH = 600;
const HEIGHT = 180;
const PADDING_X = 6;
const PADDING_TOP = 22;
const PADDING_BOTTOM = 24;

function roundUp(value: number) {
  if (value <= 0) return 1;

  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const step = [1, 2, 5, 10].find((candidate) => candidate * magnitude >= value) ?? 10;

  return step * magnitude;
}

// A line over many points (e.g. 90 days), with a few dates along the
// bottom and the latest value at the end of the line.
export function TrendLineChart({ data, format, title, max }: TrendLineChartProps) {
  const top = max ?? roundUp(Math.max(...data.map((point) => point.value), 0));
  const plotWidth = WIDTH - PADDING_X * 2;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const step = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const points = data.map((point, i) => ({
    ...point,
    x: PADDING_X + i * step,
    y: PADDING_TOP + plotHeight - (Math.min(point.value, top) / top) * plotHeight,
  }));

  const line = points.map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const bottom = PADDING_TOP + plotHeight;
  const area = `${line} L ${points.at(-1)?.x ?? 0} ${bottom} L ${points[0]?.x ?? 0} ${bottom} Z`;

  // Four dates along the bottom: first, two in between, last.
  const ticks = [...new Set([0, Math.round((data.length - 1) / 3), Math.round(((data.length - 1) * 2) / 3), data.length - 1])];
  const last = points.at(-1);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      height={HEIGHT}
      role="img"
      aria-label={`${title}: ${data.length > 0 ? `${data[0].label} ${format(data[0].value)} to ${data[data.length - 1].label} ${format(data[data.length - 1].value)}` : "no data"}`}
    >
      {[0, 0.5, 1].map((level) => {
        const y = PADDING_TOP + plotHeight * (1 - level);

        return (
          <g key={level}>
            <line x1={PADDING_X} x2={WIDTH - PADDING_X} y1={y} y2={y} style={{ stroke: CHART_INK.gridline }} strokeWidth={1} />
            {level > 0 && (
              <text x={PADDING_X} y={y - 4} fontSize={10} style={{ fill: CHART_INK.muted }}>
                {format(top * level)}
              </text>
            )}
          </g>
        );
      })}

      <path d={area} style={{ fill: CHART_COLORS.brand }} opacity={0.12} />
      <path
        d={line}
        fill="none"
        style={{ stroke: CHART_COLORS.brand }}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((point) => (
        // Invisible hover targets with the day's value.
        <circle key={point.label} cx={point.x} cy={point.y} r={Math.max(step / 2, 3)} fill="transparent">
          <title>{`${point.label}: ${format(point.value)}`}</title>
        </circle>
      ))}

      {ticks.map((i) => (
        <text
          key={i}
          x={points[i]?.x ?? 0}
          y={HEIGHT - 6}
          fontSize={10}
          textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
          style={{ fill: CHART_INK.muted }}
        >
          {data[i]?.label}
        </text>
      ))}

      {last && (
        <>
          <circle cx={last.x} cy={last.y} r={4} style={{ fill: CHART_COLORS.brand, stroke: CHART_INK.surface }} strokeWidth={2} />
          <text
            x={last.x - 8}
            y={Math.max(last.y - 10, 12)}
            fontSize={11}
            fontWeight={600}
            textAnchor="end"
            style={{ fill: CHART_INK.primary }}
          >
            {format(last.value)}
          </text>
        </>
      )}
    </svg>
  );
}
