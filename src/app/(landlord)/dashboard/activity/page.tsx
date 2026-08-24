import { getActivityLogsForLandlord } from "@/actions/activity-log/get-activity-logs-for-landlord";
import { ActivityLogList } from "@/components/activity-log/activity-log-list";

export default async function ActivityPage() {
  const logs = await getActivityLogsForLandlord();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity</h1>

        <p className="text-muted-foreground">
          Everything that happened across your buildings, and your own
          account activity. Showing the most recent 200 entries.
        </p>
      </div>

      <ActivityLogList logs={logs} />
    </div>
  );
}
