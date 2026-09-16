import { previewDigest } from "@/lib/digest-runner";
import { getSettings, readLogs } from "@/lib/store";
import { formatZhDateTime, nextRunAt } from "@/lib/time";
import type { DashboardStatus, Digest } from "@/lib/types";

export async function getDashboardPayload(): Promise<{
  digest: Digest;
  status: DashboardStatus;
}> {
  const [digest, settings, logs] = await Promise.all([
    previewDigest(),
    getSettings(),
    readLogs(),
  ]);
  const nextRun = nextRunAt(settings.schedule);
  const last = logs.find((log) => log.status === "success");
  return {
    digest,
    status: {
      webhookConfigured: Boolean(settings.feishu.webhookUrl),
      githubConfigured: Boolean(
        settings.sources.mode === "org"
          ? settings.sources.org
          : settings.sources.repos.length,
      ),
      scheduleEnabled: settings.schedule.enabled,
      timezone: settings.schedule.timezone,
      sendTime: `${String(settings.schedule.hour).padStart(2, "0")}:${String(settings.schedule.minute).padStart(2, "0")}`,
      nextRunAt: nextRun.toISOString(),
      nextRunLabel: formatZhDateTime(nextRun, settings.schedule.timezone),
      lastSuccessAt: last?.sentAt ?? null,
      lastSuccessLabel: last
        ? formatZhDateTime(new Date(last.sentAt), settings.schedule.timezone)
        : null,
      digestTitle: settings.digestTitle,
    },
  };
}
