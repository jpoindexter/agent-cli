type WorkspaceOpenTarget<TPane> = {
  activePaneId: number | null;
  panes: TPane[];
  root: string;
};

type WorkspaceOpenTargetInput<TPane> = {
  activePaneId: number | null;
  existingPanes: TPane[];
  focusPane: (paneId: number) => Promise<unknown>;
  openTerminalPanes: () => Promise<WorkspaceOpenTarget<TPane>>;
  path: string;
  resolveWorkspace: (path: string) => Promise<{ root: string }>;
  surfaceMode: string;
};

export const resolveWorkspaceOpenTarget = async <TPane>(input: WorkspaceOpenTargetInput<TPane>) => {
  if (input.existingPanes.length > 0 && input.activePaneId != null) {
    await input.focusPane(input.activePaneId);
    return { activePaneId: input.activePaneId, panes: input.existingPanes, root: input.path };
  }
  if (input.surfaceMode === "terminal") return input.openTerminalPanes();
  const resolved = await input.resolveWorkspace(input.path);
  return { activePaneId: null, panes: [], root: resolved.root };
};
