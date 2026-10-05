import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  tone?: "default" | "danger" | "success";
};

export function StatCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: StatCardProps) {
  const content = (
    <>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>

      <p
        className={cn(
          "mt-1 text-xl font-semibold md:text-2xl",
          tone === "danger" && "text-destructive",
          tone === "success" && "text-emerald-600 dark:text-emerald-400"
        )}
      >
        {value}
      </p>

      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );

  const className = "block rounded-xl border bg-card p-4";

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(className, "transition-colors hover:border-ring hover:bg-muted/50")}
    >
      {content}
    </Link>
  );
}
