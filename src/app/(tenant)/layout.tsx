import { ReactNode } from "react";
import Link from "next/link";

import { getUnreadNoticeCount } from "@/actions/notice/get-unread-notice-count";

import { AppHeader } from "@/components/layout/app-header";

type TenantLayoutProps = {
  children: ReactNode;
};

export default async function TenantLayout({ children }: TenantLayoutProps) {
  const unreadNoticeCount = await getUnreadNoticeCount();

  return (
    <div className="min-h-screen bg-muted/30">
      <AppHeader />

      <nav className="mx-auto flex max-w-2xl gap-4 px-8 pt-6 text-sm text-muted-foreground">
        <Link href="/tenant" className="hover:text-foreground hover:underline">
          Dashboard
        </Link>

        <Link href="/tenant/profile" className="hover:text-foreground hover:underline">
          My Profile
        </Link>

        <Link href="/tenant/buildings" className="hover:text-foreground hover:underline">
          Find a Flat
        </Link>

        <Link href="/tenant/requests" className="hover:text-foreground hover:underline">
          My Requests
        </Link>

        <Link
          href="/tenant/notices"
          className="flex items-center gap-1.5 hover:text-foreground hover:underline"
        >
          Notices
          {unreadNoticeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
              {unreadNoticeCount}
            </span>
          )}
        </Link>
      </nav>

      <main className="mx-auto max-w-2xl p-8">{children}</main>
    </div>
  );
}
