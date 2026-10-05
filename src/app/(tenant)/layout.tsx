import { ReactNode, Suspense } from "react";

import { auth } from "@/auth";
import { countUnreadNotices } from "@/lib/nav-counts";

import { AppShell } from "@/components/layout/app-shell";
import { CountBadge } from "@/components/ui/count-badge";

async function UnreadNoticesBadge() {
  const session = await auth();

  if (!session?.user?.id) return null;

  return <CountBadge count={await countUnreadNotices(session.user.id)} />;
}

type TenantLayoutProps = {
  children: ReactNode;
};

export default function TenantLayout({ children }: TenantLayoutProps) {
  return (
    <AppShell
      homeHref="/tenant"
      nav={[
        {
          href: "/tenant",
          label: "Home",
          icon: "home",
          exact: true,
          // Unread notices are shown on Home. Streams in after the page
          // renders instead of blocking it.
          badge: (
            <Suspense fallback={null}>
              <UnreadNoticesBadge />
            </Suspense>
          ),
        },
        { href: "/tenant/buildings", label: "Find a flat", icon: "search" },
        { href: "/tenant/requests", label: "My requests", icon: "requests" },
        { href: "/tenant/profile", label: "Profile", icon: "profile" },
      ]}
    >
      {children}
    </AppShell>
  );
}
