"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { markNoticesViewed } from "@/actions/notice/mark-notices-viewed";

// Renders nothing. Fires once the Notices page actually mounts in the
// browser (not on a Link prefetch, which never runs client effects), so
// the unread badge only clears when the tenant genuinely opens the page.
export function MarkNoticesViewed() {
  const router = useRouter();

  useEffect(() => {
    markNoticesViewed().then(() => {
      router.refresh();
    });
  }, [router]);

  return null;
}
