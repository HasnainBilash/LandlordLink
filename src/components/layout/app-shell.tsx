import type { ReactNode } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { auth } from "@/auth";

import { MobileNav } from "./mobile-nav";
import type { NavItem } from "./nav-types";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

type AppShellProps = {
  nav: NavItem[];
  homeHref: string;
  children: ReactNode;
};

function Brand({ href }: { href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold">
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Building2 className="size-4" />
      </span>
      LandlordLink
    </Link>
  );
}

// Shared layout for landlords and tenants: sidebar on desktop, a slide-out
// menu on phones, and the account menu in the header.
export async function AppShell({ nav, homeHref, children }: AppShellProps) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-muted/30 md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center border-b px-5">
          <Brand href={homeHref} />
        </div>

        <SidebarNav items={nav} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur md:px-8">
          <MobileNav items={nav} />

          <div className="md:hidden">
            <Brand href={homeHref} />
          </div>

          <div className="ml-auto">
            <UserMenu
              name={session?.user?.name ?? "User"}
              email={session?.user?.email ?? ""}
              role={session?.user?.role ?? ""}
            />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
