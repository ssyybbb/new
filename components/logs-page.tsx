"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SendLog } from "@/lib/types";

export type LogRow = SendLog & { sentAtLabel: string };

const statusLabel: Record<SendLog["status"], string> = {
  success: "成功",
  failed: "失败",
  skipped: "跳过",
};

const triggerLabel: Record<SendLog["trigger"], string> = {
  manual: "手动",
  schedule: "每日定时",
  cron: "外部 Cron",
  cli: "命令行",
  test: "测试",
};

export function LogsPage({ initialLogs }: { initialLogs: LogRow[] }) {
  const logs = initialLogs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">推送记录</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          最近 100 次推送，包括手动发送、每日定时和外部 Cron。
        </p>
      </div>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>历史</CardTitle>
          <CardDescription>
            {logs.length === 0 ? "还没有推送过。" : `共 ${logs.length} 条`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {logs.length === 0 ? (
            <p className="px-6 pb-4 text-sm text-muted-foreground">
              配置好飞书 Webhook 后，点「立即推送到飞书」或等到每天定时，就会出现记录。
            </p>
          ) : (
            <ul className="divide-y">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-col gap-2 px-6 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{log.sentAtLabel}</p>
                    <p className="text-sm text-muted-foreground">{log.message}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={log.status === "failed" ? "destructive" : "secondary"}>
                      {statusLabel[log.status]}
                    </Badge>
                    <Badge variant="outline">{triggerLabel[log.trigger]}</Badge>
                    {log.demo ? <Badge variant="outline">演示数据</Badge> : null}
                    <span className="text-xs text-muted-foreground">
                      Issue {log.summary.newIssues} · PR {log.summary.newPulls} ·
                      合并 {log.summary.mergedPulls} · 关闭 {log.summary.closedIssues}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
