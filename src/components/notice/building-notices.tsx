import { Megaphone } from "lucide-react";

import { getNotices } from "@/actions/notice/get-notices";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { IconChip } from "@/components/ui/icon-chip";
import { surface } from "@/components/ui/surface";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

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
        icon={Megaphone}
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

      <ul className="space-y-3">
        {notices.map((notice) => {
          const isExpired = notice.expiresAt ? notice.expiresAt < now : false;

          return (
            <li key={notice.id} className={cn(surface, "flex gap-3 p-4 md:p-5")}>
              <IconChip icon={Megaphone} tone={isExpired ? "muted" : "primary"} />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("font-semibold", isExpired && "text-muted-foreground")}>
                        {notice.title}
                      </p>
                      <Badge variant="secondary">{AUDIENCE_LABELS[notice.audience]}</Badge>
                      {isExpired && <Badge variant="outline">Expired</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Posted {formatDate(notice.createdAt)}
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

                <p
                  className={cn(
                    "text-sm whitespace-pre-wrap",
                    isExpired ? "text-muted-foreground" : "text-foreground/90"
                  )}
                >
                  {notice.content}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
