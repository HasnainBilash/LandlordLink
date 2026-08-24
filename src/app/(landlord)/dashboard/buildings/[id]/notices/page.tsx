import Link from "next/link";
import { notFound } from "next/navigation";

import { getBuilding } from "@/actions/building/get-building";
import { getNotices } from "@/actions/notice/get-notices";
import { DeleteNoticeButton } from "@/components/notice/delete-notice-button";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BackLink } from "@/components/ui/back-link";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const audienceLabel = {
  ALL: "Everyone",
  TENANTS: "Tenants Only",
  LANDLORDS: "Landlords Only",
} as const;

export default async function NoticesPage({ params }: PageProps) {
  const { id } = await params;

  const building = await getBuilding(id);

  if (!building) {
    notFound();
  }

  const notices = await getNotices(id);

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Buildings", href: "/dashboard/buildings" },
            { label: building.name, href: `/dashboard/buildings/${id}` },
            { label: "Notices" },
          ]}
        />

        <BackLink href={`/dashboard/buildings/${id}`} label={building.name} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notices</h1>
          <p className="text-muted-foreground">{building.name}</p>
        </div>

        <Link href={`/dashboard/buildings/${id}/notices/new`}>
          <Button>New Notice</Button>
        </Link>
      </div>

      {notices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No notices yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => {
            const isExpired = notice.expiresAt
              ? new Date(notice.expiresAt) < now
              : false;

            return (
              <Card key={notice.id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{notice.title}</h2>

                      <p className="text-sm text-muted-foreground">
                        {audienceLabel[notice.audience]} ·{" "}
                        {notice.expiresAt
                          ? `Expires ${new Date(
                              notice.expiresAt
                            ).toLocaleDateString()}`
                          : "Never expires"}
                      </p>
                    </div>

                    <Badge variant={isExpired ? "secondary" : "default"}>
                      {isExpired ? "Expired" : "Active"}
                    </Badge>
                  </div>

                  <p className="whitespace-pre-wrap text-sm">
                    {notice.content}
                  </p>

                  <div className="flex gap-3">
                    <Link
                      href={`/dashboard/buildings/${id}/notices/${notice.id}/edit`}
                    >
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </Link>

                    <DeleteNoticeButton noticeId={notice.id} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
