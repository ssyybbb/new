import { createHmac } from "node:crypto";
import type { AppSettings, Digest, DigestItem } from "@/lib/types";
import { formatZhDate } from "@/lib/time";

export function signFeishu(secret: string, timestampSeconds: number) {
  const stringToSign = `${timestampSeconds}\n${secret}`;
  return createHmac("sha256", stringToSign).digest("base64");
}

function escapeMd(text: string) {
  return text.replace(/[\[\]\(\)]/g, " ").replace(/\s+/g, " ").trim();
}

function formatItem(item: DigestItem) {
  const title = escapeMd(item.title);
  return `[#${item.number} ${title}](${item.url}) · \`${item.repo}\` · @${item.author}`;
}

function section(title: string, items: DigestItem[], max: number) {
  if (items.length === 0) return "";
  const shown = items.slice(0, max);
  const extra =
    items.length > max ? `\n…还有 ${items.length - max} 条未列出` : "";
  return `**${title}（${items.length}）**\n${shown.map((item) => formatItem(item)).join("\n")}${extra}`;
}

export function digestSummary(digest: Digest) {
  return {
    newIssues: digest.newIssues.length,
    newPulls: digest.newPulls.length,
    mergedPulls: digest.mergedPulls.length,
    closedIssues: digest.closedIssues.length,
  };
}

export function isDigestEmpty(digest: Digest) {
  const summary = digestSummary(digest);
  return (
    summary.newIssues +
      summary.newPulls +
      summary.mergedPulls +
      summary.closedIssues ===
    0
  );
}

export function buildFeishuCard(settings: AppSettings, digest: Digest) {
  const dateLabel = formatZhDate(new Date(digest.until), settings.schedule.timezone);
  const summary = digestSummary(digest);
  const max = settings.maxItemsPerSection;
  const headerTitle = `${digest.title} · ${dateLabel}`;

  const bodySections = [
    settings.include.newIssues
      ? section("新 Issue", digest.newIssues, max)
      : "",
    settings.include.newPulls ? section("新 PR", digest.newPulls, max) : "",
    settings.include.mergedPulls
      ? section("已合并 PR", digest.mergedPulls, max)
      : "",
    settings.include.closedIssues
      ? section("已关闭 Issue", digest.closedIssues, max)
      : "",
  ].filter(Boolean);

  const empty = isDigestEmpty(digest);
  const elements: Record<string, unknown>[] = [
    {
      tag: "div",
      text: {
        tag: "lark_md",
        content: `统计周期：过去 **${digest.lookbackHours} 小时** · ${digest.sourceLabel}${digest.demo ? " · 演示数据" : ""}`,
      },
    },
    {
      tag: "div",
      fields: [
        {
          is_short: true,
          text: { tag: "lark_md", content: `**新 Issue**\n${summary.newIssues}` },
        },
        {
          is_short: true,
          text: { tag: "lark_md", content: `**新 PR**\n${summary.newPulls}` },
        },
        {
          is_short: true,
          text: {
            tag: "lark_md",
            content: `**已合并**\n${summary.mergedPulls}`,
          },
        },
        {
          is_short: true,
          text: {
            tag: "lark_md",
            content: `**已关闭**\n${summary.closedIssues}`,
          },
        },
      ],
    },
    { tag: "hr" },
  ];

  if (empty) {
    elements.push({
      tag: "div",
      text: {
        tag: "lark_md",
        content: "今日关注的仓库很安静，没有新的 Issue 或 PR。",
      },
    });
  } else {
    for (const block of bodySections) {
      elements.push({
        tag: "div",
        text: { tag: "lark_md", content: block },
      });
    }
  }

  elements.push({ tag: "hr" });
  elements.push({
    tag: "note",
    elements: [
      {
        tag: "plain_text",
        content: "由开源日报机器人自动推送。可在控制台预览或立即补发。",
      },
    ],
  });

  return {
    config: { wide_screen_mode: true },
    header: {
      template: empty ? "grey" : "blue",
      title: { tag: "plain_text", content: headerTitle },
    },
    elements,
  };
}

export function buildTestCard() {
  return {
    msg_type: "interactive" as const,
    card: {
      config: { wide_screen_mode: true },
      header: {
        template: "turquoise",
        title: { tag: "plain_text", content: "开源日报机器人已接入" },
      },
      elements: [
        {
          tag: "div",
          text: {
            tag: "lark_md",
            content:
              "群里的自定义机器人已经可以收到消息。之后会按设定时间，把公司开源仓库的 **Issue** 和 **PR** 汇总推到这里。",
          },
        },
        {
          tag: "note",
          elements: [
            {
              tag: "plain_text",
              content: "这是一条测试消息，可以忽略。",
            },
          ],
        },
      ],
    },
  };
}

export function assertWebhook(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("飞书 Webhook 地址格式不正确。");
  }
  const host = parsed.hostname;
  const allowed =
    host === "open.feishu.cn" ||
    host === "open.larksuite.com" ||
    host.endsWith(".feishu.cn") ||
    host.endsWith(".larksuite.com");
  if (!allowed) {
    throw new Error("Webhook 必须是飞书 / Lark 开放平台地址。");
  }
  if (!parsed.pathname.includes("/hook/")) {
    throw new Error("这不像自定义机器人的 Webhook，请从群机器人设置里复制完整链接。");
  }
}

export async function postToFeishu(
  webhookUrl: string,
  secret: string,
  payload: Record<string, unknown>,
) {
  assertWebhook(webhookUrl);
  const body: Record<string, unknown> = { ...payload };
  if (secret) {
    const timestamp = Math.floor(Date.now() / 1000);
    body.timestamp = String(timestamp);
    body.sign = signFeishu(secret, timestamp);
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json: { code?: number; msg?: string; StatusCode?: number; StatusMessage?: string } = {};
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(`飞书返回了无法解析的响应：${text.slice(0, 180)}`);
  }
  const code = json.code ?? json.StatusCode ?? (response.ok ? 0 : -1);
  if (code !== 0) {
    throw new Error(json.msg || json.StatusMessage || `飞书推送失败（code ${code}）`);
  }
  return json;
}

export async function sendDigestCard(settings: AppSettings, digest: Digest) {
  const card = buildFeishuCard(settings, digest);
  await postToFeishu(settings.feishu.webhookUrl, settings.feishu.secret, {
    msg_type: "interactive",
    card,
  });
}

export async function sendTestMessage(settings: AppSettings) {
  await postToFeishu(
    settings.feishu.webhookUrl,
    settings.feishu.secret,
    buildTestCard(),
  );
}
