type RequestProjectCloseInput = {
  activeProjectPath: string | null;
  closeProject: (path: string) => Promise<boolean>;
  confirmDirtyTabs: (count: number) => Promise<boolean>;
  confirmRunningTasks: (count: number) => Promise<boolean>;
  conversations: Record<string, { activeRunId?: string | null }>;
  deferNavigation: () => void;
  dirtyTabCount: number;
  hasSelectedFile: boolean;
  panes: { state: string }[];
  projectPath: string;
};

export const requestProjectClose = async ({
  activeProjectPath,
  closeProject,
  confirmDirtyTabs,
  confirmRunningTasks,
  conversations,
  deferNavigation,
  dirtyTabCount,
  hasSelectedFile,
  panes,
  projectPath,
}: RequestProjectCloseInput) => {
  const runCount = Object.entries(conversations)
    .filter(([key, conversation]) => key.startsWith(`${projectPath}\n`) && conversation.activeRunId)
    .length;
  const paneCount = panes.filter((pane) => pane.state !== "exited").length;
  const runningTaskCount = runCount + paneCount;
  if (runningTaskCount > 0 && !await confirmRunningTasks(runningTaskCount)) return false;
  if (projectPath === activeProjectPath && dirtyTabCount === 1 && hasSelectedFile) {
    deferNavigation();
    return false;
  }
  if (projectPath === activeProjectPath && dirtyTabCount > 1 && !await confirmDirtyTabs(dirtyTabCount)) {
    return false;
  }
  return closeProject(projectPath);
};
