import type { LaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { paneContextKey } from "./paneOwnership";
import type { PaneLayoutsBySession } from "./sessionRestore";
import type {
  ActiveSessionByProject,
  ProjectSessionsByProject,
} from "./workspaceState";
import { openWorkspaceTerminalPanes } from "./workspaceOpenPanes";
import { prepareWorkspaceOpenSession } from "./workspaceOpenSession";
import { resolveWorkspaceOpenTarget } from "./workspaceOpenTarget";

type Ref<T> = { current: T };

export type OpenedWorkspaceTarget = {
  activePaneId: number | null;
  panes: ManagedTerminalPane[];
  requestedSessionId: string | null;
  root: string;
};

type WorkspaceOpenTargetControllerOptions<TSnapshot, TEnvironment> = {
  activePaneForSession: (
    root: string, sessionId: string | null, panes: ManagedTerminalPane[],
  ) => number | null;
  activePaneIds: Ref<Record<string, number>>;
  activeSessions: Ref<ActiveSessionByProject>;
  createPane: (
    path: string, profile: LaunchProfile, environment: TEnvironment,
  ) => Promise<{ paneId: number }>;
  defaultProfileId: string;
  focusPane: (paneId: number) => Promise<unknown>;
  getEnvironment: (path: string) => TEnvironment;
  getSurfaceMode: () => string;
  latest: Ref<TSnapshot | null>;
  now: () => number;
  openWorkspace: (
    path: string, profile: LaunchProfile, environment: TEnvironment,
  ) => Promise<{ paneId: number; root: string }>;
  paneLayouts: Ref<PaneLayoutsBySession>;
  panesByContext: Ref<Record<string, ManagedTerminalPane[]>>;
  panesForSession: (root: string, sessionId: string | null) => ManagedTerminalPane[];
  requestPaint: () => void;
  resetEditor: () => void;
  resolveProfile: (id: string) => LaunchProfile;
  resolveWorkspace: (path: string) => Promise<{ root: string }>;
  restoredActiveFileWorkspace: Ref<string | null>;
  savedLabelForSlot: (root: string, slot: number, sessionId?: string | null) => string | null;
  scheduleResize: () => void;
  sessions: Ref<ProjectSessionsByProject>;
  setFocusedPane: (paneId: number | null) => void;
  setLaunchError: (message: string | null) => void;
  setManagedPanes: (panes: ManagedTerminalPane[]) => void;
  setWorkspacePath: (root: string) => void;
  snapshots: Ref<Record<number, TSnapshot>>;
  workspacePath: Ref<string | null>;
};

const prepareTarget = async <TSnapshot, TEnvironment>(
  options: WorkspaceOpenTargetControllerOptions<TSnapshot, TEnvironment>, path: string,
): Promise<OpenedWorkspaceTarget> => {
  const prepared = prepareWorkspaceOpenSession({
    activeSessions: options.activeSessions.current, sessions: options.sessions.current,
    paneLayouts: options.paneLayouts.current, path, now: options.now(),
    defaultProfileId: options.defaultProfileId, savedLabel: options.savedLabelForSlot(path, 0),
  });
  options.sessions.current = prepared.sessions;
  options.activeSessions.current = prepared.activeSessions;
  const existingPanes = options.panesForSession(path, prepared.sessionId);
  const opened = await resolveWorkspaceOpenTarget({
    activePaneId: options.activePaneForSession(path, prepared.sessionId, existingPanes),
    existingPanes, focusPane: options.focusPane,
    openTerminalPanes: () => openWorkspaceTerminalPanes({
      createPane: (root, profile) => options.createPane(root, profile, options.getEnvironment(root)),
      fallbackLayout: prepared.fallbackLayout, initialLayout: prepared.layout, now: options.now,
      openWorkspace: (root, profile) => options.openWorkspace(root, profile, options.getEnvironment(root)),
      paneLayouts: options.paneLayouts.current, path, requestedSessionId: prepared.sessionId,
      resolveProfile: options.resolveProfile,
      savedLabelForSlot: (root, slot) => options.savedLabelForSlot(root, slot, prepared.sessionId),
    }),
    path, resolveWorkspace: options.resolveWorkspace, surfaceMode: options.getSurfaceMode(),
  });
  return { ...opened, requestedSessionId: prepared.sessionId };
};

const applyTarget = <TSnapshot, TEnvironment>(
  options: WorkspaceOpenTargetControllerOptions<TSnapshot, TEnvironment>,
  opened: OpenedWorkspaceTarget,
) => {
  const { activePaneId, panes, requestedSessionId, root } = opened;
  const contextKey = paneContextKey(root, requestedSessionId);
  if (!contextKey || !requestedSessionId) throw new Error("Workspace session context is unavailable");
  options.panesByContext.current = { ...options.panesByContext.current, [contextKey]: panes };
  if (activePaneId != null) {
    options.activePaneIds.current = { ...options.activePaneIds.current, [contextKey]: activePaneId };
  }
  options.setManagedPanes(panes);
  options.setFocusedPane(activePaneId);
  options.latest.current = activePaneId == null ? null : options.snapshots.current[activePaneId] ?? null;
  options.requestPaint();
  options.setLaunchError(null);
  options.restoredActiveFileWorkspace.current = null;
  options.workspacePath.current = root;
  options.setWorkspacePath(root);
  options.resetEditor();
  options.scheduleResize();
};

export const createWorkspaceOpenTargetController = <TSnapshot, TEnvironment>(
  options: WorkspaceOpenTargetControllerOptions<TSnapshot, TEnvironment>,
) => ({
  applyOpenedWorkspaceTarget: (opened: OpenedWorkspaceTarget) => applyTarget(options, opened),
  prepareAndOpenWorkspaceTarget: (path: string) => prepareTarget(options, path),
});
