export type SourceMode = "org" | "repos";

export type IncludeConfig = {
  newIssues: boolean;
  newPulls: boolean;
  mergedPulls: boolean;
  closedIssues: boolean;
};

export type AppSettings = {
  digestTitle: string;
  sources: {
    mode: SourceMode;
    org: string;
    repos: string[];
  };
  lookbackHours: number;
  include: IncludeConfig;
  maxItemsPerSection: number;
  githubToken: string;
  feishu: {
    webhookUrl: string;
    secret: string;
    appId: string;
    appSecret: string;
    chatId: string;
  };
  schedule: {
    enabled: boolean;
    timezone: string;
    hour: number;
    minute: number;
    skipIfSentToday: boolean;
  };
};

export type PublicSettings = Omit<AppSettings, "githubToken" | "feishu"> & {
  githubTokenConfigured: boolean;
  githubTokenFromEnv: boolean;
  feishu: {
    webhookUrlMasked: string;
    webhookConfigured: boolean;
    webhookFromEnv: boolean;
    secretConfigured: boolean;
    secretFromEnv: boolean;
    appIdMasked: string;
    appConfigured: boolean;
    appFromEnv: boolean;
    appSecretConfigured: boolean;
    chatId: string;
    chatIdFromEnv: boolean;
    ready: boolean;
  };
};

export type DigestItem = {
  type: "issue" | "pull";
  number: number;
  title: string;
  url: string;
  repo: string;
  author: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  mergedAt?: string;
};

export type Digest = {
  title: string;
  generatedAt: string;
  since: string;
  until: string;
  lookbackHours: number;
  sourceLabel: string;
  demo: boolean;
  warning?: string;
  newIssues: DigestItem[];
  newPulls: DigestItem[];
  mergedPulls: DigestItem[];
  closedIssues: DigestItem[];
};

export type SendTrigger = "manual" | "schedule" | "cron" | "cli" | "test";

export type SendLog = {
  id: string;
  sentAt: string;
  trigger: SendTrigger;
  status: "success" | "failed" | "skipped";
  message: string;
  demo: boolean;
  summary: {
    newIssues: number;
    newPulls: number;
    mergedPulls: number;
    closedIssues: number;
  };
};

export const UNCHANGED = "__UNCHANGED__";

export type DashboardStatus = {
  feishuConfigured: boolean;
  webhookConfigured: boolean;
  githubConfigured: boolean;
  scheduleEnabled: boolean;
  timezone: string;
  sendTime: string;
  nextRunAt: string;
  nextRunLabel: string;
  lastSuccessAt: string | null;
  lastSuccessLabel: string | null;
  digestTitle: string;
};
