import { auth } from "@/auth";
import { getTenantProfile } from "@/actions/tenant-profile/get-tenant-profile";

import { PageHeader } from "@/components/layout/page-header";
import { TenantProfileForm } from "@/components/tenant/tenant-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TenantProfilePage() {
  const [session, profile] = await Promise.all([auth(), getTenantProfile()]);

  return (
    <>
      <PageHeader
        title="Profile"
        description="What landlords see when you request one of their flats."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{session?.user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium break-all">{session?.user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tenant details</CardTitle>
            <CardDescription>Helps landlords decide on your request.</CardDescription>
          </CardHeader>
          <CardContent>
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
    </>
  );
}
