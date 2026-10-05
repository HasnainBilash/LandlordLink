import { Mail, ShieldCheck } from "lucide-react";

import { auth } from "@/auth";
import { getTenantProfile } from "@/actions/tenant-profile/get-tenant-profile";

import { PageHeader } from "@/components/layout/page-header";
import { TenantProfileForm } from "@/components/tenant/tenant-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InitialsAvatar } from "@/components/ui/initials-avatar";

export default async function TenantProfilePage() {
  const [session, profile] = await Promise.all([auth(), getTenantProfile()]);
  const name = session?.user?.name ?? "";

  return (
    <>
      <PageHeader
        title="Profile"
        description="What landlords see when you request one of their flats."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-4 text-center">
            <InitialsAvatar name={name} size="lg" className="size-16 text-xl" />
            <div className="min-w-0">
              <p className="text-lg font-semibold">{name}</p>
              <p className="flex items-center justify-center gap-1.5 text-sm break-all text-muted-foreground">
                <Mail className="size-3.5 shrink-0" />
                {session?.user?.email}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary dark:bg-primary/20">
              Tenant
            </span>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tenant details</CardTitle>
            <CardDescription>Helps landlords decide on your request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <TenantProfileForm
              defaultValues={{
                occupation: profile?.occupation ?? "",
                nationalId: profile?.nationalId ?? "",
                emergencyContact: profile?.emergencyContact ?? "",
              }}
            />

            <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-px size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              Only landlords you send a request to can see these details.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
