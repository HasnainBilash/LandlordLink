import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";

import { auth } from "@/auth";
import { getTenantHome } from "@/actions/tenant/get-tenant-home";

import { PageHeader } from "@/components/layout/page-header";
import { TenantNoticeList } from "@/components/notice/tenant-notice-list";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatFloor, formatMoney, pluralize } from "@/lib/format";

export default async function TenantHomePage() {
  const [session, home] = await Promise.all([auth(), getTenantHome()]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  if (!home) return null;

  return (
    <>
      <PageHeader
        title={`Hi, ${firstName}`}
        description={
          home.homes.length > 0
            ? "Your home, rent and building news in one place."
            : "Let's find you a flat."
        }
      />

      {home.homes.length === 0 ? (
        <EmptyState
          title="You don't have a flat yet"
          description="Talk to a landlord, get their building's access code, and request a flat. Once they approve, your rent and notices show up here."
          action={<ButtonLink href="/tenant/buildings">Find a flat</ButtonLink>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {home.homes.map((lease) => {
            const building = lease.flat.floor.building;

            return (
              <Link
                key={lease.leaseId}
                href={`/tenant/flats/${lease.flat.id}`}
                className="group flex flex-col gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold">
                      Flat {lease.flat.flatNumber} · {building.name}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {formatFloor(lease.flat.floor)} · {building.address}, {building.city}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Rent</p>
                    <p className="font-semibold">{formatMoney(lease.monthlyRent)}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">You owe</p>
                    <p
                      className={
                        lease.owed > 0
                          ? "font-semibold text-destructive"
                          : "font-semibold text-emerald-600 dark:text-emerald-400"
                      }
                    >
                      {lease.owed > 0 ? formatMoney(lease.owed) : "Nothing — all paid"}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Lease since {formatDate(lease.startDate)} · tap to see rent and bills
                </p>
              </Link>
            );
          })}
        </div>
      )}

      {home.homes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <TenantNoticeList notices={home.notices} />
          </CardContent>
        </Card>
      )}

      {home.pendingRequests > 0 && (
        <Link
          href="/tenant/requests"
          className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-ring"
        >
          <span className="text-sm">
            You have {pluralize(home.pendingRequests, "request")} waiting for a
            landlord&apos;s answer.
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      )}
    </>
  );
}
