import type { AppActionDecision, AppActionDescriptor } from "./appActions";
import { createAppAction } from "./appActions";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { terminalPaneLabelForDisplay } from "./terminalPane";

type TerminalPaneFocusWorkflow = {
  activePaneId: () => number | null;
  currentPanes: () => ManagedTerminalPane[];
  focusPane: (paneId: number) => Promise<unknown>;
  gateAction: (action: AppActionDescriptor) => Promise<AppActionDecision>;
  paneId: number;
  recordActivePane: (paneId: number) => void;
  requestedBy: "user" | "agent";
  restoreSnapshot: (paneId: number) => void;
  scheduleResize: () => void;
  setError: (error: string) => void;
  setFocusedPane: (paneId: number) => void;
};

const focusTarget = (workflow: TerminalPaneFocusWorkflow) => {
  const pane = workflow.currentPanes().find((item) => item.id === workflow.paneId);
  return pane
    ? terminalPaneLabelForDisplay(pane.label, pane.profile.label, pane.slot)
    : `pane:${workflow.paneId}`;
};

export const executeTerminalPaneFocus = async (workflow: TerminalPaneFocusWorkflow) => {
  if (workflow.paneId === workflow.activePaneId()) return false;
  const decision = await workflow.gateAction(createAppAction({
    kind: "focus-pane",
    label: "Focus pane",
    requestedBy: workflow.requestedBy,
    risk: "low",
    target: focusTarget(workflow),
  }));
  if (decision !== "approved") return false;
  try {
    await workflow.focusPane(workflow.paneId);
    workflow.recordActivePane(workflow.paneId);
    workflow.setFocusedPane(workflow.paneId);
    workflow.restoreSnapshot(workflow.paneId);
    workflow.scheduleResize();
    return true;
  } catch (error) {
    workflow.setError(String(error));
    return false;
  }
};
