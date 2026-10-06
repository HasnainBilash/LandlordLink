import type { ReactNode } from "react";

import { auth } from "@/auth";
import { isDemoEmail } from "@/lib/demo";

import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

import { DemoBanner } from "./demo-banner";
import { MobileNav } from "./mobile-nav";
import type { NavItem } from "./nav-types";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

type AppShellProps = {
  nav: NavItem[];
  homeHref: string;
  // Show the AI assistant (landlords only).
  assistant?: boolean;
  children: ReactNode;
};

// Shared layout for landlords and tenants: sidebar on desktop, a slide-out
// menu on phones, and the theme switch + account menu in the header.
export async function AppShell({ nav, homeHref, assistant = false, children }: AppShellProps) {
  const session = await auth();
  const isDemo = isDemoEmail(session?.user?.email);

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-16 items-center px-5">
          <Logo href={homeHref} />
        </div>

        <SidebarNav items={nav} />

        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-accent/60 p-4 text-xs text-accent-foreground">
            <p className="font-semibold">Tip</p>
            <p className="mt-1 opacity-80">
              {homeHref === "/dashboard"
                ? "Share a building's access code with tenants so they can request a flat."
                : "Ask your landlord for the building's access code to request a flat."}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {isDemo && <DemoBanner />}

        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/70 bg-background/80 px-4 backdrop-blur-md md:px-8">
          <MobileNav items={nav} />

          <div className="md:hidden">
            <Logo href={homeHref} />
          </div>

          <div className="ml-auto flex items-center gap-1">
            {assistant && <AssistantPanel />}
            <ThemeToggle />
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
