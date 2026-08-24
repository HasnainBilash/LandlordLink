import Link from "next/link";
import { notFound } from "next/navigation";

import { getFlatForRequest } from "@/actions/join-request/get-flat-for-request";
import { getTenantProfile } from "@/actions/tenant-profile/get-tenant-profile";
import { createJoinRequest } from "@/actions/join-request/create-join-request";

import { BackLink } from "@/components/ui/back-link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequestForm } from "@/components/join-request/request-form";
import { ActionResult } from "@/types/action-result";

type PageProps = {
  params: Promise<{
    flatId: string;
  }>;
};

export default async function RequestFlatPage({ params }: PageProps) {
  const { flatId } = await params;

  const flat = await getFlatForRequest(flatId);

  if (!flat) {
    notFound();
  }

  const tenantProfile = await getTenantProfile();

  const floorLabel = flat.floor.name || `Floor ${flat.floor.floorNumber}`;

  async function requestAction(_prevState: ActionResult, formData: FormData) {
    "use server";

    return createJoinRequest(flatId, formData);
  }

  return (
    <div className="space-y-6">
      <BackLink href="/tenant/flats" label="Browse Flats" />

      <div>
        <h1 className="text-3xl font-bold">
          Request Flat {flat.flatNumber}
        </h1>

        <p className="text-muted-foreground">
          {flat.floor.building.name} · {floorLabel} · $
          {Number(flat.monthlyRent).toFixed(2)}/mo
        </p>
      </div>

      {!tenantProfile ? (
        <Card>
          <CardContent className="space-y-4 py-8 text-center">
            <p className="text-muted-foreground">
              Please complete your tenant profile before requesting a flat.
            </p>

            <Link href="/tenant/profile/edit">
              <Button>Complete Profile</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <RequestForm action={requestAction} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
