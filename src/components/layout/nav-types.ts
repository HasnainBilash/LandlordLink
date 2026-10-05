import type { ReactNode } from "react";

// Icons are referenced by name because nav items are built on the server
// and handed to client components, which can't receive functions.
export type NavIcon =
  | "home"
  | "buildings"
  | "requests"
  | "reports"
  | "search"
  | "profile";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  // Match only this exact path (for "Home" items that prefix every route).
  exact?: boolean;
  badge?: ReactNode;
};
