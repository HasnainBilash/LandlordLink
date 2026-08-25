import Link from "next/link";

import { getNeedsAttention } from "@/actions/report/get-needs-attention";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const { pendingRequests, overdueFlats } = await getNeedsAttention();

  const nothingToDo = pendingRequests === 0 && overdueFlats.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <p className="mt-2 text-muted-foreground">
          Welcome to the Building Management System.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Needs Attention</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {nothingToDo ? (
            <p className="text-muted-foreground">
              You&apos;re all caught up — no pending requests or overdue rent.
            </p>
          ) : (
            <>
              {pendingRequests > 0 && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive">{pendingRequests}</Badge>
                    <span className="text-sm">
                      {pendingRequests === 1
                        ? "join request waiting for a decision"
                        : "join requests waiting for a decision"}
                    </span>
                  </div>

                  <Link href="/dashboard/requests">
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </Link>
                </div>
              )}

              {overdueFlats.map((flat) => (
                <div
                  key={flat.flatId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive">
                      ${flat.amount.toFixed(2)}
                    </Badge>
                    <span className="text-sm">
                      Flat {flat.flatNumber} · {flat.buildingName} has
                      overdue rent
                    </span>
                  </div>

                  <Link
                    href={`/dashboard/buildings/${flat.buildingId}/floors/${flat.floorId}/flats/${flat.flatId}`}
                  >
                    <Button size="sm" variant="outline">
                      View Flat
                    </Button>
                  </Link>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        See <Link href="/dashboard/reports" className="underline">Reports</Link>{" "}
        for occupancy, revenue, and outstanding balances across every
        building.
      </p>
    </div>
  );
}
