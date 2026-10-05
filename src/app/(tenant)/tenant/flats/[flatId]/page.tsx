import { notFound } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  MapPin,
} from "lucide-react";

import { getTenantFlatView } from "@/actions/join-request/get-tenant-flat-view";

import { BillingTable, type BillingRow } from "@/components/billing/billing-table";
import { TenantRequestHistoryList } from "@/components/join-request/tenant-request-history-list";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { computePaymentStatus, sumPayments } from "@/lib/payment-status";
import { formatDate, formatFloor, formatMoney } from "@/lib/format";
import { MONTH_NAMES } from "@/lib/rent";
import { UTILITY_TYPE_LABELS } from "@/lib/utility-bill";

type PageProps = {
  params: Promise<{ flatId: string }>;
};

export default async function TenantFlatPage({ params }: PageProps) {
  const { flatId } = await params;

  const result = await getTenantFlatView(flatId);

  if (!result) {
    notFound();
  }

  const { flat, myRequests, activeLease, rents, utilityBills } = result;
  const building = flat.floor.building;
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

  const owed = [...rentRows, ...utilityBillRows]
    .filter((row) => row.status !== "PAID" && row.status !== "WRITTEN_OFF")
    .reduce((sum, row) => sum + Math.max(row.amount - row.paidTotal, 0), 0);

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: activeLease ? "Home" : "My requests", href: activeLease ? "/tenant" : "/tenant/requests" },
          { label: `Flat ${flat.flatNumber}` },
        ]}
        title={`Flat ${flat.flatNumber} · ${building.name}`}
        description={
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {formatFloor(flat.floor)} · {building.address}, {building.city}
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Banknote}
          label={activeLease ? "Your rent" : "Listed rent"}
          value={formatMoney(activeLease ? activeLease.monthlyRent : flat.monthlyRent)}
          hint="per month"
        />
        {activeLease && (
          <StatCard
            icon={owed > 0 ? AlertTriangle : CheckCircle2}
            label="You owe"
            value={owed > 0 ? formatMoney(owed) : "Nothing"}
            hint={owed > 0 ? "Pay your landlord and they'll record it" : "All paid up"}
            tone={owed > 0 ? "danger" : "success"}
          />
        )}
        {activeLease && (
          <StatCard
            icon={CalendarDays}
            label="Lease since"
            value={formatDate(activeLease.startDate)}
          />
        )}
        <StatCard
          icon={BedDouble}
          label="Size"
          value={`${flat.bedrooms} bed · ${flat.bathrooms} bath`}
        />
      </div>

      {activeLease && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Rent</CardTitle>
            </CardHeader>
            <CardContent>
              <BillingTable rows={rentRows} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Utility bills</CardTitle>
            </CardHeader>
            <CardContent>
              <BillingTable
                rows={utilityBillRows}
                emptyMessage="No utility bills yet."
              />
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your requests for this flat</CardTitle>
        </CardHeader>
        <CardContent>
          <TenantRequestHistoryList requests={myRequests} />
        </CardContent>
      </Card>
    </>
  );
}
