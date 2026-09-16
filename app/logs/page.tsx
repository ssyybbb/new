import { LogsPage } from "@/components/logs-page";
import { getSettings, readLogs } from "@/lib/store";
import { formatZhDateTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [logs, settings] = await Promise.all([readLogs(), getSettings()]);
  const timezone = settings.schedule.timezone;
  return (
    <LogsPage
      initialLogs={logs.map((log) => ({
        ...log,
        sentAtLabel: formatZhDateTime(new Date(log.sentAt), timezone),
      }))}
    />
  );
}
