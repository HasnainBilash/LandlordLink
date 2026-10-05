"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Inbox,
  LayoutDashboard,
  Search,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { NavIcon, NavItem } from "./nav-types";

const ICONS: Record<NavIcon, LucideIcon> = {
  home: LayoutDashboard,
  buildings: Building2,
  requests: Inbox,
  reports: BarChart3,
  search: Search,
  profile: UserRound,
};

type SidebarNavProps = {
  items: NavItem[];
  onNavigate?: () => void;
};

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {items.map((item) => {
        const active = isActive(pathname, item);
        const Icon = ICONS[item.icon];

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-muted hover:text-sidebar-foreground"
            )}
          >
            <Icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "opacity-80")} />
            <span className="flex-1">{item.label}</span>
            {item.badge}
          </Link>
        );
      })}
    </nav>
  );
}
