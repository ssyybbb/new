# 开源日报 · 飞书群机器人

每天把公司开源仓库里的 **Issue** 和 **Pull Request** 汇总成一张卡片，推到飞书群。

飞书开放平台负责让机器人进群、发消息；GitHub Actions 负责每天去拉 GitHub 再推送。本地服务器不是必须的。

## 部署流程

### 1. 飞书开放平台创建应用机器人

1. 打开 [飞书开放平台](https://open.feishu.cn/app)，创建企业自建应用
2. 添加应用能力 → 开通「机器人」
3. 权限管理申请：`im:message:send_as_bot`（以应用身份发消息）、`im:chat:read`（获取群组信息）
4. 版本管理与发布 → 提交发布（通常需要管理员审批）
5. 在目标群 → 设置 → 群机器人 → 添加这个应用
6. 复制 App ID、App Secret

### 2. GitHub Actions 每天自动发

把本仓库放到 GitHub 后，在 **Settings → Secrets and variables → Actions** 填写：

| 名称 | 位置 | 必填 | 含义 |
| --- | --- | --- | --- |
| `FEISHU_APP_ID` | Secret | 是 | 开放平台 App ID |
| `FEISHU_APP_SECRET` | Secret | 是 | 开放平台 App Secret |
| `FEISHU_CHAT_ID` | Secret | 否 | 群 Chat ID；机器人只在一个群时可省略 |
| `GITHUB_ORG` | Variable | 二选一 | GitHub 组织名 |
| `GITHUB_REPOS` | Variable | 二选一 | `acme/sdk acme/cli` |
| `OSS_GITHUB_TOKEN` | Secret | 否 | 私有仓库才需要 |

打开 **Actions → 每日开源日报 → Run workflow** 试跑。之后默认每天北京时间 09:00 自动发。

工作流：`.github/workflows/daily-digest.yml`。

### 3. 可选：本机预览

```bash
cp .env.example .env
npm install
npm run dev
```

打开 [http://127.0.0.1:43123](http://127.0.0.1:43123)，在配置页填同样的凭证，点「发送测试消息」。

## 配置项

| 变量 | 含义 |
| --- | --- |
| `FEISHU_APP_ID` / `FEISHU_APP_SECRET` | 开放平台应用凭证 |
| `FEISHU_CHAT_ID` | 目标群。只在一个群时可省略 |
| `FEISHU_WEBHOOK_URL` | 备用：群自定义机器人 Webhook |
| `GITHUB_ORG` / `GITHUB_REPOS` | 要跟踪的仓库 |
| `GITHUB_TOKEN` | 可选 PAT |
| `DIGEST_TITLE` | 卡片标题 |
| `LOOKBACK_HOURS` | 统计过去多少小时，默认 24 |

```bash
npm run digest:send
```
