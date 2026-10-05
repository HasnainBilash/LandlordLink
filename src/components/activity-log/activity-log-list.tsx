import {
  BadgeMinus,
  Banknote,
  CheckCircle2,
  History,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { IconChip, type IconChipTone } from "@/components/ui/icon-chip";
import { surface } from "@/components/ui/surface";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type ActivityLog = {
  id: string;
  action: string;
  entity: string;
  description: string | null;
  createdAt: Date;
  user: {
    name: string;
    role: string;
  };
  building?: {
    name: string;
  } | null;
};

type ActivityLogListProps = {
  logs: ActivityLog[];
};

const ACTIONS: Record<string, { label: string; icon: LucideIcon; tone: IconChipTone }> = {
  CREATE: { label: "Created", icon: Plus, tone: "primary" },
  UPDATE: { label: "Updated", icon: Pencil, tone: "info" },
  DELETE: { label: "Deleted", icon: Trash2, tone: "danger" },
  APPROVE: { label: "Approved", icon: CheckCircle2, tone: "success" },
  REJECT: { label: "Rejected", icon: XCircle, tone: "danger" },
  END: { label: "Ended", icon: LogOut, tone: "warning" },
  PAY: { label: "Payment", icon: Banknote, tone: "success" },
  LOGIN: { label: "Signed in", icon: LogIn, tone: "muted" },
  REGISTER: { label: "Registered", icon: UserPlus, tone: "primary" },
  WRITE_OFF: { label: "Written off", icon: BadgeMinus, tone: "warning" },
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Logs arrive newest first; group them by day (in the app's time zone).
function groupByDay(logs: ActivityLog[]) {
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - DAY_MS));
  const groups: { label: string; logs: ActivityLog[] }[] = [];

  for (const log of logs) {
    const day = formatDate(log.createdAt);
    const label = day === today ? "Today" : day === yesterday ? "Yesterday" : day;
    const last = groups[groups.length - 1];

    if (last?.label === label) last.logs.push(log);
    else groups.push({ label, logs: [log] });
  }

  return groups;
}

export function ActivityLogList({ logs }: ActivityLogListProps) {
  if (logs.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No activity yet"
        description="Payments, approvals and changes to your buildings will show up here."
      />
    );
  }

  return (
    <div className="space-y-6">
      {groupByDay(logs).map((group) => (
        <section key={group.label} className="space-y-2">
          <h3 className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {group.label}
          </h3>

          <ul className={cn(surface, "divide-y")}>
            {group.logs.map((log) => {
              const action = ACTIONS[log.action];

              return (
                <li key={log.id} className="flex items-start gap-3 p-4">
                  <IconChip
                    icon={action?.icon ?? History}
                    tone={action?.tone ?? "muted"}
                    size="sm"
                  />

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm">
                      {log.description ??
                        (log.action === "LOGIN"
                          ? "Signed in."
                          : `${action?.label ?? log.action} ${log.entity}`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {action?.label ?? log.action} · {log.user.name} (
                      {log.user.role.toLowerCase()})
                      {log.building && ` · ${log.building.name}`}
                    </p>
                  </div>

                  <time
                    dateTime={new Date(log.createdAt).toISOString()}
                    className="shrink-0 pt-0.5 text-xs text-muted-foreground tabular-nums"
                  >
                    {formatTime(log.createdAt)}
                  </time>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
