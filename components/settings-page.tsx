"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNCHANGED, type PublicSettings, type SourceMode } from "@/lib/types";

const TIMEZONES = [
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "UTC",
  "America/Los_Angeles",
];

function formFromSettings(data: PublicSettings) {
  return {
    digestTitle: data.digestTitle,
    mode: data.sources.mode,
    org: data.sources.org,
    reposText: data.sources.repos.join("\n"),
    lookbackHours: data.lookbackHours,
    newIssues: data.include.newIssues,
    newPulls: data.include.newPulls,
    mergedPulls: data.include.mergedPulls,
    closedIssues: data.include.closedIssues,
    maxItemsPerSection: data.maxItemsPerSection,
    githubToken: "",
    webhookUrl: "",
    secret: "",
    scheduleEnabled: data.schedule.enabled,
    timezone: data.schedule.timezone,
    hour: data.schedule.hour,
    minute: data.schedule.minute,
    skipIfSentToday: data.schedule.skipIfSentToday,
  };
}

export function SettingsPage({ initialSettings }: { initialSettings: PublicSettings }) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState(() => formFromSettings(initialSettings));
  const [meta, setMeta] = useState(initialSettings.feishu);
  const [tokenMeta, setTokenMeta] = useState({
    configured: initialSettings.githubTokenConfigured,
    fromEnv: initialSettings.githubTokenFromEnv,
  });

  async function save() {
    setSaving(true);
    try {
      const repos = form.reposText
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          digestTitle: form.digestTitle,
          sources: { mode: form.mode, org: form.org, repos },
          lookbackHours: Number(form.lookbackHours),
          include: {
            newIssues: form.newIssues,
            newPulls: form.newPulls,
            mergedPulls: form.mergedPulls,
            closedIssues: form.closedIssues,
          },
          maxItemsPerSection: Number(form.maxItemsPerSection),
          githubToken: form.githubToken ? form.githubToken : UNCHANGED,
          feishu: {
            webhookUrl: form.webhookUrl ? form.webhookUrl : UNCHANGED,
            secret: form.secret ? form.secret : UNCHANGED,
          },
          schedule: {
            enabled: form.scheduleEnabled,
            timezone: form.timezone,
            hour: Number(form.hour),
            minute: Number(form.minute),
            skipIfSentToday: form.skipIfSentToday,
          },
        }),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok) throw new Error(data.message ?? "保存失败");
      toast.success("配置已保存");
      const refreshed = await fetch("/api/settings", { cache: "no-store" });
      const next = (await refreshed.json()) as PublicSettings;
      setForm(formFromSettings(next));
      setMeta(next.feishu);
      setTokenMeta({
        configured: next.githubTokenConfigured,
        fromEnv: next.githubTokenFromEnv,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      if (form.webhookUrl) await save();
      const response = await fetch("/api/feishu/test", { method: "POST" });
      const data = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "测试失败");
      }
      toast.success(data.message ?? "测试消息已发送");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "测试失败");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">配置</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          在飞书群添加自定义机器人，再填入 GitHub 组织或仓库，就可以每天推送开源动态。
        </p>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>1. 飞书群机器人</CardTitle>
          <CardDescription>
            打开目标群 → 设置 → 群机器人 → 添加自定义机器人，复制 Webhook
            地址。如果开启了「签名校验」，把密钥一并填上。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Webhook 地址">
            <Input
              type="password"
              autoComplete="off"
              placeholder={
                meta?.webhookConfigured
                  ? meta.webhookFromEnv
                    ? "已通过环境变量 FEISHU_WEBHOOK_URL 配置"
                    : `已保存 ${meta.webhookUrlMasked}`
                  : "https://open.feishu.cn/open-apis/bot/v2/hook/…"
              }
              value={form.webhookUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  webhookUrl: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="签名密钥（可选）">
            <Input
              type="password"
              autoComplete="off"
              placeholder={
                meta?.secretConfigured
                  ? meta.secretFromEnv
                    ? "已通过环境变量配置"
                    : "已保存，留空表示不修改"
                  : "未开启签名校验可留空"
              }
              value={form.secret}
              onChange={(event) =>
                setForm((current) => ({ ...current, secret: event.target.value }))
              }
            />
          </Field>
          <Button variant="outline" onClick={() => void sendTest()} disabled={testing}>
            {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            发送测试消息
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>2. GitHub 开源仓库</CardTitle>
          <CardDescription>
            填写公司 GitHub 组织名，或明确列出要跟踪的仓库。公开仓库可不填
            Token；私有仓库或避免限流时建议使用
            repo 只读权限的 Personal Access Token。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="数据来源">
            <Select
              value={form.mode}
              onValueChange={(value) => {
                if (!value) return;
                setForm((current) => ({ ...current, mode: value as SourceMode }));
              }}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="org">整个 GitHub 组织</SelectItem>
                <SelectItem value="repos">指定仓库列表</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {form.mode === "org" ? (
            <Field label="组织名">
              <Input
                placeholder="例如 nodejs、facebook，或你们公司的 org"
                value={form.org}
                onChange={(event) =>
                  setForm((current) => ({ ...current, org: event.target.value }))
                }
              />
            </Field>
          ) : (
            <Field label="仓库列表（每行一个 owner/repo）">
              <Textarea
                rows={5}
                placeholder={"acme/sdk\nacme/cli"}
                value={form.reposText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reposText: event.target.value,
                  }))
                }
              />
            </Field>
          )}
          <Field label="GitHub Token（可选）">
            <Input
              type="password"
              autoComplete="off"
              placeholder={
                tokenMeta.configured
                  ? tokenMeta.fromEnv
                    ? "已通过环境变量 GITHUB_TOKEN 配置"
                    : "已保存，留空表示不修改"
                  : "ghp_… 公开仓库可留空"
              }
              value={form.githubToken}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  githubToken: event.target.value,
                }))
              }
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>3. 日报内容</CardTitle>
          <CardDescription>选择每天汇总哪些动态，以及时间窗口。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="日报标题">
            <Input
              value={form.digestTitle}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  digestTitle: event.target.value,
                }))
              }
            />
          </Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="统计过去多少小时">
              <Select
                value={String(form.lookbackHours)}
                onValueChange={(value) => {
                  if (value == null) return;
                  setForm((current) => ({
                    ...current,
                    lookbackHours: Number(value),
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 小时</SelectItem>
                  <SelectItem value="24">24 小时</SelectItem>
                  <SelectItem value="48">48 小时</SelectItem>
                  <SelectItem value="72">3 天</SelectItem>
                  <SelectItem value="168">7 天</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="每个分类最多列出">
              <Select
                value={String(form.maxItemsPerSection)}
                onValueChange={(value) => {
                  if (value == null) return;
                  setForm((current) => ({
                    ...current,
                    maxItemsPerSection: Number(value),
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 条</SelectItem>
                  <SelectItem value="8">8 条</SelectItem>
                  <SelectItem value="12">12 条</SelectItem>
                  <SelectItem value="20">20 条</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle
              label="新 Issue"
              checked={form.newIssues}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, newIssues: checked }))
              }
            />
            <Toggle
              label="新 Pull Request"
              checked={form.newPulls}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, newPulls: checked }))
              }
            />
            <Toggle
              label="已合并 PR"
              checked={form.mergedPulls}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, mergedPulls: checked }))
              }
            />
            <Toggle
              label="已关闭 Issue"
              checked={form.closedIssues}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, closedIssues: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>4. 每天定时推送</CardTitle>
          <CardDescription>
            服务保持运行时，会在设定时刻自动发到飞书。也可以用 crontab 或 GitHub
            Actions 调用 /api/cron。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            label="启用每日定时推送"
            checked={form.scheduleEnabled}
            onCheckedChange={(checked) =>
              setForm((current) => ({ ...current, scheduleEnabled: checked }))
            }
          />
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="时区">
              <Select
                value={form.timezone}
                onValueChange={(value) => {
                  if (!value) return;
                  setForm((current) => ({ ...current, timezone: String(value) }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="小时">
              <Select
                value={String(form.hour)}
                onValueChange={(value) => {
                  if (value == null) return;
                  setForm((current) => ({ ...current, hour: Number(value) }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <SelectItem key={hour} value={String(hour)}>
                      {String(hour).padStart(2, "0")} 时
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="分钟">
              <Select
                value={String(form.minute)}
                onValueChange={(value) => {
                  if (value == null) return;
                  setForm((current) => ({ ...current, minute: Number(value) }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 15, 30, 45].map((minute) => (
                    <SelectItem key={minute} value={String(minute)}>
                      {String(minute).padStart(2, "0")} 分
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Toggle
            label="同一天已成功推送则跳过定时任务"
            checked={form.skipIfSentToday}
            onCheckedChange={(checked) =>
              setForm((current) => ({ ...current, skipIfSentToday: checked }))
            }
          />
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <Button onClick={() => void save()} disabled={saving} size="lg">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          保存配置
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
