type WorkspaceOpenDirectWorkflow<Opened, Profile, Panes, Store> = {
  applyOpened: (opened: Opened) => void;
  captureCurrentSession: () => void;
  captureCurrentSessionBeforeOpen?: boolean;
  completeOpened: (
    opened: Opened,
    profile: Profile,
    previousRoot: string | null,
    store: Store,
  ) => Promise<unknown>;
  flushComposer: () => Promise<unknown>;
  getPreviousActivePaneId: () => number | null;
  getPreviousPanes: () => Panes;
  getPreviousRoot: () => string | null;
  getStore: () => Store;
  handleError: (
    error: unknown,
    path: string,
    previousPanes: Panes,
    previousActivePaneId: number | null,
    store: Store,
  ) => Promise<unknown>;
  openTarget: (path: string) => Promise<Opened>;
  path: string;
  profile: Profile;
  setFocusedPane: (paneId: null) => void;
};

export const executeWorkspaceOpenDirect = async <Opened, Profile, Panes, Store>(
  workflow: WorkspaceOpenDirectWorkflow<Opened, Profile, Panes, Store>,
) => {
  const previousRoot = workflow.getPreviousRoot();
  await workflow.flushComposer();
  if (workflow.captureCurrentSessionBeforeOpen !== false) workflow.captureCurrentSession();
  const store = workflow.getStore();
  const previousPanes = workflow.getPreviousPanes();
  const previousActivePaneId = workflow.getPreviousActivePaneId();
  workflow.setFocusedPane(null);
  try {
    const opened = await workflow.openTarget(workflow.path);
    workflow.applyOpened(opened);
    await workflow.completeOpened(opened, workflow.profile, previousRoot, store);
    return true;
  } catch (error) {
    await workflow.handleError(
      error, workflow.path, previousPanes, previousActivePaneId, store,
    );
    return false;
  }
};
