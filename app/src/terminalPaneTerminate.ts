import type { AgentActivityEvent } from "./agentActivity";
import { createAppAction, type AppActionDecision, type AppActionDescriptor } from "./appActions";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { terminalPaneLabelForDisplay, type TerminalPaneProjectStatus } from "./terminalPane";
import type { ProjectRailStatus } from "./workspaceState";

type TerminateActivity = Pick<AgentActivityEvent, "kind" | "label" | "status">
  & Partial<Pick<AgentActivityEvent, "detail" | "target">>;

type TerminalPaneTerminateWorkflow = {
  gateAction: (action: AppActionDescriptor) => Promise<AppActionDecision>;
  markIntentionallyTerminated: (paneId: number) => void;
  pane: ManagedTerminalPane;
  projectStatus: () => ProjectRailStatus;
  recordActivity: (activity: TerminateActivity) => void;
  sessionStatus: (panes: ManagedTerminalPane[]) => TerminalPaneProjectStatus;
  setError: (error: string | null) => void;
  setPaneExited: (paneId: number) => ManagedTerminalPane[];
  terminatePane: (paneId: number) => Promise<unknown>;
  updateProjectStatus: (status: ProjectRailStatus) => Promise<unknown>;
  updateSessionStatus: (status: ProjectRailStatus) => Promise<unknown>;
};

export const executeTerminalPaneTerminate = async ({
  gateAction,
  markIntentionallyTerminated,
  pane,
  projectStatus,
  recordActivity,
  sessionStatus,
  setError,
  setPaneExited,
  terminatePane,
  updateProjectStatus,
  updateSessionStatus,
}: TerminalPaneTerminateWorkflow) => {
  const label = terminalPaneLabelForDisplay(pane.label, pane.profile.label, pane.slot);
  const decision = await gateAction(createAppAction({
    kind: "terminate-process",
    label: "Terminate process",
    target: label,
    risk: "destructive",
    requestedBy: "user",
    undoHint: "Restart the pane from the same profile.",
  }));
  if (decision !== "approved") return false;
  try {
    await terminatePane(pane.id);
    markIntentionallyTerminated(pane.id);
    const nextPanes = setPaneExited(pane.id);
    await updateProjectStatus(projectStatus());
    await updateSessionStatus(sessionStatus(nextPanes));
    recordActivity({ kind: "process", label: "Terminate sent", detail: label, target: pane.cwd, status: "waiting" });
    setError(null);
    return true;
  } catch (error) {
    setError(String(error));
    await updateProjectStatus("attention");
    await updateSessionStatus("attention");
    return false;
  }
};
