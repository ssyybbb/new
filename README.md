# 开源日报 · 飞书群机器人

每天把公司开源仓库里的 **Issue** 和 **Pull Request** 汇总成一张卡片，推到飞书群。

打开控制台后可以：

- 预览今天会发出去的日报
- 配置飞书自定义机器人、GitHub 组织或仓库、推送时间
- 立刻补发一条到群里
- 查看最近的推送记录

没有配置仓库时，页面会先用演示数据，方便你看清卡片长什么样。

## 在飞书群里加机器人

1. 打开要接收日报的飞书群
2. 群设置 → **群机器人** → **添加机器人** → 选择 **自定义机器人**
3. 起个名字，例如「开源日报」
4. 复制 Webhook 地址
5. 如果开启了签名校验，把密钥也复制下来
6. 把地址填进本工具的「配置」页，点 **发送测试消息**

飞书官方说明：[自定义机器人使用指南](https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot)

## 本地运行

需要 Node.js 22+。

```bash
cp .env.example .env
npm install
npm run dev
```

浏览器打开 [http://127.0.0.1:43123](http://127.0.0.1:43123)。

服务保持运行时，会按配置的时区和时刻自动推送（默认每天 09:00，`Asia/Shanghai`）。

## 配置项

可以在网页里保存，也可以用环境变量（环境变量优先）：

| 变量 | 含义 |
| --- | --- |
| `FEISHU_WEBHOOK_URL` | 飞书自定义机器人 Webhook |
| `FEISHU_WEBHOOK_SECRET` | 可选，签名密钥 |
| `GITHUB_ORG` | GitHub 组织名 |
| `GITHUB_REPOS` | 仓库列表，逗号或空格分隔，例如 `acme/sdk acme/cli` |
| `GITHUB_TOKEN` | 可选 PAT。公开仓库可不填；私有仓库或避免限流时建议填写，权限只需 `repo` 只读 |
| `DIGEST_TITLE` | 卡片标题，默认「开源日报」 |
| `SCHEDULE_TZ` / `SCHEDULE_HOUR` / `SCHEDULE_MINUTE` | 定时推送时区与时刻 |
| `CRON_SECRET` | 调用 `/api/cron` 时的 Bearer Token |

网页里保存的配置写在 `data/settings.json`，不要提交到 Git。

## 三种定时方式

1. **进程内定时**（默认）：`npm run dev` 或 `npm start` 一直开着，到点自动发。
2. **外部 Cron**：每小时或每天请求一次：

   ```bash
   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
     https://your-host/api/cron
   ```

   立刻补发（忽略是否到点）：

   ```bash
   curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
     "https://your-host/api/cron?force=1"
   ```

3. **GitHub Actions**：仓库已包含 `.github/workflows/daily-digest.yml`，默认每天 09:00（UTC 01:00）。在仓库 Secrets 中配置 `FEISHU_WEBHOOK_URL`，在 Variables 中配置 `GITHUB_ORG` 或 `GITHUB_REPOS`。不需要先把网站部署上线。

也可以在任意机器上：

```bash
npm run digest:send
```

## Docker

```bash
cp .env.example .env
docker compose up --build -d
```

数据目录 `./data` 会挂进容器，配置和推送记录会保留。

## 日报里有什么

默认统计过去 24 小时：

- 新打开的 Issue
- 新打开的 Pull Request
- 已合并的 PR
- 已关闭的 Issue

可以在配置页开关每一类，并限制每类最多列出几条。超过的会在飞书卡片里提示「还有 N 条未列出」。
