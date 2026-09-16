import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { assertWebhook } from "@/lib/feishu";
import {
  isValidGithubOrg,
  isValidGithubRepo,
  parseGithubSource,
  parseRepoList,
} from "@/lib/github-source";
import type { AppSettings, Digest, PublicSettings, SendLog } from "@/lib/types";
import { UNCHANGED } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const settingsPath = path.join(dataDir, "settings.json");
const logsPath = path.join(dataDir, "logs.json");
const digestPath = path.join(dataDir, "last-digest.json");
const scheduleStatePath = path.join(dataDir, "schedule-state.json");

export const defaultSettings = (): AppSettings => ({
  digestTitle: "开源日报",
  sources: {
    mode: "org",
    org: "",
    repos: [],
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
});

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function applyGithubSource(settings: AppSettings) {
  const parsedOrg = parseGithubSource(settings.sources.org);
  if (parsedOrg.repo && settings.sources.mode === "org") {
    settings.sources.mode = "repos";
    settings.sources.repos = [
      parsedOrg.repo,
      ...settings.sources.repos.filter((repo) => repo !== parsedOrg.repo),
    ];
    settings.sources.org = parsedOrg.org;
  } else {
    settings.sources.org = parsedOrg.org;
  }
  settings.sources.repos = settings.sources.repos
    .map((repo) => parseGithubSource(repo).repo ?? "")
    .filter(Boolean);
}

function envSettingsOverlay(base: AppSettings): AppSettings {
  const next: AppSettings = structuredClone(base);
  if (process.env.GITHUB_TOKEN) next.githubToken = process.env.GITHUB_TOKEN;
  if (process.env.FEISHU_APP_ID) next.feishu.appId = process.env.FEISHU_APP_ID;
  if (process.env.FEISHU_APP_SECRET) {
    next.feishu.appSecret = process.env.FEISHU_APP_SECRET;
  }
  if (process.env.FEISHU_CHAT_ID) next.feishu.chatId = process.env.FEISHU_CHAT_ID;
  if (process.env.FEISHU_WEBHOOK_URL) {
    next.feishu.webhookUrl = process.env.FEISHU_WEBHOOK_URL;
  }
  if (process.env.FEISHU_WEBHOOK_SECRET) {
    next.feishu.secret = process.env.FEISHU_WEBHOOK_SECRET;
  }
  const org = process.env.OSS_ORG || process.env.GITHUB_ORG;
  if (org) {
    const parsed = parseGithubSource(org);
    if (parsed.repo) {
      next.sources.mode = "repos";
      next.sources.repos = [parsed.repo];
      next.sources.org = parsed.org;
    } else if (parsed.org) {
      next.sources.mode = "org";
      next.sources.org = parsed.org;
    }
  }
  const envRepos = parseRepoList(process.env.OSS_REPOS || process.env.GITHUB_REPOS);
  if (envRepos.length > 0) {
    next.sources.mode = "repos";
    next.sources.repos = envRepos;
  }
  if (process.env.DIGEST_TITLE) next.digestTitle = process.env.DIGEST_TITLE;
  if (process.env.LOOKBACK_HOURS) {
    const hours = Number(process.env.LOOKBACK_HOURS);
    if (Number.isFinite(hours) && hours > 0) next.lookbackHours = hours;
  }
  if (process.env.SCHEDULE_TZ) next.schedule.timezone = process.env.SCHEDULE_TZ;
  if (process.env.SCHEDULE_HOUR) {
    const hour = Number(process.env.SCHEDULE_HOUR);
    if (Number.isFinite(hour)) next.schedule.hour = hour;
  }
  if (process.env.SCHEDULE_MINUTE) {
    const minute = Number(process.env.SCHEDULE_MINUTE);
    if (Number.isFinite(minute)) next.schedule.minute = minute;
  }
  return next;
}

export async function readStoredSettings(): Promise<AppSettings> {
  const stored = await readJson<Partial<AppSettings>>(
    settingsPath,
    defaultSettings(),
  );
  return {
    ...defaultSettings(),
    ...stored,
    sources: { ...defaultSettings().sources, ...stored.sources },
    include: { ...defaultSettings().include, ...stored.include },
    feishu: { ...defaultSettings().feishu, ...stored.feishu },
    schedule: { ...defaultSettings().schedule, ...stored.schedule },
  };
}

export async function getSettings(): Promise<AppSettings> {
  return envSettingsOverlay(await readStoredSettings());
}

export type SettingsPatch = {
  digestTitle?: string;
  sources?: AppSettings["sources"];
  lookbackHours?: number;
  include?: AppSettings["include"];
  maxItemsPerSection?: number;
  githubToken?: string;
  feishu?: {
    webhookUrl?: string;
    secret?: string;
    appId?: string;
    appSecret?: string;
    chatId?: string;
  };
  schedule?: Partial<AppSettings["schedule"]>;
};

export async function saveSettings(patch: SettingsPatch) {
  await ensureDataDir();
  const current = await readStoredSettings();
  const next: AppSettings = {
    ...current,
    ...patch,
    sources: { ...current.sources, ...patch.sources },
    include: { ...current.include, ...patch.include },
    feishu: { ...current.feishu, ...patch.feishu },
    schedule: { ...current.schedule, ...patch.schedule },
  };

  if (patch.githubToken === UNCHANGED || patch.githubToken === undefined) {
    next.githubToken = current.githubToken;
  }
  if (
    patch.feishu?.webhookUrl === UNCHANGED ||
    patch.feishu?.webhookUrl === undefined
  ) {
    next.feishu.webhookUrl = current.feishu.webhookUrl;
  }
  if (patch.feishu?.secret === UNCHANGED || patch.feishu?.secret === undefined) {
    next.feishu.secret = current.feishu.secret;
  }
  if (patch.feishu?.appId === UNCHANGED || patch.feishu?.appId === undefined) {
    next.feishu.appId = current.feishu.appId;
  }
  if (
    patch.feishu?.appSecret === UNCHANGED ||
    patch.feishu?.appSecret === undefined
  ) {
    next.feishu.appSecret = current.feishu.appSecret;
  }
  if (patch.feishu?.chatId === UNCHANGED || patch.feishu?.chatId === undefined) {
    next.feishu.chatId = current.feishu.chatId;
  }

  applyGithubSource(next);
  if (next.sources.org && !isValidGithubOrg(next.sources.org)) {
    throw new Error("GitHub 组织或用户名格式不正确。填 PhyAgentOS 这样的名字，不要只贴网页链接里的无关路径。");
  }
  for (const repo of next.sources.repos) {
    if (!isValidGithubRepo(repo)) {
      throw new Error(`仓库名格式不正确：${repo}，请使用 owner/repo，例如 PhyAgentOS/PhyAgentOS-core。`);
    }
  }
  next.githubToken = next.githubToken.trim();
  next.feishu.webhookUrl = next.feishu.webhookUrl.trim();
  next.feishu.secret = next.feishu.secret.trim();
  next.feishu.appId = next.feishu.appId.trim();
  next.feishu.appSecret = next.feishu.appSecret.trim();
  next.feishu.chatId = next.feishu.chatId.trim();
  if (next.feishu.webhookUrl) {
    assertWebhook(next.feishu.webhookUrl);
  }
  next.schedule.hour = Math.min(23, Math.max(0, Number(next.schedule.hour) || 0));
  next.schedule.minute = Math.min(
    59,
    Math.max(0, Number(next.schedule.minute) || 0),
  );
  next.lookbackHours = Math.min(
    168,
    Math.max(1, Number(next.lookbackHours) || 24),
  );
  next.maxItemsPerSection = Math.min(
    20,
    Math.max(3, Number(next.maxItemsPerSection) || 8),
  );

  await writeFile(settingsPath, JSON.stringify(next, null, 2), "utf8");
  return envSettingsOverlay(next);
}

function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 18)}••••${value.slice(-4)}`;
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const settings = await getSettings();
  return {
    digestTitle: settings.digestTitle,
    sources: settings.sources,
    lookbackHours: settings.lookbackHours,
    include: settings.include,
    maxItemsPerSection: settings.maxItemsPerSection,
    schedule: settings.schedule,
    githubTokenConfigured: Boolean(settings.githubToken),
    githubTokenFromEnv: Boolean(process.env.GITHUB_TOKEN),
    feishu: {
      webhookUrlMasked: maskSecret(settings.feishu.webhookUrl),
      webhookConfigured: Boolean(settings.feishu.webhookUrl),
      webhookFromEnv: Boolean(process.env.FEISHU_WEBHOOK_URL),
      secretConfigured: Boolean(settings.feishu.secret),
      secretFromEnv: Boolean(process.env.FEISHU_WEBHOOK_SECRET),
      appIdMasked: maskSecret(settings.feishu.appId),
      appConfigured: Boolean(settings.feishu.appId && settings.feishu.appSecret),
      appFromEnv: Boolean(process.env.FEISHU_APP_ID),
      appSecretConfigured: Boolean(settings.feishu.appSecret),
      chatId: settings.feishu.chatId,
      chatIdFromEnv: Boolean(process.env.FEISHU_CHAT_ID),
      ready: Boolean(
        (settings.feishu.appId && settings.feishu.appSecret) ||
          settings.feishu.webhookUrl,
      ),
    },
  };
}

export async function readLogs(): Promise<SendLog[]> {
  const logs = await readJson<SendLog[]>(logsPath, []);
  return logs.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

export async function appendLog(log: SendLog) {
  await ensureDataDir();
  const logs = await readLogs();
  logs.unshift(log);
  await writeFile(logsPath, JSON.stringify(logs.slice(0, 100), null, 2), "utf8");
}

export async function saveLastDigest(digest: Digest) {
  await ensureDataDir();
  await writeFile(digestPath, JSON.stringify(digest, null, 2), "utf8");
}

export async function readLastDigest(): Promise<Digest | null> {
  return readJson<Digest | null>(digestPath, null);
}

export type ScheduleState = {
  lastScheduledDate?: string;
  lastSuccessDate?: string;
};

export async function readScheduleState(): Promise<ScheduleState> {
  return readJson<ScheduleState>(scheduleStatePath, {});
}

export async function writeScheduleState(state: ScheduleState) {
  await ensureDataDir();
  await writeFile(scheduleStatePath, JSON.stringify(state, null, 2), "utf8");
}

export function sourcesConfigured(settings: AppSettings) {
  if (settings.sources.mode === "org") return Boolean(settings.sources.org);
  return settings.sources.repos.length > 0;
}
