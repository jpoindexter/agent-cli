import type { AgentActivityEvent } from "./agentActivity";
import type {
  AgentApprovalMode,
  AgentSessionHandle,
  AgentSessionHandleDescriptor,
} from "./agentSessionHandle";
import { executeAgentPaneInterrupt } from "./agentPaneInterrupt";
import type { AppActionDecision, AppActionDescriptor } from "./appActions";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { buildRestartedPaneActivity } from "./paneActivityRecords";
import { executeTerminalPaneRestart } from "./terminalPaneRestartWorkflow";
import { executeTerminalPaneTerminate } from "./terminalPaneTerminate";
import type { TerminalPaneProjectStatus } from "./terminalPane";
import type { ProjectRailStatus } from "./workspaceState";

type Ref<T> = { current: T };
type ActivityInput = Pick<AgentActivityEvent, "kind" | "label" | "status">
  & Partial<Pick<AgentActivityEvent, "detail" | "target">>;

type TerminalProcessActionsControllerOptions<TSnapshot> = {
  approvalMode: () => AgentApprovalMode;
  gateAction: (
    action: AppActionDescriptor, handle: AgentSessionHandleDescriptor | null,
  ) => Promise<AppActionDecision>;
  getActiveDescriptor: () => AgentSessionHandleDescriptor | null;
  getActiveHandle: () => AgentSessionHandle | null;
  getActivePane: () => ManagedTerminalPane | null;
  getChanging: () => boolean;
  getPanes: (root: string, sessionId: string) => ManagedTerminalPane[];
  getProjectStatus: (root: string) => ProjectRailStatus;
  getSessionId: (root: string | null) => string | null;
  getWorkspacePath: () => string | null;
  intentionallyTerminatedPaneIds: Set<number>;
  latest: Ref<TSnapshot | null>;
  now: () => number;
  recordActivity: (handle: AgentSessionHandleDescriptor | null, event: ActivityInput) => void;
  requestPaint: () => void;
  restartPane: (root: string, pane: ManagedTerminalPane) => Promise<number>;
  scheduleResize: () => void;
  setChanging: (changing: boolean) => void;
  setComposerError: (error: string | null) => void;
  setLaunchError: (error: string | null) => void;
  setPaneExited: (paneId: number) => ManagedTerminalPane[];
  setSessionPanes: (
    root: string, sessionId: string, panes: ManagedTerminalPane[], activePaneId: number,
  ) => void;
  snapshots: Ref<Record<number, TSnapshot>>;
  statusForPanes: (panes: ManagedTerminalPane[]) => TerminalPaneProjectStatus;
  terminatePane: (paneId: number) => Promise<unknown>;
  updateProjectStatus: (root: string, status: ProjectRailStatus) => Promise<unknown>;
  updateSessionStatus: (root: string, status: ProjectRailStatus) => Promise<unknown>;
};

const interruptActivePane = async <TSnapshot,>(
  options: TerminalProcessActionsControllerOptions<TSnapshot>,
) => {
  const handle = options.getActiveHandle();
  if (!handle) return;
  return executeAgentPaneInterrupt({
    gateAction: (action) => options.gateAction(action, handle),
    handle,
    recordActivity: (activity) => options.recordActivity(handle, activity),
    setError: options.setComposerError,
  });
};

const terminateTerminalPane = async <TSnapshot,>(
  options: TerminalProcessActionsControllerOptions<TSnapshot>,
  pane: ManagedTerminalPane | null,
) => {
  const root = options.getWorkspacePath();
  if (!root || !pane) return false;
  const descriptor = options.getActiveDescriptor();
  return executeTerminalPaneTerminate({
    gateAction: (action) => options.gateAction(action, descriptor),
    markIntentionallyTerminated: (paneId) => options.intentionallyTerminatedPaneIds.add(paneId),
    pane,
    projectStatus: () => options.getProjectStatus(root),
    recordActivity: (activity) => options.recordActivity(descriptor, activity),
    sessionStatus: options.statusForPanes,
    setError: options.setLaunchError,
    setPaneExited: options.setPaneExited,
    terminatePane: options.terminatePane,
    updateProjectStatus: (status) => options.updateProjectStatus(root, status),
    updateSessionStatus: (status) => options.updateSessionStatus(root, status),
  });
};

const recordRestarted = <TSnapshot,>(
  options: TerminalProcessActionsControllerOptions<TSnapshot>,
  restarted: ManagedTerminalPane | undefined,
  previousPane: ManagedTerminalPane,
  root: string,
  sessionId: string,
  label: string,
) => {
  const record = buildRestartedPaneActivity({
    approvalMode: options.approvalMode(), label, previousPane,
    projectId: root, projectSessionId: sessionId, restarted,
  });
  if (record) options.recordActivity(record.handle, record.event);
};

const restartTerminalPane = async <TSnapshot,>(
  options: TerminalProcessActionsControllerOptions<TSnapshot>,
  pane: ManagedTerminalPane | null,
) => {
  const root = options.getWorkspacePath();
  const sessionId = options.getSessionId(root);
  if (!root || !sessionId || !pane || options.getChanging()) return false;
  const descriptor = options.getActiveDescriptor();
  return executeTerminalPaneRestart({
    clearLatestSnapshot: () => { options.latest.current = null; },
    clearPaneSnapshot: (paneId) => { delete options.snapshots.current[paneId]; },
    currentPanes: () => options.getPanes(root, sessionId),
    gateAction: (action) => options.gateAction(action, descriptor),
    now: options.now,
    pane,
    projectStatus: () => options.getProjectStatus(root),
    recordRestarted: (restarted, label) =>
      recordRestarted(options, restarted, pane, root, sessionId, label),
    requestPaint: options.requestPaint,
    restartPane: () => options.restartPane(root, pane),
    scheduleResize: options.scheduleResize,
    sessionStatus: options.statusForPanes,
    setChanging: options.setChanging,
    setError: options.setLaunchError,
    setSessionPanes: (panes, paneId) => options.setSessionPanes(root, sessionId, panes, paneId),
    updateProjectStatus: (status) => options.updateProjectStatus(root, status),
    updateSessionStatus: (status) => options.updateSessionStatus(root, status),
  });
};

export const createTerminalProcessActionsController = <TSnapshot,>(
  options: TerminalProcessActionsControllerOptions<TSnapshot>,
) => ({
  interruptActivePane: () => interruptActivePane(options),
  restartTerminalPane: (pane: ManagedTerminalPane | null = options.getActivePane()) =>
    restartTerminalPane(options, pane),
  terminateTerminalPane: (pane: ManagedTerminalPane | null = options.getActivePane()) =>
    terminateTerminalPane(options, pane),
});
