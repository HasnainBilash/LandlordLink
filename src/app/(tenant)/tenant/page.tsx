import Link from "next/link";

import { getMyCurrentFlats } from "@/actions/join-request/get-my-current-flats";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function TenantDashboardPage() {
  const currentFlats = await getMyCurrentFlats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <p className="text-muted-foreground">
          Welcome to LandLordLink.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Current Flat</CardTitle>
        </CardHeader>

        <CardContent>
          {currentFlats.length === 0 ? (
            <div className="space-y-3">
              <p className="text-muted-foreground">
                You don&apos;t have an approved flat yet.
              </p>

              <Link href="/tenant/buildings">
                <Button size="sm">Find a Flat</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {currentFlats.map((request) => {
                const floorLabel =
                  request.flat.floor.name ||
                  `Floor ${request.flat.floor.floorNumber}`;

                const activeLease = request.flat.leases[0];

                const monthlyRent = activeLease
                  ? activeLease.monthlyRent
                  : request.flat.monthlyRent;

                return (
                  <Link
                    key={request.id}
                    href={`/tenant/flats/${request.flatId}`}
                    className="block rounded-lg border p-4 transition-shadow hover:shadow-md"
                  >
                    <p className="font-semibold">{request.building.name}</p>

                    <p className="text-sm text-muted-foreground">
                      {floorLabel} · Flat {request.flat.flatNumber} · $
                      {Number(monthlyRent).toFixed(2)}/mo
                    </p>

                    {activeLease && (
                      <p className="text-xs text-muted-foreground">
                        Lease started{" "}
                        {new Date(activeLease.startDate).toLocaleDateString()}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
