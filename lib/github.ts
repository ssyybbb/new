import type { AppSettings, Digest, DigestItem } from "@/lib/types";

type SearchItem = {
  html_url: string;
  title: string;
  number: number;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user: { login: string } | null;
  repository_url: string;
  pull_request?: {
    url: string;
    html_url: string;
    merged_at?: string | null;
  };
};

type SearchResponse = {
  total_count: number;
  incomplete_results: boolean;
  items: SearchItem[];
};

function repoFromUrl(repositoryUrl: string) {
  const parts = repositoryUrl.split("/repos/");
  return parts[1] ?? repositoryUrl;
}

function toItem(item: SearchItem, type: DigestItem["type"]): DigestItem {
  return {
    type,
    number: item.number,
    title: item.title,
    url: item.html_url,
    repo: repoFromUrl(item.repository_url),
    author: item.user?.login ?? "unknown",
    state: item.state,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    closedAt: item.closed_at ?? undefined,
    mergedAt: item.pull_request?.merged_at ?? undefined,
  };
}

function afterIso(iso: string | undefined, since: Date) {
  if (!iso) return false;
  return new Date(iso).getTime() >= since.getTime();
}

export function githubCatalogUrls(settings: AppSettings) {
  if (settings.sources.mode === "repos" && settings.sources.repos.length === 1) {
    const repo = settings.sources.repos[0];
    return {
      issues: `https://github.com/${repo}/issues`,
      pulls: `https://github.com/${repo}/pulls`,
    };
  }
  const query =
    settings.sources.mode === "org"
      ? `org:${settings.sources.org.trim()}`
      : settings.sources.repos.map((repo) => `repo:${repo}`).join(" ");
  return {
    issues: `https://github.com/search?q=${encodeURIComponent(`${query} is:issue is:open`)}&type=issues`,
    pulls: `https://github.com/search?q=${encodeURIComponent(`${query} is:pr is:open`)}&type=issues`,
  };
}

export function itemKey(repo: string, number: number) {
  return `${repo}#${number}`;
}

export function pickBacklog(
  items: DigestItem[],
  exclude: DigestItem[],
  totalCount: number,
  cap: number,
) {
  const excludeKeys = new Set(exclude.map((item) => itemKey(item.repo, item.number)));
  const backlog = items.filter(
    (item) => !excludeKeys.has(itemKey(item.repo, item.number)),
  );
  const total = Math.max(backlog.length, Math.max(0, totalCount - exclude.length));
  return {
    items: backlog.slice(0, cap),
    total,
  };
}

async function githubSearch(
  query: string,
  token: string,
): Promise<{ items: SearchItem[]; total_count: number; warning?: string }> {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=50`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "feishu-oss-digest",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("GitHub Token 无效，请检查配置。");
  }
  if (response.status === 403 || response.status === 429) {
    throw new Error(
      "GitHub API 请求过于频繁。配置 Token 后限额会高很多（建议在设置里填入 PAT）。",
    );
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub 搜索失败（${response.status}）：${body.slice(0, 180)}`);
  }

  const data = (await response.json()) as SearchResponse;
  const remaining = response.headers.get("x-ratelimit-remaining");
  const warning =
    remaining && Number(remaining) < 5
      ? `GitHub 搜索额度只剩 ${remaining} 次，建议尽快配置 Token。`
      : undefined;
  return {
    items: data.items ?? [],
    total_count: data.total_count ?? 0,
    warning,
  };
}

const emptySearch = {
  items: [] as SearchItem[],
  total_count: 0,
  warning: undefined as string | undefined,
};

async function githubGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "feishu-oss-digest",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  if (response.status === 404) {
    throw new Error("找不到这个 GitHub 组织或用户，请检查拼写。");
  }
  if (!response.ok) {
    throw new Error(`GitHub 请求失败（${response.status}）`);
  }
  return (await response.json()) as T;
}

async function resolveSource(settings: AppSettings) {
  if (settings.sources.mode === "repos") {
    const repos = settings.sources.repos.slice(0, 20);
    if (repos.length === 0) return { qualifier: "", label: "" };
    const label =
      repos.length <= 3
        ? repos.join("、")
        : `${repos.slice(0, 2).join("、")} 等 ${repos.length} 个仓库`;
    return {
      qualifier: repos.map((repo) => `repo:${repo}`).join(" "),
      label,
    };
  }
  const name = settings.sources.org.trim();
  if (!name) return { qualifier: "", label: "" };
  const profile = await githubGet<{ type?: string }>(
    `/users/${encodeURIComponent(name)}`,
    settings.githubToken,
  );
  if (profile.type === "Organization") {
    return { qualifier: `org:${name}`, label: `GitHub 组织 ${name}` };
  }
  return { qualifier: `user:${name}`, label: `GitHub 用户 ${name}` };
}

