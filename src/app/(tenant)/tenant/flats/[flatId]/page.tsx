import { notFound } from "next/navigation";

import { getTenantFlatView } from "@/actions/join-request/get-tenant-flat-view";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";
import { BillingTable, type BillingRow } from "@/components/billing/billing-table";
import { TenantRequestHistoryList } from "@/components/join-request/tenant-request-history-list";
import { MONTH_NAMES } from "@/lib/rent";
import { UTILITY_TYPE_LABELS } from "@/lib/utility-bill";
import { computePaymentStatus } from "@/lib/payment-status";

type PageProps = {
  params: Promise<{
    flatId: string;
  }>;
};

const flatStatusVariant = {
  VACANT: "outline",
  OCCUPIED: "default",
  MAINTENANCE: "secondary",
} as const;

export default async function TenantFlatDetailsPage({ params }: PageProps) {
  const { flatId } = await params;

  const result = await getTenantFlatView(flatId);

  if (!result) {
    notFound();
  }

  const { flat, myRequests, activeLease, rents, utilityBills } = result;

  const floorLabel = flat.floor.name || `Floor ${flat.floor.floorNumber}`;

  const now = new Date();

  const rentRows: BillingRow[] = rents.map((rent) => ({
    id: rent.id,
    label: `${MONTH_NAMES[rent.month - 1]} ${rent.year}`,
    amount: Number(rent.amount),
    paidTotal: rent.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    ),
    dueDate: rent.dueDate,
    status: rent.status,
    target: { type: "RENT", id: rent.id },
  }));

  const utilityBillRows: BillingRow[] = utilityBills.map((bill) => {
    const paidTotal = bill.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    return {
      id: bill.id,
      label: `${UTILITY_TYPE_LABELS[bill.type]} — ${
        MONTH_NAMES[bill.month - 1]
      } ${bill.year}`,
      amount: Number(bill.amount),
      paidTotal,
      dueDate: bill.dueDate,
      status: computePaymentStatus({
        amount: Number(bill.amount),
        paidTotal,
        dueDate: bill.dueDate,
        now,
      }),
      target: { type: "UTILITY_BILL", id: bill.id },
    };
  });

  return (
    <div className="space-y-6">
      <BackLink href="/tenant/requests" label="My Requests" />

      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">Flat {flat.flatNumber}</h1>
        <Badge variant={flatStatusVariant[flat.status]}>{flat.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Building</p>
            <p className="font-semibold">{flat.floor.building.name}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-semibold">
              {flat.floor.building.address}, {flat.floor.building.city}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Floor</p>
            <p className="font-semibold">{floorLabel}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              {activeLease ? "Your Rent" : "Listed Rent"}
            </p>
            <p className="font-semibold">
              $
              {Number(
                activeLease ? activeLease.monthlyRent : flat.monthlyRent
              ).toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Bedrooms</p>
            <p className="font-semibold">{flat.bedrooms}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Bathrooms</p>
            <p className="font-semibold">{flat.bathrooms}</p>
          </div>
        </CardContent>
      </Card>

      {activeLease && (
        <Card>
          <CardHeader>
            <CardTitle>Your Lease</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="font-semibold">
                  {new Date(activeLease.startDate).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="font-semibold">
                  ${Number(activeLease.monthlyRent).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Deposit</p>
                <p className="font-semibold">
                  {activeLease.deposit
                    ? `$${Number(activeLease.deposit).toFixed(2)}`
                    : "—"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Rent History</p>
              <BillingTable rows={rentRows} />
            </div>
          </CardContent>
        </Card>
      )}

      {activeLease && (
        <Card>
          <CardHeader>
            <CardTitle>Utility Bills</CardTitle>
          </CardHeader>

          <CardContent>
            <BillingTable
              rows={utilityBillRows}
              emptyMessage="No utility bills recorded yet."
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Request History</CardTitle>
        </CardHeader>

        <CardContent>
          <TenantRequestHistoryList requests={myRequests} />
        </CardContent>
      </Card>
    </div>
  );
}