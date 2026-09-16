import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDemoDigest } from "./demo-data";
import { buildFeishuCard, isDigestEmpty, isTodayEmpty } from "./feishu";
import { githubCatalogUrls, pickBacklog } from "./github";
import { formatRelativeZh } from "./time";
import type { AppSettings, DigestItem } from "./types";

function baseSettings(): AppSettings {
  return {
    digestTitle: "开源日报",
    sources: {
      mode: "repos",
      org: "",
      repos: ["PhyAgentOS/PhyAgentOS-core"],
    },
    lookbackHours: 24,
    include: {
      newIssues: true,
      newPulls: true,
      mergedPulls: true,
      closedIssues: true,
    },
    maxItemsPerSection: 8,
    githubToken: "",
    feishu: {
      webhookUrl: "",
      secret: "",
      appId: "",
      appSecret: "",
      chatId: "",
    },
    schedule: {
      enabled: true,
      timezone: "Asia/Shanghai",
      hour: 9,
      minute: 0,
      skipIfSentToday: true,
    },
  };
}

function issue(number: number, title: string): DigestItem {
  return {
    type: "issue",
    number,
    title,
    url: `https://github.com/PhyAgentOS/PhyAgentOS-core/issues/${number}`,
    repo: "PhyAgentOS/PhyAgentOS-core",
    author: "alice",
    state: "open",
    createdAt: "2026-09-10T00:00:00.000Z",
    updatedAt: "2026-09-13T00:00:00.000Z",
  };
}

describe("formatRelativeZh", () => {
  it("uses days for updates within a week", () => {
    const now = new Date("2026-09-16T00:00:00.000Z");
    assert.equal(formatRelativeZh("2026-09-13T00:00:00.000Z", now), "3 天前更新");
  });
});

describe("pickBacklog", () => {
  it("drops today's new items and keeps the older open ones", () => {
    const result = pickBacklog(
      [issue(42, "today"), issue(18, "older")],
      [issue(42, "today")],
      12,
      8,
    );
    assert.deepEqual(
      result.items.map((item) => item.number),
      [18],
    );
    assert.equal(result.total, 11);
  });
});

describe("githubCatalogUrls", () => {
  it("points a single repo at issues and pulls pages", () => {
    assert.deepEqual(githubCatalogUrls(baseSettings()), {
      issues: "https://github.com/PhyAgentOS/PhyAgentOS-core/issues",
      pulls: "https://github.com/PhyAgentOS/PhyAgentOS-core/pulls",
    });
  });
});

describe("buildFeishuCard", () => {
  it("renders clickable titles and a still-open section", () => {
    const digest = buildDemoDigest(24);
    const card = buildFeishuCard(baseSettings(), digest);
    const text = JSON.stringify(card);
    assert.match(text, /\[#128 .+\]\(https:\/\/github.com\/acme\/docs\/issues\/128\)/);
    assert.match(text, /\*\*仍未关闭（不含今日新建）\*\*/);
    assert.match(text, /\[全部 Issue\]\(https:\/\/github.com\/acme\/docs\/issues\)/);
    assert.equal(isTodayEmpty(digest), false);
    assert.equal(isDigestEmpty(digest), false);
  });

  it("keeps backlog on a quiet day", () => {
    const digest = buildDemoDigest(24);
    digest.newIssues = [];
    digest.newPulls = [];
    digest.mergedPulls = [];
    digest.closedIssues = [];
    assert.equal(isTodayEmpty(digest), true);
    assert.equal(isDigestEmpty(digest), false);
    const text = JSON.stringify(buildFeishuCard(baseSettings(), digest));
    assert.match(text, /今日关注的仓库没有新增 Issue 或 PR/);
    assert.match(text, /未关闭 Issue/);
  });
});
