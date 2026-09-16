import { createHmac } from "node:crypto";
import type { AppSettings, Digest, DigestItem } from "@/lib/types";
import { formatRelativeZh, formatZhDate } from "@/lib/time";

export function signFeishu(secret: string, timestampSeconds: number) {
  const stringToSign = `${timestampSeconds}\n${secret}`;
  return createHmac("sha256", stringToSign).digest("base64");
}

function escapeMd(text: string) {
  return text.replace(/[\[\]\(\)]/g, " ").replace(/\s+/g, " ").trim();
}

function formatItem(item: DigestItem, kind: "today" | "open") {
  const title = escapeMd(item.title);
  const link = `[#${item.number} ${title}](${item.url})`;
  if (kind === "open") {
    return `${link} · ${formatRelativeZh(item.updatedAt)}`;
  }
  return `${link} · @${item.author}`;
}

function section(
  title: string,
  items: DigestItem[],
  max: number,
  kind: "today" | "open",
  total = items.length,
) {
  if (total === 0 && items.length === 0) return "";
  const shown = items.slice(0, max);
  const hidden = Math.max(0, total - shown.length);
  const extra = hidden > 0 ? `\n…还有 ${hidden} 条未列出` : "";
  const count =
    total > shown.length ? `${total}，列出 ${shown.length} 条` : `${total || shown.length}`;
  return `**${title}（${count}）**\n${shown.map((item) => formatItem(item, kind)).join("\n")}${extra}`;
}

export function digestSummary(digest: Digest) {
  return {
    newIssues: digest.newIssues.length,
    newPulls: digest.newPulls.length,
    mergedPulls: digest.mergedPulls.length,
    closedIssues: digest.closedIssues.length,
  };
}

export function isTodayEmpty(digest: Digest) {
  const summary = digestSummary(digest);
  return (
    summary.newIssues +
      summary.newPulls +
      summary.mergedPulls +
      summary.closedIssues ===
    0
  );
}

export function isDigestEmpty(digest: Digest) {
  return (
    isTodayEmpty(digest) &&
    (digest.openIssues?.length ?? 0) === 0 &&
    (digest.openPulls?.length ?? 0) === 0
  );
}

