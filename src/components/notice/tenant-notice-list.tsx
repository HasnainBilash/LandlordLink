"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Megaphone } from "lucide-react";

import { markNoticesViewed } from "@/actions/notice/mark-notices-viewed";

import { IconChip } from "@/components/ui/icon-chip";
import { NewBadge } from "@/components/ui/status-badges";
import { formatDate } from "@/lib/format";

type TenantNoticeListProps = {
  notices: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    expiresAt: Date | null;
    isNew: boolean;
    building: { name: string };
  }[];
};

// Shows the tenant's notices and marks them as read once they're on
// screen. The "New" labels are remembered for this visit, so refreshing
// the page data (to clear the nav badge) doesn't make them disappear.
export function TenantNoticeList({ notices }: TenantNoticeListProps) {
  const router = useRouter();
  const [newIds] = useState(
    () => new Set(notices.filter((notice) => notice.isNew).map((notice) => notice.id))
  );

  useEffect(() => {
    if (newIds.size === 0) return;

    markNoticesViewed().then(() => router.refresh());
  }, [newIds, router]);

  if (notices.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <IconChip icon={Megaphone} tone="muted" />
        No notices from your building right now.
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {notices.map((notice) => (
        <li key={notice.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
          <IconChip icon={Megaphone} tone={newIds.has(notice.id) ? "primary" : "muted"} />

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{notice.title}</p>
              {newIds.has(notice.id) && <NewBadge />}
            </div>

            <p className="text-xs text-muted-foreground">
              {notice.building.name} · {formatDate(notice.createdAt)}
              {notice.expiresAt && ` · until ${formatDate(notice.expiresAt)}`}
            </p>

            <p className="text-sm whitespace-pre-wrap text-foreground/90">{notice.content}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
