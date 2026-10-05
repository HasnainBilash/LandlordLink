import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
};

export function EmptyState({ title, description, action, icon: Icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed bg-card/50 px-6 py-14 text-center">
      {Icon && (
        <span className="mb-1 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
          <Icon className="size-6" />
        </span>
      )}

      <p className="text-base font-semibold">{title}</p>

      {description && (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      )}

      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
