import type { OpenProject, ProjectRailStatus } from "./workspaceStateTypes";

export const visibleProjectsFrom = (
  openProjects: OpenProject[],
  workspacePath: string | null,
  activeStatus: () => ProjectRailStatus,
): OpenProject[] => {
  if (openProjects.length > 0) return openProjects;
  return workspacePath ? [{ path: workspacePath, status: activeStatus() }] : [];
};

export const toggleExpandedProject = (
  expanded: Record<string, boolean>,
  path: string,
): Record<string, boolean> => ({ ...expanded, [path]: !(expanded[path] ?? false) });
