import { formatDateTime } from "@/lib/format";

type ActivityLogListProps = {
  logs: {
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
  }[];
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  APPROVE: "Approved",
  REJECT: "Rejected",
  END: "Ended",
  PAY: "Payment",
  LOGIN: "Signed in",
  REGISTER: "Registered",
  WRITE_OFF: "Written off",
};

export function ActivityLogList({ logs }: ActivityLogListProps) {
  if (logs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {logs.map((log) => (
        <li
          key={log.id}
          className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
        >
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm">
              {log.description ?? `${ACTION_LABELS[log.action] ?? log.action} ${log.entity}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {ACTION_LABELS[log.action] ?? log.action} · {log.user.name} (
              {log.user.role.toLowerCase()})
              {log.building && ` · ${log.building.name}`}
            </p>
          </div>

          <p className="shrink-0 text-xs text-muted-foreground">
            {formatDateTime(log.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
