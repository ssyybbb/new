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
    name: "FEISHU_WEBHOOK_URL",
    note: "群自定义机器人的 Webhook。走开放平台应用时可以不填这个。放在 Secrets 里",
  },
  {
    name: "OSS_ORG",
    note: "Variables 里填组织名，例如 PhyAgentOS。不要用 GITHUB_ORG，也不要填网页链接",
  },
  {
    name: "OSS_REPOS",
    note: "只要一个仓库时用这个：PhyAgentOS/PhyAgentOS-core。不要填 /pulls 完整网址",
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
            按钮不在 GitHub 网站上，也不在这个预览页里。请回到 Cursor 里这次对话（任务名叫「飞书开源通知机器人」），看窗口最上方标题附近。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
          <p>如果已经连接了 GitHub 账号，那里会出现一个创建仓库的按钮（英文可能是 Create repo）。点它，选你的 GitHub 账号，新建一个仓库。</p>
          <p>如果完全没有这个按钮：先到 Cursor Settings → Integrations（或账号设置里的 GitHub）把 GitHub 登录连上，再回到这次对话。</p>
          <p>也可以自己打开 github.com/new 新建空仓库。建好后把仓库网址发给我，我告诉你下一步怎么把代码放进去。</p>
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
          <div className="rounded-lg border bg-muted/40 px-3 py-3 text-sm leading-6">
            <p className="font-medium text-foreground">PhyAgentOS-core 该填哪一项？</p>
            <p className="mt-1 text-muted-foreground">
              只要这一个仓库：新建 Variable，Name 填 <code className="font-mono text-foreground">OSS_REPOS</code>，Value 填 <code className="font-mono text-foreground">PhyAgentOS/PhyAgentOS-core</code>。
            </p>
            <p className="mt-1 text-muted-foreground">
              跟踪整个 PhyAgentOS 组织：Name 填 <code className="font-mono text-foreground">OSS_ORG</code>，Value 填 <code className="font-mono text-foreground">PhyAgentOS</code>。
            </p>
            <p className="mt-1 text-muted-foreground">
              <code className="font-mono text-foreground">https://github.com/PhyAgentOS/PhyAgentOS-core/pulls</code> 是浏览器地址，不要当组织名填。程序现在能从这种链接里抽出仓库名，但推荐直接填 <code className="font-mono text-foreground">PhyAgentOS/PhyAgentOS-core</code>。
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Webhook、App Secret 是密码，只能你从飞书后台复制后自己贴到 GitHub。我看不到你的飞书账号，也没法替你点保存。
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
