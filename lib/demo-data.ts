import type { Digest, DigestItem } from "@/lib/types";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function item(
  partial: Omit<DigestItem, "updatedAt" | "state"> & {
    state?: string;
    updatedAt?: string;
  },
): DigestItem {
  return {
    state: "open",
    updatedAt: partial.createdAt,
    ...partial,
  };
}

export function buildDemoDigest(lookbackHours: number, title = "开源日报"): Digest {
  const until = new Date();
  const since = new Date(until.getTime() - lookbackHours * 60 * 60 * 1000);
  return {
    title,
    generatedAt: until.toISOString(),
    since: since.toISOString(),
    until: until.toISOString(),
    lookbackHours,
    sourceLabel: "演示仓库 acme/*",
    demo: true,
    warning:
      "当前展示的是演示数据。配置 GitHub 组织或仓库后，会拉取真实的 Issue 与 PR。",
    newIssues: [
      item({
        type: "issue",
        number: 128,
        title: "文档站夜间模式对比度不足，代码块几乎不可读",
        url: "https://github.com/acme/docs/issues/128",
        repo: "acme/docs",
        author: "lin-yu",
        createdAt: hoursAgo(3),
      }),
      item({
        type: "issue",
        number: 86,
        title: "Windows 下安装脚本没有正确检测 Python 3.12",
        url: "https://github.com/acme/cli/issues/86",
        repo: "acme/cli",
        author: "sara-k",
        createdAt: hoursAgo(7),
      }),
      item({
        type: "issue",
        number: 41,
        title: "希望 SDK 增加超时重试的官方示例",
        url: "https://github.com/acme/sdk-js/issues/41",
        repo: "acme/sdk-js",
        author: "hao",
        createdAt: hoursAgo(18),
      }),
    ],
    newPulls: [
      item({
        type: "pull",
        number: 204,
        title: "feat: 支持按仓库过滤日报内容",
        url: "https://github.com/acme/gateway/pull/204",
        repo: "acme/gateway",
        author: "mina",
        createdAt: hoursAgo(5),
      }),
      item({
        type: "pull",
        number: 97,
        title: "fix: 修复 webhook 验签在整分边界失败的问题",
        url: "https://github.com/acme/bot/pull/97",
        repo: "acme/bot",
        author: "chenwei",
        createdAt: hoursAgo(11),
      }),
    ],
    mergedPulls: [
      item({
        type: "pull",
        number: 188,
        title: "docs: 补充飞书自定义机器人接入步骤",
        url: "https://github.com/acme/bot/pull/188",
        repo: "acme/bot",
        author: "nana",
        state: "closed",
        createdAt: hoursAgo(30),
        mergedAt: hoursAgo(4),
        closedAt: hoursAgo(4),
      }),
    ],
    closedIssues: [
      item({
        type: "issue",
        number: 12,
        title: "README 中的徽章链接 404",
        url: "https://github.com/acme/sdk-js/issues/12",
        repo: "acme/sdk-js",
        author: "guest",
        state: "closed",
        createdAt: hoursAgo(80),
        closedAt: hoursAgo(9),
      }),
    ],
    openIssues: [
      item({
        type: "issue",
        number: 18,
        title: "需要更好的日志，方便排查仿真失败",
        url: "https://github.com/acme/sdk-js/issues/18",
        repo: "acme/sdk-js",
        author: "dave",
        createdAt: hoursAgo(80),
        updatedAt: hoursAgo(72),
      }),
      item({
        type: "issue",
        number: 9,
        title: "窗口缩放后渲染错位",
        url: "https://github.com/acme/cli/issues/9",
        repo: "acme/cli",
        author: "eve",
        createdAt: hoursAgo(240),
        updatedAt: hoursAgo(168),
      }),
    ],
    openPulls: [
      item({
        type: "pull",
        number: 30,
        title: "WIP: 多线程求解",
        url: "https://github.com/acme/gateway/pull/30",
        repo: "acme/gateway",
        author: "frank",
        createdAt: hoursAgo(96),
        updatedAt: hoursAgo(30),
      }),
    ],
    openIssueTotal: 12,
    openPullTotal: 5,
    allIssuesUrl: "https://github.com/acme/docs/issues",
    allPullsUrl: "https://github.com/acme/docs/pulls",
  };
}
