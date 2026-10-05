import Link from "next/link";
import { ArrowRight, ChevronRight, Inbox, MapPin, Search } from "lucide-react";

import { auth } from "@/auth";
import { getTenantHome } from "@/actions/tenant/get-tenant-home";

import { PageHeader } from "@/components/layout/page-header";
import { TenantNoticeList } from "@/components/notice/tenant-notice-list";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconChip } from "@/components/ui/icon-chip";
import { surface, surfaceLink } from "@/components/ui/surface";
import { formatDate, formatFloor, formatMoney, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function TenantHomePage() {
  const [session, home] = await Promise.all([auth(), getTenantHome()]);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  if (!home) return null;

  const totalOwed = home.homes.reduce((sum, lease) => sum + lease.owed, 0);
  const mainHome = home.homes[0];

  return (
    <>
      {mainHome ? (
        <section className="bg-brand-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-blue-600/20 md:p-8">
          <div className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-sky-400/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-white/75">Hi, {firstName}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
                {totalOwed > 0 ? `You owe ${formatMoney(totalOwed)}` : "You're all paid up"}
              </h1>
              <p className="mt-2 text-sm text-white/80">
                {totalOwed > 0
                  ? "Pay your landlord and they'll record it here."
                  : "Nothing is due right now. Nice work!"}
              </p>
            </div>

            <ButtonLink
              href={`/tenant/flats/${mainHome.flat.id}`}
              className="bg-white text-blue-800 hover:bg-white/90"
            >
              Rent &amp; bills
              <ArrowRight />
            </ButtonLink>
          </div>
        </section>
      ) : (
        <PageHeader title={`Hi, ${firstName}`} description="Let's find you a flat." />
      )}

      {home.homes.length === 0 ? (
        <EmptyState
          icon={Search}
          title="You don't have a flat yet"
          description="Talk to a landlord, get their building's access code, and request a flat. Once they approve, your rent and notices show up here."
          action={<ButtonLink href="/tenant/buildings">Find a flat</ButtonLink>}
        />
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="grid grid-cols-1 gap-4">
            {home.homes.map((lease) => {
              const building = lease.flat.floor.building;

              return (
                <Link
                  key={lease.leaseId}
                  href={`/tenant/flats/${lease.flat.id}`}
                  className={cn(surface, surfaceLink, "group flex flex-col gap-4 p-5")}
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

          <Card>
            <CardHeader>
              <CardTitle>Notices</CardTitle>
            </CardHeader>
            <CardContent>
              <TenantNoticeList notices={home.notices} />
            </CardContent>
          </Card>
        </div>
      )}

      {home.pendingRequests > 0 && (
        <Link
          href="/tenant/requests"
          className={cn(surface, surfaceLink, "flex items-center gap-3 p-4")}
        >
          <IconChip icon={Inbox} tone="warning" />
          <span className="flex-1 text-sm">
            You have {pluralize(home.pendingRequests, "request")} waiting for a
            landlord&apos;s answer.
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      )}
    </>
  );
}
