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