export function buildFeishuCard(settings: AppSettings, digest: Digest) {
  const dateLabel = formatZhDate(new Date(digest.until), settings.schedule.timezone);
  const summary = digestSummary(digest);
  const max = settings.maxItemsPerSection;
  const headerTitle = `${digest.title} · ${dateLabel}`;
  const todayEmpty = isTodayEmpty(digest);
  const empty = isDigestEmpty(digest);

  const todaySections = [
    settings.include.newIssues
      ? section("新 Issue", digest.newIssues, max, "today")
      : "",
    settings.include.newPulls ? section("新 PR", digest.newPulls, max, "today") : "",
    settings.include.mergedPulls
      ? section("已合并 PR", digest.mergedPulls, max, "today")
      : "",
    settings.include.closedIssues
      ? section("已关闭 Issue", digest.closedIssues, max, "today")
      : "",
  ].filter(Boolean);

  const openSections = [
    section(
      "未关闭 Issue",
      digest.openIssues ?? [],
      max,
      "open",
      digest.openIssueTotal ?? digest.openIssues?.length ?? 0,
    ),
    section(
      "未合并 PR",
      digest.openPulls ?? [],
      max,
      "open",
      digest.openPullTotal ?? digest.openPulls?.length ?? 0,
    ),
  ].filter(Boolean);

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

  if (todayEmpty) {
    elements.push({
      tag: "div",
      text: {
        tag: "lark_md",
        content: empty
          ? "今日关注的仓库很安静，没有新的 Issue 或 PR，也没有仍未关闭的条目。"
          : "今日关注的仓库没有新增 Issue 或 PR。",
      },
    });
  } else {
    elements.push({
      tag: "div",
      text: { tag: "lark_md", content: "**今日动态**" },
    });
    for (const block of todaySections) {
      elements.push({
        tag: "div",
        text: { tag: "lark_md", content: block },
      });
    }
  }

  if (openSections.length > 0) {
    elements.push({ tag: "hr" });
    elements.push({
      tag: "div",
      text: {
        tag: "lark_md",
        content: "**仍未关闭（不含今日新建）**",
      },
    });
    for (const block of openSections) {
      elements.push({
        tag: "div",
        text: { tag: "lark_md", content: block },
      });
    }
  }

  if (digest.allIssuesUrl || digest.allPullsUrl) {
    const links = [
      digest.allIssuesUrl ? `[全部 Issue](${digest.allIssuesUrl})` : "",
      digest.allPullsUrl ? `[全部 PR](${digest.allPullsUrl})` : "",
    ]
      .filter(Boolean)
      .join("  ·  ");
    elements.push({
      tag: "div",
      text: { tag: "lark_md", content: links },
    });
  }

  elements.push({ tag: "hr" });
  elements.push({
    tag: "note",
    elements: [
      {
        tag: "plain_text",
        content: "点标题打开 GitHub 对应页面。由开源日报机器人自动推送。",
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
              "机器人已经可以往这个群发消息。之后会按设定时间，把公司开源仓库的 **Issue** 和 **PR** 汇总推到这里。",
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

export function feishuReady(settings: AppSettings) {
  return Boolean(
    (settings.feishu.appId && settings.feishu.appSecret) ||
      settings.feishu.webhookUrl,
  );
}

function openBase() {
  return (process.env.FEISHU_BASE_URL || "https://open.feishu.cn").replace(
    /\/$/,
    "",
  );
}

type FeishuApiResponse = {
  code?: number;
  msg?: string;
  tenant_access_token?: string;
  data?: {
    items?: { chat_id: string; name?: string }[];
    message_id?: string;
  };
};

async function feishuApi(
  path: string,
  init: RequestInit & { token?: string } = {},
) {
  const { token, headers, ...rest } = init;
  const response = await fetch(`${openBase()}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const json = (await response.json()) as FeishuApiResponse;
  if ((json.code ?? (response.ok ? 0 : -1)) !== 0) {
    throw new Error(json.msg || `飞书接口失败（${json.code ?? response.status}）`);
  }
  return json;
}

async function getTenantAccessToken(appId: string, appSecret: string) {
  const json = await feishuApi("/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  if (!json.tenant_access_token) {
    throw new Error("飞书没有返回 tenant_access_token，请检查 App ID / App Secret。");
  }
  return json.tenant_access_token;
}

export async function listFeishuChats(settings: AppSettings) {
  if (!settings.feishu.appId || !settings.feishu.appSecret) {
    throw new Error("请先填写飞书开放平台的 App ID 和 App Secret。");
  }
  const token = await getTenantAccessToken(
    settings.feishu.appId,
    settings.feishu.appSecret,
  );
  const json = await feishuApi("/open-apis/im/v1/chats?page_size=50", { token });
  return (json.data?.items ?? []).map((item) => ({
    chatId: item.chat_id,
    name: item.name || item.chat_id,
  }));
}

async function resolveChatId(settings: AppSettings, token: string) {
  if (settings.feishu.chatId) return settings.feishu.chatId;
  const json = await feishuApi("/open-apis/im/v1/chats?page_size=50", { token });
  const chats = json.data?.items ?? [];
  if (chats.length === 0) {
    throw new Error(
      "机器人还没有加入任何群。请在目标群里添加这个应用，然后再试。",
    );
  }
  if (chats.length === 1) return chats[0].chat_id;
  const names = chats
    .map((chat) => `${chat.name || "未命名"}（${chat.chat_id}）`)
    .join("、");
  throw new Error(`机器人在多个群里，请填写 Chat ID。当前所在群：${names}`);
}

async function sendCardViaApp(settings: AppSettings, card: unknown) {
  const token = await getTenantAccessToken(
    settings.feishu.appId,
    settings.feishu.appSecret,
  );
  const chatId = await resolveChatId(settings, token);
  await feishuApi(`/open-apis/im/v1/messages?receive_id_type=chat_id`, {
    method: "POST",
    token,
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: "interactive",
      content: JSON.stringify(card),
    }),
  });
}

async function sendPayload(settings: AppSettings, payload: { msg_type: string; card: unknown }) {
  if (settings.feishu.appId && settings.feishu.appSecret) {
    await sendCardViaApp(settings, payload.card);
    return;
  }
  if (settings.feishu.webhookUrl) {
    await postToFeishu(settings.feishu.webhookUrl, settings.feishu.secret, payload);
    return;
  }
  throw new Error(
    "还没有配置飞书。请填写开放平台 App ID / App Secret，或自定义机器人 Webhook。",
  );
}

export async function sendDigestCard(settings: AppSettings, digest: Digest) {
  await sendPayload(settings, {
    msg_type: "interactive",
    card: buildFeishuCard(settings, digest),
  });
}

export async function sendTestMessage(settings: AppSettings) {
  await sendPayload(settings, buildTestCard());
}
