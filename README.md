# 开源日报 · 飞书群机器人

每天把公司开源仓库里的 **Issue** 和 **Pull Request** 汇总成一张卡片，推到飞书群。

**不需要一直开着本地服务器。** 飞书群里的自定义机器人只能收消息，不会自己去拉 GitHub。推荐把本仓库放到 GitHub，用自带的 Actions 每天定时推送。

## 推荐：GitHub Actions 每天自动发

1. 在飞书群添加 **自定义机器人**，复制 Webhook  
   [官方说明](https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot)
2. 把本项目推到 GitHub
3. 仓库 **Settings → Secrets and variables → Actions** 中填写：

| 名称 | 位置 | 必填 | 含义 |
| --- | --- | --- | --- |
| `FEISHU_WEBHOOK_URL` | Secret | 是 | 飞书 Webhook |
| `FEISHU_WEBHOOK_SECRET` | Secret | 否 | 签名密钥 |
| `GITHUB_ORG` | Variable | 二选一 | GitHub 组织名 |
| `GITHUB_REPOS` | Variable | 二选一 | `acme/sdk acme/cli` |
| `OSS_GITHUB_TOKEN` | Secret | 否 | 私有仓库才需要 |
| `DIGEST_TITLE` | Variable | 否 | 卡片标题 |

4. 打开 **Actions → 每日开源日报 → Run workflow** 立刻试跑一次
5. 之后默认每天 **北京时间 09:00** 自动发。电脑可以关机。

工作流文件：`.github/workflows/daily-digest.yml`。GitHub 的定时可能比整点晚几分钟。

## 可选：本机预览

需要看卡片长什么样、或手动补发时，再启动控制台：

```bash
cp .env.example .env
npm install
npm run dev
```

浏览器打开 [http://127.0.0.1:43123](http://127.0.0.1:43123)。没有配置仓库时会显示演示数据。

本机进程内定时只在服务保持运行时生效，适合调试，不适合当生产方案。

## 配置项

GitHub Actions 和生产环境用环境变量；网页里保存的配置写在 `data/settings.json`，不要提交到 Git。

| 变量 | 含义 |
| --- | --- |
| `FEISHU_WEBHOOK_URL` | 飞书自定义机器人 Webhook |
| `FEISHU_WEBHOOK_SECRET` | 可选，签名密钥 |
| `GITHUB_ORG` | GitHub 组织名 |
| `GITHUB_REPOS` | 仓库列表，逗号或空格分隔 |
| `GITHUB_TOKEN` | 可选 PAT。公开仓库可不填 |
| `DIGEST_TITLE` | 卡片标题，默认「开源日报」 |
| `LOOKBACK_HOURS` | 统计过去多少小时，默认 24 |
| `SCHEDULE_TZ` / `SCHEDULE_HOUR` / `SCHEDULE_MINUTE` | 仅本机进程内定时使用 |
| `CRON_SECRET` | 仅在自建服务调用 `/api/cron` 时使用 |

命令行补发一次（本机或 CI 均可）：

```bash
npm run digest:send
```

## 日报里有什么

默认统计过去 24 小时：

- 新打开的 Issue
- 新打开的 Pull Request
- 已合并的 PR
- 已关闭的 Issue
