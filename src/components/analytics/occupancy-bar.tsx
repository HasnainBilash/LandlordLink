import { CHART_COLORS, CHART_INK } from "@/lib/chart-colors";

type OccupancyBarProps = {
  occupied: number;
  vacant: number;
  maintenance: number;
};

const WIDTH = 600;
const HEIGHT = 24;
const GAP = 2;

const SEGMENTS = [
  { key: "occupied", label: "Occupied", color: CHART_COLORS.blue },
  { key: "vacant", label: "Vacant", color: CHART_COLORS.orange },
  { key: "maintenance", label: "Maintenance", color: CHART_COLORS.aqua },
] as const;

export function OccupancyBar({
  occupied,
  vacant,
  maintenance,
}: OccupancyBarProps) {
  const total = occupied + vacant + maintenance;

  if (total === 0) {
    return <p className="text-muted-foreground">No flats yet.</p>;
  }

  const counts = { occupied, vacant, maintenance };

  const rects = SEGMENTS.reduce<
    { key: string; x: number; width: number; color: string }[]
  >((acc, segment) => {
    const count = counts[segment.key];
    const segmentWidth = (count / total) * WIDTH;
    const previous = acc[acc.length - 1];
    const x = previous ? previous.x + previous.width : 0;

    return [...acc, { key: segment.key, x, width: segmentWidth, color: segment.color }];
  }, []);

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label={`${occupied} occupied, ${vacant} vacant, ${maintenance} maintenance, out of ${total} total flats`}
      >
        <clipPath id="occupancy-bar-clip">
          <rect width={WIDTH} height={HEIGHT} rx={4} ry={4} />
        </clipPath>

        <g clipPath="url(#occupancy-bar-clip)">
          {rects.map((rect) => (
            <rect
              key={rect.key}
              x={rect.x}
              y={0}
              width={rect.width}
              height={HEIGHT}
              fill={rect.color}
            />
          ))}

          {rects.slice(1).map((rect) => (
            <rect
              key={`${rect.key}-gap`}
              x={rect.x - GAP / 2}
              y={0}
              width={GAP}
              height={HEIGHT}
              fill={CHART_INK.surface}
            />
          ))}
        </g>
      </svg>

      <div className="flex flex-wrap gap-4 text-sm">
        {SEGMENTS.map((segment) => (
          <div key={segment.key} className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-muted-foreground">
              {segment.label} ({counts[segment.key]})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
