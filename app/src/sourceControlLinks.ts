export type SourceHostKind = "github" | "gitlab" | "unknown";

export type RepoLocation = {
  host: string;
  owner: string;
  repo: string;
  kind: SourceHostKind;
};

const hostKind = (host: string): SourceHostKind => {
  if (host === "github.com") return "github";
  if (host === "gitlab.com") return "gitlab";
  return "unknown";
};

/** Parses `origin`-style remote URLs (SSH or HTTPS) from any git host. */
export const parseRemoteUrl = (remoteUrl: string): RepoLocation | null => {
  const trimmed = remoteUrl.trim();
  const ssh = trimmed.match(/^(?:ssh:\/\/)?git@([^:/]+)[:/](.+?)(?:\.git)?\/?$/);
  const https = trimmed.match(/^https?:\/\/(?:[^@/]+@)?([^/]+)\/(.+?)(?:\.git)?\/?$/);
  const match = ssh ?? https;
  if (!match) return null;
  const host = match[1];
  const path = match[2];
  const slash = path.lastIndexOf("/");
  if (slash <= 0 || slash === path.length - 1) return null;
  const owner = path.slice(0, slash);
  const repo = path.slice(slash + 1);
  if (!owner || !repo) return null;
  return { host, owner, repo, kind: hostKind(host) };
};

const repoBaseUrl = (location: RepoLocation) => `https://${location.host}/${location.owner}/${location.repo}`;

export const isGitLabLocation = (location: RepoLocation): boolean => location.kind !== "github";

export const buildRepoUrl = (location: RepoLocation): string => repoBaseUrl(location);

export const buildPullRequestsUrl = (location: RepoLocation): string =>
  isGitLabLocation(location) ? `${repoBaseUrl(location)}/-/merge_requests` : `${repoBaseUrl(location)}/pulls`;

export const buildIssuesUrl = (location: RepoLocation): string => `${repoBaseUrl(location)}/issues`;

export const buildPipelinesUrl = (location: RepoLocation): string =>
  isGitLabLocation(location) ? `${repoBaseUrl(location)}/-/pipelines` : `${repoBaseUrl(location)}/actions`;

export const sourceHostLabel = (location: RepoLocation): string => {
  if (location.kind === "github") return "GitHub";
  if (location.kind === "gitlab") return "GitLab";
  return location.host;
};

export const sourceRepoStatusLabel = (location: RepoLocation): string =>
  `${sourceHostLabel(location)} · ${location.owner}/${location.repo}`;
