import { Suspense } from "react";

import { getPendingJoinRequestsCount } from "@/actions/join-request/get-pending-join-requests-count";
import { CountBadge } from "@/components/ui/count-badge";
import { SidebarNav } from "./sidebar-nav";

async function PendingRequestsBadge() {
  return <CountBadge count={await getPendingJoinRequestsCount()} />;
}

export function AppSidebar() {
  return (
    <aside className="w-64 border-r bg-background">
      <div className="border-b p-6">
        <h2 className="text-lg font-bold">
          LandlordLink
        </h2>
      </div>

      {/* The badge streams in after the page renders instead of blocking it. */}
      <SidebarNav
        requestsBadge={
          <Suspense fallback={null}>
            <PendingRequestsBadge />
          </Suspense>
        }
      />
    </aside>
  );
}
