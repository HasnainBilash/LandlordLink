import { notFound } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  DoorOpen,
  PiggyBank,
  Wrench,
} from "lucide-react";

import { getFlat } from "@/actions/flat/get-flat";
import { getRentsForLease } from "@/actions/rent/get-rents-for-lease";
import { getUtilityBillsForLease } from "@/actions/utility-bill/get-utility-bills-for-lease";

import { BillingTable, type BillingRow } from "@/components/billing/billing-table";
import { FlatActions } from "@/components/flat/flat-actions";
import { EndLeaseButton } from "@/components/join-request/end-lease-button";
import { RequestHistoryList } from "@/components/join-request/request-history-list";
import { PageHeader } from "@/components/layout/page-header";
import { AddUtilityBillButton } from "@/components/utility-bill/add-utility-bill-form";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { StatCard } from "@/components/ui/stat-card";
import { FlatStatusBadge } from "@/components/ui/status-badges";
import { surface } from "@/components/ui/surface";
import { computePaymentStatus, sumPayments } from "@/lib/payment-status";
import { formatDate, formatFloor, formatMoney } from "@/lib/format";
import { MONTH_NAMES } from "@/lib/rent";
import { UTILITY_TYPE_LABELS } from "@/lib/utility-bill";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ flatId: string }>;
};

export default async function FlatPage({ params }: PageProps) {
  const { flatId } = await params;

  const flat = await getFlat(flatId);

  if (!flat) {
    notFound();
  }

  const lease = flat.leases[0];
  const building = flat.floor.building;

  const [rents, utilityBills] = lease
    ? await Promise.all([
        getRentsForLease(lease.id),
        getUtilityBillsForLease(lease.id),
      ])
    : [[], []];

  const now = new Date();

  const rentRows: BillingRow[] = rents.map((rent) => ({
    id: rent.id,
    label: `${MONTH_NAMES[rent.month - 1]} ${rent.year}`,
    amount: Number(rent.amount),
    paidTotal: sumPayments(rent.payments),
    dueDate: rent.dueDate,
    status: rent.status,
    target: { type: "RENT", id: rent.id },
  }));

  const utilityBillRows: BillingRow[] = utilityBills.map((bill) => {
    const paidTotal = sumPayments(bill.payments);

    return {
      id: bill.id,
      label: `${UTILITY_TYPE_LABELS[bill.type]} — ${MONTH_NAMES[bill.month - 1]} ${bill.year}`,
      amount: Number(bill.amount),
      paidTotal,
      dueDate: bill.dueDate,
      status: computePaymentStatus({
        amount: Number(bill.amount),
        paidTotal,
        dueDate: bill.dueDate,
        now,
        writtenOffAt: bill.writtenOffAt,
      }),
      target: { type: "UTILITY_BILL", id: bill.id },
    };
  });

  const balanceDue = [...rentRows, ...utilityBillRows]
    .filter((row) => row.status !== "PAID" && row.status !== "WRITTEN_OFF")
    .reduce((sum, row) => sum + Math.max(row.amount - row.paidTotal, 0), 0);

  // End lease works on the approved request that created the tenancy.
  const approvedRequest = flat.joinRequests.find(
    (request) => request.status === "APPROVED"
  );

  const tenant = lease?.tenant;
  const flatLabel = `flat ${flat.flatNumber}`;

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Buildings", href: "/dashboard/buildings" },
          { label: building.name, href: `/dashboard/buildings/${building.id}` },
          { label: `Flat ${flat.flatNumber}` },
        ]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            Flat {flat.flatNumber}
            <FlatStatusBadge status={flat.status} />
          </span>
        }
        description={`${formatFloor(flat.floor)} · ${flat.bedrooms} bed · ${flat.bathrooms} bath`}
        actions={
          <FlatActions
            buildingId={building.id}
            isLeased={Boolean(lease)}
            flat={{
              id: flat.id,
              flatNumber: flat.flatNumber,
              bedrooms: flat.bedrooms,
              bathrooms: flat.bathrooms,
              monthlyRent: Number(flat.monthlyRent),
              status: flat.status,
            }}
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Banknote}
          label={lease ? "Rent" : "Listed rent"}
          value={formatMoney(lease ? lease.monthlyRent : flat.monthlyRent)}
          hint="per month"
        />
        <StatCard
          icon={balanceDue > 0 ? AlertTriangle : CheckCircle2}
          label="Balance due"
          value={formatMoney(balanceDue)}
          hint={lease ? (balanceDue > 0 ? "Rent and bills unpaid" : "All paid up") : "No current tenant"}
          tone={balanceDue > 0 ? "danger" : lease ? "success" : "default"}
        />
        <StatCard
          icon={CalendarDays}
          label="Lease since"
          value={lease ? formatDate(lease.startDate) : "—"}
        />
        <StatCard
          icon={PiggyBank}
          label="Deposit"
          value={lease?.deposit ? formatMoney(lease.deposit) : "—"}
        />
      </div>

      {tenant ? (
        <Card>
          <CardHeader>
            <CardTitle>Tenant</CardTitle>
            {approvedRequest && (
              <CardAction>
                <EndLeaseButton
                  requestId={approvedRequest.id}
                  tenantName={tenant.user.name}
                />
              </CardAction>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <InitialsAvatar name={tenant.user.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{tenant.user.name}</p>
                <p className="truncate text-sm text-muted-foreground">{tenant.user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
              <Detail label="Occupation" value={tenant.occupation} />
              <Detail label="Emergency contact" value={tenant.emergencyContact} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(surface, "flex items-start gap-4 p-5")}>
          <IconChip
            icon={flat.status === "MAINTENANCE" ? Wrench : DoorOpen}
            tone={flat.status === "MAINTENANCE" ? "warning" : "info"}
            size="lg"
          />
          <div className="space-y-1">
            <p className="font-semibold">
              {flat.status === "MAINTENANCE" ? "Under maintenance" : "No one lives here right now"}
            </p>
            <p className="text-sm text-muted-foreground">
              {flat.status === "MAINTENANCE"
                ? "Set it back to Vacant (Edit) when it's ready to rent."
                : "Tenants can request this flat from “Find a flat” using the building's access code."}
            </p>
          </div>
        </div>
      )}

      {lease && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Rent</CardTitle>
            </CardHeader>
            <CardContent>
              <BillingTable rows={rentRows} canManage />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Utility bills</CardTitle>
              <CardAction>
                <AddUtilityBillButton leaseId={lease.id} />
              </CardAction>
            </CardHeader>
            <CardContent>
              <BillingTable
                rows={utilityBillRows}
                canManage
                emptyMessage="No utility bills yet."
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Requests for this flat</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestHistoryList
            flatLabel={flatLabel}
            defaultMonthlyRent={Number(flat.monthlyRent)}
            requests={flat.joinRequests.map((request) => ({
              id: request.id,
              status: request.status,
              message: request.message,
              createdAt: request.createdAt,
              tenant: {
                user: { name: request.tenant.user.name, email: request.tenant.user.email },
              },
            }))}
          />
        </CardContent>
      </Card>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-medium">{value || "—"}</p>
    </div>
  );
}
