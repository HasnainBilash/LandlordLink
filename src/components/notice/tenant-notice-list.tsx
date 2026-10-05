"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { markNoticesViewed } from "@/actions/notice/mark-notices-viewed";

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
      <p className="text-sm text-muted-foreground">
        No notices from your building right now.
      </p>
    );
  }

  return (
    <ul className="divide-y">
      {notices.map((notice) => (
        <li key={notice.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{notice.title}</p>
            {newIds.has(notice.id) && <NewBadge />}
          </div>

          <p className="text-xs text-muted-foreground">
            {notice.building.name} · {formatDate(notice.createdAt)}
            {notice.expiresAt && ` · until ${formatDate(notice.expiresAt)}`}
          </p>

          <p className="text-sm whitespace-pre-wrap">{notice.content}</p>
        </li>
      ))}
    </ul>
  );
}
