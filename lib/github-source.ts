const ORG_RE = /^[A-Za-z0-9_.-]+$/;
const REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export type ParsedGithubSource = {
  org: string;
  repo?: string;
};

/**
 * Accepts org names, owner/repo, or GitHub page URLs such as
 * https://github.com/PhyAgentOS/PhyAgentOS-core/pulls
 */
export function parseGithubSource(raw: string): ParsedGithubSource {
  let value = raw.trim();
  if (!value) return { org: "" };

  value = value.replace(/[?#].*$/, "");

  const ssh = value.match(/^git@github\.com:(.+)$/i);
  if (ssh) value = ssh[1];

  const web = value.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/(.+)$/i);
  if (web) value = web[1];

  value = value.replace(/\.git$/i, "").replace(/\/+$/, "");
  const parts = value.split("/").filter(Boolean);

  if (parts.length === 0) return { org: "" };
  if (parts.length === 1) return { org: parts[0] };
  return { org: parts[0], repo: `${parts[0]}/${parts[1]}` };
}

export function normalizeGithubOrg(raw: string) {
  return parseGithubSource(raw).org;
}

export function normalizeGithubRepo(raw: string) {
  const parsed = parseGithubSource(raw);
  return parsed.repo ?? "";
}

export function parseRepoList(value: string | undefined) {
  if (!value) return [];
  const seen = new Set<string>();
  const repos: string[] = [];
  for (const item of value.split(/[\s,]+/)) {
    const repo = normalizeGithubRepo(item);
    if (!repo || seen.has(repo)) continue;
    seen.add(repo);
    repos.push(repo);
  }
  return repos;
}

export function isValidGithubOrg(value: string) {
  return ORG_RE.test(value);
}

export function isValidGithubRepo(value: string) {
  return REPO_RE.test(value);
}