export async function collectDigest(settings: AppSettings): Promise<Digest> {
  const until = new Date();
  const since = new Date(until.getTime() - settings.lookbackHours * 60 * 60 * 1000);
  const { qualifier, label } = await resolveSource(settings);
  if (!qualifier) {
    throw new Error("还没有配置 GitHub 组织或仓库。");
  }

  const sinceDate = since.toISOString().slice(0, 10);
  const visibility = settings.githubToken ? "" : " is:public";
  const queries = {
    newIssues: `${qualifier}${visibility} is:issue created:>=${sinceDate}`,
    newPulls: `${qualifier}${visibility} is:pr created:>=${sinceDate}`,
    mergedPulls: `${qualifier}${visibility} is:pr is:merged merged:>=${sinceDate}`,
    closedIssues: `${qualifier}${visibility} is:issue is:closed closed:>=${sinceDate}`,
    openIssues: `${qualifier}${visibility} is:issue is:open`,
    openPulls: `${qualifier}${visibility} is:pr is:open`,
  };

  const warnings: string[] = [];
  const [
    newIssuesRes,
    newPullsRes,
    mergedPullsRes,
    closedIssuesRes,
    openIssuesRes,
    openPullsRes,
  ] = await Promise.all([
    settings.include.newIssues
      ? githubSearch(queries.newIssues, settings.githubToken)
      : Promise.resolve(emptySearch),
    settings.include.newPulls
      ? githubSearch(queries.newPulls, settings.githubToken)
      : Promise.resolve(emptySearch),
    settings.include.mergedPulls
      ? githubSearch(queries.mergedPulls, settings.githubToken)
      : Promise.resolve(emptySearch),
    settings.include.closedIssues
      ? githubSearch(queries.closedIssues, settings.githubToken)
      : Promise.resolve(emptySearch),
    githubSearch(queries.openIssues, settings.githubToken),
    githubSearch(queries.openPulls, settings.githubToken),
  ]);

  for (const result of [
    newIssuesRes,
    newPullsRes,
    mergedPullsRes,
    closedIssuesRes,
    openIssuesRes,
    openPullsRes,
  ]) {
    if (result.warning) warnings.push(result.warning);
  }

  const cap = settings.maxItemsPerSection;
  const newIssues = newIssuesRes.items
    .filter((item) => afterIso(item.created_at, since))
    .map((item) => toItem(item, "issue"))
    .slice(0, cap);
  const newPulls = newPullsRes.items
    .filter((item) => afterIso(item.created_at, since))
    .map((item) => toItem(item, "pull"))
    .slice(0, cap);
  const mergedPulls = mergedPullsRes.items
    .filter((item) => afterIso(item.pull_request?.merged_at ?? item.closed_at ?? undefined, since))
    .map((item) => toItem(item, "pull"))
    .slice(0, cap);
  const closedIssues = closedIssuesRes.items
    .filter((item) => afterIso(item.closed_at ?? undefined, since))
    .map((item) => toItem(item, "issue"))
    .slice(0, cap);
  const openIssues = pickBacklog(
    openIssuesRes.items.map((item) => toItem(item, "issue")),
    newIssues,
    openIssuesRes.total_count,
    cap,
  );
  const openPulls = pickBacklog(
    openPullsRes.items.map((item) => toItem(item, "pull")),
    newPulls,
    openPullsRes.total_count,
    cap,
  );
  const catalog = githubCatalogUrls(settings);

  return {
    title: settings.digestTitle,
    generatedAt: until.toISOString(),
    since: since.toISOString(),
    until: until.toISOString(),
    lookbackHours: settings.lookbackHours,
    sourceLabel: label,
    demo: false,
    warning: warnings[0],
    newIssues,
    newPulls,
    mergedPulls,
    closedIssues,
    openIssues: openIssues.items,
    openPulls: openPulls.items,
    openIssueTotal: openIssues.total,
    openPullTotal: openPulls.total,
    allIssuesUrl: catalog.issues,
    allPullsUrl: catalog.pulls,
  };
}
