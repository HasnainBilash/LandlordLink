import Link from "next/link";

import { getPendingJoinRequestsCount } from "@/actions/join-request/get-pending-join-requests-count";

const disabledLinkClass =
  "flex items-center justify-between rounded-lg px-3 py-2 text-muted-foreground/50 cursor-not-allowed select-none";

export async function AppSidebar() {
  const pendingCount = await getPendingJoinRequestsCount();

  return (
    <aside className="w-64 border-r bg-background">
      <div className="border-b p-6">
        <h2 className="text-xl font-bold">
          BMS
        </h2>
      </div>

      <nav className="flex flex-col gap-2 p-4">

        <Link
          href="/dashboard"
          className="rounded-lg px-3 py-2 hover:bg-muted"
        >
          Dashboard
        </Link>

        <Link
          href="/dashboard/buildings"
          className="rounded-lg px-3 py-2 hover:bg-muted"
        >
          Buildings
        </Link>

        <Link
          href="/dashboard/requests"
          className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted"
        >
          Requests

          {pendingCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
              {pendingCount}
            </span>
          )}
        </Link>

        <Link
          href="/dashboard/activity"
          className="rounded-lg px-3 py-2 hover:bg-muted"
        >
          Activity
        </Link>

        <span className={disabledLinkClass} aria-disabled="true">
          Tenants
          <span className="text-xs">Soon</span>
        </span>

        <span className={disabledLinkClass} aria-disabled="true">
          Payments
          <span className="text-xs">Soon</span>
        </span>

      </nav>
    </aside>
  );
}