import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type TabNavItem = {
  value: string;
  label: string;
  badge?: ReactNode;
};

type TabNavProps = {
  tabs: TabNavItem[];
  active: string;
  // Builds the URL for a tab. Tabs are links (not client state) so each
  // tab only loads its own data and can be bookmarked or shared.
  hrefFor: (value: string) => string;
};

export function TabNav({ tabs, active, hrefFor }: TabNavProps) {
  return (
    <nav
      aria-label="Sections"
      className="-mx-4 overflow-x-auto border-b px-4 md:mx-0 md:px-0"
    >
      <ul className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const isActive = tab.value === active;

          return (
            <li key={tab.value}>
              <Link
                href={hrefFor(tab.value)}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.badge}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
