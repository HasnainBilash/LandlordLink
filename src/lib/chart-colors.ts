// Categorical slots 1-3 from the validated reference palette (blue, orange,
// aqua) — this order clears every CVD/contrast gate for up to three series.
// The project's own --chart-1..5 tokens are still unthemed grayscale
// placeholders, so charts use these fixed hexes directly instead.
export const CHART_COLORS = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
} as const;

export const CHART_INK = {
  primary: "#0b0b0b",
  secondary: "#52514e",
  muted: "#898781",
  gridline: "#e1e0d9",
  baseline: "#c3c2b7",
  surface: "#fcfcfb",
} as const;
