// Runs in <head> before the page paints, so there is no flash of the wrong
// theme. Uses the saved choice (see ThemeToggle), else the device setting.
// Kept out of the client component file: exports of "use client" modules
// reach server components as references, not values.
export const themeInitScript = `
try {
  var saved = localStorage.getItem("theme");
  var dark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (dark) document.documentElement.classList.add("dark");
} catch (e) {}
`;
