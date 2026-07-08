export const MAX_RECENT_PROJECTS = 8;
export const MAX_OPEN_PROJECTS = 8;

export type ProjectRailStatus = "running" | "exited" | "attention";

export type OpenProject = {
  path: string;
  status: ProjectRailStatus;
};

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

const normalizeProjectStatus = (value: unknown): ProjectRailStatus =>
  value === "running" || value === "exited" || value === "attention" ? value : "exited";

export const normalizeOpenProjects = (value: unknown): OpenProject[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const projects: OpenProject[] = [];
  for (const item of value) {
    const objectItem = typeof item === "object" && item != null && !Array.isArray(item) ? item as Record<string, unknown> : null;
    const path = typeof item === "string" ? item : typeof objectItem?.path === "string" ? objectItem.path : "";
    const trimmed = path.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    projects.push({
      path: trimmed,
      status: objectItem ? normalizeProjectStatus(objectItem.status) : "exited",
    });
    if (projects.length >= MAX_OPEN_PROJECTS) break;
  }
  return projects;
};

export const openProjectsFromRecent = (projects: string[]): OpenProject[] =>
  projects.slice(0, MAX_OPEN_PROJECTS).map((path) => ({ path, status: "exited" }));

export const upsertOpenProject = (
  projects: OpenProject[],
  path: string,
  status: ProjectRailStatus,
): OpenProject[] => [
  { path, status },
  ...projects.filter((project) => project.path !== path),
].slice(0, MAX_OPEN_PROJECTS);

export const setOpenProjectStatus = (
  projects: OpenProject[],
  path: string,
  status: ProjectRailStatus,
): OpenProject[] => projects.map((project) => (project.path === path ? { ...project, status } : project));

export const removeOpenProject = (projects: OpenProject[], path: string) => projects.filter((project) => project.path !== path);

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
