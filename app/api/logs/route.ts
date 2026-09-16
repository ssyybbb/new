import { NextResponse } from "next/server";
import { readLogs } from "@/lib/store";
import { getSettings } from "@/lib/store";
import { formatZhDateTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET() {
  const [logs, settings] = await Promise.all([readLogs(), getSettings()]);
  const timezone = settings.schedule.timezone;
  return NextResponse.json({
    logs: logs.map((log) => ({
      ...log,
      sentAtLabel: formatZhDateTime(new Date(log.sentAt), timezone),
    })),
  });
}
