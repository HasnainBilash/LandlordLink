"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type SidebarNavProps = {
  pendingCount: number;
};

const LINKS = [
  { href: "/dashboard", label: "Dashboard", exact: true },
  { href: "/dashboard/buildings", label: "Buildings", exact: false },
  { href: "/dashboard/requests", label: "Requests", exact: false },
  { href: "/dashboard/activity", label: "Activity", exact: false },
  { href: "/dashboard/reports", label: "Reports", exact: false },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ pendingCount }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 p-4">
      {LINKS.map((link) => {
        const active = isActive(pathname, link.href, link.exact);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2",
              active
                ? "bg-muted font-medium"
                : "hover:bg-muted"
            )}
          >
            {link.label}

            {link.href === "/dashboard/requests" && pendingCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
