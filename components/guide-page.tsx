"use client";

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
    note: "飞书开放平台 → 凭证与基础信息 → App ID",
  },
  {
    name: "FEISHU_APP_SECRET",
    note: "同一页的 App Secret",
  },
  {
    name: "GITHUB_ORG",
    note: "要跟踪的 GitHub 组织名，例如 nodejs。和下一栏至少填一个",
  },
  {
    name: "GITHUB_REPOS",
    note: "或者写成仓库列表：公司名/仓库名 公司名/另一个仓库",
  },
];

export function GuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">从这里开始</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          按顺序做完这 4 步，飞书群就会每天收到开源仓库的 Issue / PR。不需要买服务器，也不用一直开着电脑。
        </p>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>先搞清三件事</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            <strong className="text-foreground">这个应用在哪？</strong>
            就是你现在看的这个页面。代码已经写在当前 Cursor 项目里，不是飞书里自带的功能，也还没有自动出现在你的 GitHub 上。
          </p>
          <p>
            <strong className="text-foreground">要不要放到 GitHub？要。</strong>
            每天定时发送靠的是 GitHub 提供的免费定时任务（Actions）。代码必须在一个 GitHub 仓库里，GitHub 才会每天帮你跑。
          </p>
          <p>
            <strong className="text-foreground">要不要自己做网站、租云服务器？不用。</strong>
            这个预览页只是给你看效果。真正每天发消息的，是 GitHub 在云端跑一小段脚本，跑完就结束。
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>第 1 步：把这个项目存成 GitHub 仓库</CardTitle>
          <CardDescription>
            在 Cursor 里找到「Create repo」按钮点一下，用你的 GitHub 账号新建仓库。建好后，这套代码就会出现在 github.com 你的账号下面。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <p>建好后打开那个仓库，记住网址，后面要去 Settings 里填几项配置。</p>
          <p>如果你已经建过仓库，可以跳过这一步，直接做第 2 步。</p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>第 2 步：在飞书开发平台做一个机器人，拉进群</CardTitle>
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
            ，用公司飞书账号登录。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <p>1. 点「创建企业自建应用」，名字填「开源日报」。</p>
          <p>2. 左侧「添加应用能力」→ 开通「机器人」。</p>
          <p>3. 「权限管理」里搜索并开通：以应用身份发消息、获取群组信息。按提示申请权限。</p>
          <p>4. 「版本管理与发布」→ 创建版本 → 提交发布。可能要等管理员点同意。</p>
          <p>5. 管理员通过后，打开要收日报的飞书群 → 右上角设置 → 群机器人 → 添加刚才那个应用。</p>
          <p>6. 回到开放平台「凭证与基础信息」，复制 App ID 和 App Secret，下一步要用。</p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>第 3 步：回到 GitHub 仓库，把飞书密钥填进去</CardTitle>
          <CardDescription>
            打开你的 GitHub 仓库 → Settings → Secrets and variables → Actions。
            Secrets 里点 New repository secret，Variables 里点 New repository variable。
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
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                </div>
                <CopyButton value={item.name} />
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            App ID、App Secret 是密码，只能你从飞书后台复制后自己贴到 GitHub。我看不到你的飞书账号，也没法替你点保存。
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>第 4 步：让 GitHub 先跑一次</CardTitle>
          <CardDescription>
            仓库顶部点 Actions → 左侧「每日开源日报」→ 右侧 Run workflow → 再点绿色的 Run workflow。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <p>一两分钟后，飞书群里应该会出现一张日报卡片。出现了就说明成功了。</p>
          <p>之后每天北京时间大约 09:00，GitHub 会自动再跑一次。电脑关机也没关系。</p>
          <p>如果 Actions 是灰色的或没有这个工作流，多半是第 1 步的仓库还没把代码推上去，回到 Cursor 再确认 Create repo 是否完成。</p>
        </CardContent>
      </Card>
    </div>
  );
}
