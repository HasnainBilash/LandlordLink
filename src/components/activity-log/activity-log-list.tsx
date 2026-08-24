import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ActivityLogListProps = {
  logs: {
    id: string;
    action: string;
    entity: string;
    description: string | null;
    createdAt: Date;
    user: {
      name: string;
      email: string;
      role: string;
    };
    building?: {
      name: string;
    } | null;
  }[];
};

export function ActivityLogList({ logs }: ActivityLogListProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No activity recorded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {log.action} {log.entity}
              </Badge>

              {log.building && (
                <span className="text-sm text-muted-foreground">
                  {log.building.name}
                </span>
              )}
            </div>

            <p className="text-sm">{log.description ?? "—"}</p>

            <p className="text-xs text-muted-foreground">
              {log.user.name} ({log.user.role.toLowerCase()})
            </p>
          </div>

          <p className="shrink-0 text-xs text-muted-foreground">
            {new Date(log.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
