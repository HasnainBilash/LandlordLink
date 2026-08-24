import { getActiveNoticesForTenant } from "@/actions/notice/get-active-notices-for-tenant";
import { MarkNoticesViewed } from "@/components/notice/mark-notices-viewed";

import { Card, CardContent } from "@/components/ui/card";

export default async function TenantNoticesPage() {
  const notices = await getActiveNoticesForTenant();

  return (
    <div className="space-y-6">
      <MarkNoticesViewed />
      <div>
        <h1 className="text-3xl font-bold">Notices</h1>

        <p className="text-muted-foreground">
          Announcements from the buildings you currently live in.
        </p>
      </div>

      {notices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No active notices right now.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card key={notice.id}>
              <CardContent className="space-y-2 pt-6">
                <div>
                  <h2 className="font-semibold">{notice.title}</h2>

                  <p className="text-sm text-muted-foreground">
                    {notice.building.name}
                    {notice.expiresAt &&
                      ` · Until ${new Date(
                        notice.expiresAt
                      ).toLocaleDateString()}`}
                  </p>
                </div>

                <p className="whitespace-pre-wrap text-sm">
                  {notice.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
