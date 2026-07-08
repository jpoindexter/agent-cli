export const MAX_RECENT_PROJECTS = 8;

export const normalizeRecentProjects = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(new Set(value.filter((path): path is string => typeof path === "string" && path.trim().length > 0))).slice(
        0,
        MAX_RECENT_PROJECTS,
      )
    : [];

export const pushRecentProject = (projects: string[], path: string) => [
  path,
  ...projects.filter((project) => project !== path),
].slice(0, MAX_RECENT_PROJECTS);

export const removeRecentProject = (projects: string[], path: string) => projects.filter((project) => project !== path);

export const isMissingWorkspaceError = (message: string) =>
  message.includes("Workspace folder does not exist") || message.includes("Workspace path is not a folder");

export type ActiveFileByWorkspace = Record<string, string>;

export const normalizeActiveFileByWorkspace = (value: unknown): ActiveFileByWorkspace => {
  if (typeof value !== "object" || value == null || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        entry[0].trim().length > 0 && typeof entry[1] === "string" && entry[1].trim().length > 0,
    ),
  );
};

export const rememberActiveFile = (
  activeFiles: ActiveFileByWorkspace,
  workspacePath: string,
  filePath: string,
): ActiveFileByWorkspace => ({
  ...activeFiles,
  [workspacePath]: filePath,
});

export const forgetActiveFile = (activeFiles: ActiveFileByWorkspace, workspacePath: string): ActiveFileByWorkspace => {
  const next = { ...activeFiles };
  delete next[workspacePath];
  return next;
};
