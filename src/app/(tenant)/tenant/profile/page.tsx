import Link from "next/link";

import { getTenantProfile } from "@/actions/tenant-profile/get-tenant-profile";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TenantProfilePage() {
  const profile = await getTenantProfile();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>

          <p className="text-muted-foreground">
            Your tenant information on file.
          </p>
        </div>

        <Link href="/tenant/profile/edit">
          <Button>
            {profile ? "Edit Profile" : "Complete Profile"}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!profile ? (
            <p className="text-muted-foreground">
              You haven&apos;t filled in your profile yet.
            </p>
          ) : (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Occupation</p>
                <p className="font-semibold">
                  {profile.occupation || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">National ID</p>
                <p className="font-semibold">
                  {profile.nationalId || "—"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Emergency Contact
                </p>
                <p className="font-semibold">
                  {profile.emergencyContact || "—"}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
