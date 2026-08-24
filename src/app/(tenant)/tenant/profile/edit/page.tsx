import { getTenantProfile } from "@/actions/tenant-profile/get-tenant-profile";
import { TenantProfileForm } from "@/components/tenant/tenant-profile-form";

import { Card, CardContent } from "@/components/ui/card";
import { BackLink } from "@/components/ui/back-link";

export default async function EditTenantProfilePage() {
  const profile = await getTenantProfile();

  return (
    <div className="space-y-6">
      <BackLink href="/tenant/profile" label="My Profile" />

      <div>
        <h1 className="text-3xl font-bold">Edit Profile</h1>

        <p className="text-muted-foreground">
          Keep your tenant information up to date.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <TenantProfileForm
            defaultValues={{
              occupation: profile?.occupation ?? "",
              nationalId: profile?.nationalId ?? "",
              emergencyContact: profile?.emergencyContact ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
