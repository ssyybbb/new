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
    name: "FEISHU_APP_ID",
    where: "Secrets",
    required: true,
    note: "飞书开放平台应用凭证里的 App ID",
  },
  {
    name: "FEISHU_APP_SECRET",
    where: "Secrets",
    required: true,
    note: "飞书开放平台应用凭证里的 App Secret",
  },
  {
    name: "FEISHU_CHAT_ID",
    where: "Secrets",
    required: false,
    note: "目标群 Chat ID。机器人只在一个群时可省略",
  },
  {
    name: "OSS_GITHUB_TOKEN",
    where: "Secrets",
    required: false,
    note: "跟踪私有仓库时需要。公开仓库可省略",
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
];

export function GuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">部署流程</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          飞书开放平台负责「机器人能进群、能发消息」；GitHub Actions
          负责「每天去拉 Issue / PR 再推到群」。两边都要配，缺一不可。
        </p>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>整体在干什么</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <p>
            1. 你在飞书开放平台创建一个<strong className="text-foreground">应用机器人</strong>，发布后拉进群。
          </p>
          <p>
            2. 这个仓库里的 GitHub Actions 每天北京时间 09:00 启动一次，用 GitHub API
            读开源仓库的 Issue / PR，再调用飞书发消息接口推到群。
          </p>
          <p>
            飞书不会自己去访问 GitHub。所以不是「在飞书后台打开一个开关就自动发」，而是「飞书提供发消息能力，定时由 GitHub 来做」。
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>1. 飞书开放平台：创建应用并拉进群</CardTitle>
          <CardDescription>
            打开
            <a
              className="mx-1 font-medium text-foreground underline-offset-4 hover:underline"
              href="https://open.feishu.cn/app"
              target="_blank"
              rel="noreferrer"
            >
              https://open.feishu.cn/app
            </a>
            ，用公司飞书管理员或有权限的账号操作。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <p>1. 创建企业自建应用，名字例如「开源日报」。</p>
          <p>2. 添加应用能力 → 开通「机器人」。可以设一个头像和描述。</p>
          <p>
            3. 权限管理里开通并申请：
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-foreground">以应用身份发消息</code>
            、
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-foreground">获取群组信息</code>
            （对应 <code className="rounded bg-muted px-1 text-foreground">im:message:send_as_bot</code>、
            <code className="rounded bg-muted px-1 text-foreground">im:chat:read</code>）。
          </p>
          <p>4. 版本管理与发布 → 创建版本 → 提交发布。企业自建应用通常要管理员审一次。</p>
          <p>5. 发布通过后，打开目标飞书群 → 设置 → 群机器人 → 添加刚刚那个应用。</p>
          <p>6. 回到开放平台「凭证与基础信息」，复制 App ID 和 App Secret。</p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>2. GitHub：把密钥交给 Actions</CardTitle>
          <CardDescription>
            工作流已经在
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-foreground">
              .github/workflows/daily-digest.yml
            </code>
            。在仓库 Settings → Secrets and variables → Actions 里添加下面这些。
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
            App ID / App Secret 是密钥，只能你在飞书后台复制后自己贴进 GitHub。我这边看不到飞书账号，也不能替你写入 GitHub Secrets。
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>3. 试跑一次，之后每天自动发</CardTitle>
          <CardDescription>
            仓库 Actions →「每日开源日报」→ Run workflow。群里收到卡片就说明通了。之后默认每天 09:00（北京时间）自动跑。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            本机控制台只用来预览和调试。配好 GitHub Actions 之后，电脑可以关机。
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <CopyButton value="0 1 * * *" label="复制默认 cron" />
            <Link
              href="/settings"
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              先在本机填凭证并发送测试消息
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
