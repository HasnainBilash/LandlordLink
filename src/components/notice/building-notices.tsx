import { getNotices } from "@/actions/notice/get-notices";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";

import { NewNoticeButton, NoticeItemActions } from "./notice-actions";

const AUDIENCE_LABELS = {
  ALL: "Everyone",
  TENANTS: "Tenants only",
  LANDLORDS: "Only you",
} as const;

// The "Notices" tab of a building.
export async function BuildingNotices({ buildingId }: { buildingId: string }) {
  const notices = await getNotices(buildingId);
  const now = new Date();

  if (notices.length === 0) {
    return (
      <EmptyState
        title="No notices yet"
        description="Notices show up on your tenants' Home page — use them for water or power cuts, meetings, rent reminders and so on."
        action={<NewNoticeButton buildingId={buildingId} />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NewNoticeButton buildingId={buildingId} />
      </div>

      <ul className="divide-y rounded-xl border bg-card">
        {notices.map((notice) => {
          const isExpired = notice.expiresAt ? notice.expiresAt < now : false;

          return (
            <li key={notice.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{notice.title}</p>
                    {isExpired && <Badge variant="secondary">Expired</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {AUDIENCE_LABELS[notice.audience]} · posted {formatDate(notice.createdAt)}
                    {notice.expiresAt &&
                      ` · ${isExpired ? "expired" : "until"} ${formatDate(notice.expiresAt)}`}
                  </p>
                </div>

                <NoticeItemActions
                  notice={{
                    id: notice.id,
                    title: notice.title,
                    content: notice.content,
                    audience: notice.audience,
                    expiresAt: notice.expiresAt,
                  }}
                />
              </div>

              <p className="text-sm whitespace-pre-wrap">{notice.content}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
