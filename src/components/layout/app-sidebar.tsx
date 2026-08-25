import { getPendingJoinRequestsCount } from "@/actions/join-request/get-pending-join-requests-count";
import { SidebarNav } from "./sidebar-nav";

export async function AppSidebar() {
  const pendingCount = await getPendingJoinRequestsCount();

  return (
    <aside className="w-64 border-r bg-background">
      <div className="border-b p-6">
        <h2 className="text-lg font-bold">
          LandlordLink
        </h2>
      </div>

      <SidebarNav pendingCount={pendingCount} />
    </aside>
  );
}
