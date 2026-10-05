// The raised panel look shared by cards, lists and tiles: white in light
// mode, a lighter navy in dark mode, with a hairline ring. Combine it with
// cn() so a caller can still override e.g. the radius.
export const surface =
  "rounded-2xl bg-card shadow-xs ring-1 ring-foreground/[0.07] dark:ring-white/[0.08]";

// Extra classes for a surface that is a link: lifts slightly on hover.
export const surfaceLink =
  "transition hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30";
