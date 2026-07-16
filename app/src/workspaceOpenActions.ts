import type { FileTreeNode } from "./fileTreeTypes";
import { executeWorkspaceOpenDirect } from "./workspaceOpenDirectWorkflow";
import { requestWorkspaceOpen as executeWorkspaceOpenRequest } from "./workspaceOpenRequest";

type WorkspaceOpenActionsOptions<Opened, Profile, Panes, Store> = {
  applyOpened: (opened: Opened) => void;
  captureCurrentSession: () => void;
  clearBackgroundExits: (path: string) => void;
  completeOpened: (
    opened: Opened, profile: Profile, previousRoot: string | null, store: Store,
  ) => Promise<unknown>;
  confirmDiscard: (count: number) => Promise<boolean>;
  dirtyTabPaths: string[];
  editorDirty: boolean;
  editorTabs: FileTreeNode[];
  flushComposer: () => Promise<unknown>;
  getDefaultProfile: () => Profile;
  getPreviousActivePaneId: () => number | null;
  getPreviousPanes: () => Panes;
  getPreviousRoot: () => string | null;
  getSelectedFilePath: () => string | null;
  getStore: () => Store;
  handleError: (
    error: unknown, path: string, panes: Panes, activePaneId: number | null, store: Store,
  ) => Promise<unknown>;
  openEditorFile: (file: FileTreeNode) => Promise<unknown>;
  openTarget: (path: string) => Promise<Opened>;
  setFocusedPane: (paneId: null) => void;
};

const openDirect = <Opened, Profile, Panes, Store>(
  options: WorkspaceOpenActionsOptions<Opened, Profile, Panes, Store>,
  path: string, profile: Profile, captureCurrentSession?: boolean,
) => executeWorkspaceOpenDirect({
  applyOpened: options.applyOpened,
  captureCurrentSession: options.captureCurrentSession,
  captureCurrentSessionBeforeOpen: captureCurrentSession,
  completeOpened: options.completeOpened,
  flushComposer: options.flushComposer,
  getPreviousActivePaneId: options.getPreviousActivePaneId,
  getPreviousPanes: options.getPreviousPanes,
  getPreviousRoot: options.getPreviousRoot,
  getStore: options.getStore,
  handleError: options.handleError,
  openTarget: options.openTarget,
  path,
  profile,
  setFocusedPane: options.setFocusedPane,
});

const requestOpen = <Opened, Profile, Panes, Store>(
  options: WorkspaceOpenActionsOptions<Opened, Profile, Panes, Store>,
  path: string, deferNavigation: () => void,
) => {
  options.clearBackgroundExits(path);
  return executeWorkspaceOpenRequest({
    confirmDiscard: options.confirmDiscard,
    deferNavigation,
    dirtyTabPaths: options.dirtyTabPaths,
    editorDirty: options.editorDirty,
    editorTabs: options.editorTabs,
    openEditorFile: options.openEditorFile,
    openWorkspace: (target) => openDirect(options, target, options.getDefaultProfile()),
    path,
    selectedFilePath: options.getSelectedFilePath(),
  });
};

export const createWorkspaceOpenActions = <Opened, Profile, Panes, Store>(
  options: WorkspaceOpenActionsOptions<Opened, Profile, Panes, Store>,
) => ({
  openWorkspaceDirect: (
    path: string, profileOverride?: Profile,
    config: { captureCurrentSession?: boolean } = {},
  ) => openDirect(
    options, path, profileOverride === undefined ? options.getDefaultProfile() : profileOverride,
    config.captureCurrentSession,
  ),
  requestOpenWorkspace: (path: string, deferNavigation: () => void) =>
    requestOpen(options, path, deferNavigation),
});
