"use client";

import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const secrets = [
  {
    name: "FEISHU_WEBHOOK_URL",
    where: "Secrets",
    required: true,
    note: "飞书群自定义机器人的 Webhook 完整地址",
  },
  {
    name: "FEISHU_WEBHOOK_SECRET",
    where: "Secrets",
    required: false,
    note: "如果机器人开了签名校验，把密钥填在这里",
  },
  {
    name: "OSS_GITHUB_TOKEN",
    where: "Secrets",
    required: false,
    note: "跟踪私有仓库时需要。公开仓库可省略，Actions 会用自带的 GITHUB_TOKEN",
  },
  {
    name: "GITHUB_ORG",
    where: "Variables",
    required: false,
    note: "公司 GitHub 组织名。和组织、仓库列表至少填一项",
  },
  {
    name: "GITHUB_REPOS",
    where: "Variables",
    required: false,
    note: "指定仓库，空格或逗号分隔，例如 acme/sdk acme/cli",
  },
  {
    name: "DIGEST_TITLE",
    where: "Variables",
    required: false,
    note: "卡片标题，默认「开源日报」",
  },
];

export function GuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">定时推送</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          不需要一直开着电脑。飞书群机器人只负责收消息，每天由 GitHub Actions
          去拉 Issue / PR 再推到群里。
        </p>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>为什么飞书不能自己发？</CardTitle>
          <CardDescription>
            群里添加的是「自定义机器人」。它提供一个 Webhook：只有外部程序
            POST 过去，群里才会出现卡片。飞书不会去访问你们的 GitHub
            仓库，也没有「每天统计开源动态」这种内置定时任务。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <p>
            所以要有一个定时触发器。推荐用本仓库自带的 GitHub
            Actions：GitHub 的机器每天跑一次，跑完就退出，本地不用挂服务。
          </p>
          <p>
            控制台（「今日日报 / 配置」）只是用来预览和调试。生产环境把下面 Secrets
            配好即可。
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>1. 在飞书群添加自定义机器人</CardTitle>
          <CardDescription>
            打开目标群 → 设置 → 群机器人 → 添加自定义机器人，复制 Webhook。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          官方说明：
          <a
            className="ml-1 font-medium text-foreground underline-offset-4 hover:underline"
            href="https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot"
            target="_blank"
            rel="noreferrer"
          >
            自定义机器人使用指南
          </a>
          。这一步只是让群「能收消息」，不会开始定时发送。
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>2. 把项目放到 GitHub，填仓库密钥</CardTitle>
          <CardDescription>
            打开仓库 → Settings → Secrets and variables → Actions。工作流文件已经在
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-foreground">
              .github/workflows/daily-digest.yml
            </code>
            ，默认每天北京时间 09:00 运行。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="divide-y overflow-hidden rounded-lg border">
            {secrets.map((item) => (
              <li
                key={item.name}
                className="flex flex-col gap-2 px-3 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-mono text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.where}
                    {item.required ? " · 必填" : " · 可选"} · {item.note}
                  </p>
                </div>
                <CopyButton value={item.name} />
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            至少配置 <span className="font-medium text-foreground">FEISHU_WEBHOOK_URL</span>，以及{" "}
            <span className="font-medium text-foreground">GITHUB_ORG</span> 或{" "}
            <span className="font-medium text-foreground">GITHUB_REPOS</span>。
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>3. 立刻试跑一次</CardTitle>
          <CardDescription>
            打开仓库 Actions →「每日开源日报」→ Run workflow。成功后飞书群会收到一张日报卡片。之后每天定时自动跑，电脑可以关机。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            GitHub 的定时任务可能比整点晚几分钟，这是平台限制，不是机器人坏了。公开仓库如果超过 60
            天没有任何提交，GitHub 可能会暂停 schedule，再 push 一次即可恢复。
          </p>
          <p>
            想改点名时间：编辑工作流里的 cron。例如北京时间 18:00 对应 UTC 10:00，写成{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">0 10 * * *</code>。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value="0 1 * * *" label="复制默认 cron" />
            <Link
              href="/settings"
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              仍要在本机预览？去配置页
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
