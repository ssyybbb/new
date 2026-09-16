"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  Clock3,
  Loader2,
  RefreshCw,
  Send,
  Webhook,
} from "lucide-react";
import { DigestView } from "@/components/digest-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardStatus, Digest } from "@/lib/types";

export function DashboardPage({
  initialDigest,
  initialStatus,
}: {
  initialDigest: Digest;
  initialStatus: DashboardStatus;
}) {
  const [digest, setDigest] = useState<Digest>(initialDigest);
  const [status, setStatus] = useState<DashboardStatus>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/digest", { cache: "no-store" });
      if (!response.ok) throw new Error("无法加载日报");
      const data = (await response.json()) as {
        digest: Digest;
        status: DashboardStatus;
      };
      setDigest(data.digest);
      setStatus(data.status);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function sendNow() {
    setSending(true);
    try {
      const response = await fetch("/api/digest/send", { method: "POST" });
      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        log?: { message: string };
      };
      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "推送失败");
      }
      toast.success(data.log?.message ?? "已推送到飞书群");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "推送失败");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">今日日报</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            汇总开源仓库最近的 Issue 和 PR，定时发到飞书群。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            刷新预览
          </Button>
          <Button onClick={() => void sendNow()} disabled={sending || loading}>
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            立即推送到飞书
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatusCard
          icon={<Webhook className="size-4" />}
          label="飞书机器人"
          value={
            status?.webhookConfigured ? "Webhook 已配置" : "还没接入群"
          }
          hint={
            status?.webhookConfigured
              ? "可以向群里发卡片了"
              : "去配置页粘贴自定义机器人地址"
          }
          ok={Boolean(status?.webhookConfigured)}
        />
        <StatusCard
          icon={<Clock3 className="size-4" />}
          label="下次定时推送"
          value={
            status?.scheduleEnabled
              ? status.nextRunLabel.replace(/星期./, "")
              : "已关闭"
          }
          hint={
            status
              ? `${status.timezone} · 每天 ${status.sendTime}`
              : "加载中"
          }
          ok={Boolean(status?.scheduleEnabled)}
        />
        <StatusCard
          icon={<Send className="size-4" />}
          label="上次成功推送"
          value={status?.lastSuccessLabel?.replace(/星期./, "") ?? "还没有记录"}
          hint={
            status?.githubConfigured
              ? "正在使用真实 GitHub 数据"
              : "目前是演示数据"
          }
          ok={Boolean(status?.lastSuccessAt)}
        />
      </div>

      {digest.warning ? (
        <Alert>
          <AlertCircle className="size-4" />
          <AlertTitle>注意</AlertTitle>
          <AlertDescription>
            {digest.warning}{" "}
            {!status?.githubConfigured || !status?.webhookConfigured ? (
              <Link href="/settings" className="font-medium text-foreground">
                前往配置
              </Link>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <DigestView digest={digest} />
      )}
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  hint,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  ok: boolean;
}) {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-base font-semibold">{value}</p>
        <p className={`mt-1 text-xs ${ok ? "text-muted-foreground" : "text-amber-700"}`}>
          {hint}
        </p>
      </CardContent>
    </Card>
  );
}
