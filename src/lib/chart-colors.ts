// Chart colours as theme variables (defined in app/globals.css), so charts
// follow light and dark mode. Apply them through `style` — CSS variables
// don't work inside SVG presentation attributes like fill="...".
//
// Occupancy colours match the status badges: occupied = green,
// vacant = sky blue, maintenance = amber.
export const CHART_COLORS = {
  brand: "var(--chart-1)",
  occupied: "var(--chart-3)",
  vacant: "var(--chart-2)",
  maintenance: "var(--chart-4)",
} as const;

export const CHART_INK = {
  primary: "var(--foreground)",
  muted: "var(--muted-foreground)",
  gridline: "var(--border)",
  surface: "var(--card)",
} as const;
