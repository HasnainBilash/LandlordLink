import { ReactNode, Suspense } from "react";

import { auth } from "@/auth";
import { countPendingRequests } from "@/lib/nav-counts";

import { AppShell } from "@/components/layout/app-shell";
import { CountBadge } from "@/components/ui/count-badge";

async function PendingRequestsBadge() {
  const session = await auth();

  if (!session?.user?.id) return null;

  return <CountBadge count={await countPendingRequests(session.user.id)} />;
}

type LandlordLayoutProps = {
  children: ReactNode;
};

export default function LandlordLayout({ children }: LandlordLayoutProps) {
  return (
    <AppShell
      homeHref="/dashboard"
      nav={[
        { href: "/dashboard", label: "Home", icon: "home", exact: true },
        { href: "/dashboard/buildings", label: "Buildings", icon: "buildings" },
        {
          href: "/dashboard/requests",
          label: "Requests",
          icon: "requests",
          // Streams in after the page renders instead of blocking it.
          badge: (
            <Suspense fallback={null}>
              <PendingRequestsBadge />
            </Suspense>
          ),
        },
        { href: "/dashboard/reports", label: "Reports", icon: "reports" },
      ]}
    >
      {children}
    </AppShell>
  );
}
