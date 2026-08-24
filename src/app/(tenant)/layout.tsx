import { ReactNode } from "react";
import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";

type TenantLayoutProps = {
  children: ReactNode;
};

export default function TenantLayout({ children }: TenantLayoutProps) {
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
      </nav>

      <main className="mx-auto max-w-2xl p-8">{children}</main>
    </div>
  );
}
