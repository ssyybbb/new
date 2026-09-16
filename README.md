# 开源日报

这是一个会每天把公司 GitHub 开源仓库的 Issue / PR 汇总，发到飞书群的小工具。

## 这个应用在哪？

代码就在当前这个 Cursor 项目里。你现在如果能打开预览页，那只是临时看效果，**还不是**已经部署到飞书或 GitHub。

要让它每天自动发，必须把这个项目存成一个 **GitHub 仓库**。不需要自己租服务器、也不需要一直开着电脑。

## 你要做的 4 步

1. 在 Cursor 点 **Create repo**，用 GitHub 账号新建仓库（代码会自动进去）
2. 去 [飞书开放平台](https://open.feishu.cn/app) 创建应用 → 开通机器人 → 发布 → 把机器人拉进群 → 复制 App ID / App Secret
3. 打开 GitHub 仓库 → Settings → Secrets and variables → Actions，添加：
   - Secret：`FEISHU_APP_ID`、`FEISHU_APP_SECRET`
   - Variable：`GITHUB_ORG`（你们的 GitHub 组织名）或 `GITHUB_REPOS`
4. GitHub 仓库点 Actions →「每日开源日报」→ Run workflow。群里收到卡片就成功了

之后每天北京时间约 09:00 自动发。
