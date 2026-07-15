import type { AppActionDecision, AppActionDescriptor } from "./appActions";
import { createAppAction } from "./appActions";
import { launchProfileCommandLine } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { replaceRestartedPane } from "./terminalPaneRestart";
import { terminalPaneLabelForDisplay, type TerminalPaneProjectStatus } from "./terminalPane";
import type { ProjectRailStatus } from "./workspaceState";

type TerminalPaneRestartWorkflow = {
  clearLatestSnapshot: () => void;
  clearPaneSnapshot: (paneId: number) => void;
  currentPanes: () => ManagedTerminalPane[];
  gateAction: (action: AppActionDescriptor) => Promise<AppActionDecision>;
  now: () => number;
  pane: ManagedTerminalPane;
  projectStatus: () => ProjectRailStatus;
  recordRestarted: (pane: ManagedTerminalPane | undefined, label: string) => void;
  requestPaint: () => void;
  restartPane: () => Promise<number>;
  scheduleResize: () => void;
  sessionStatus: (panes: ManagedTerminalPane[]) => TerminalPaneProjectStatus;
  setChanging: (changing: boolean) => void;
  setError: (error: string | null) => void;
  setSessionPanes: (panes: ManagedTerminalPane[], activePaneId: number) => void;
  updateProjectStatus: (status: ProjectRailStatus) => Promise<unknown>;
  updateSessionStatus: (status: ProjectRailStatus) => Promise<unknown>;
};

const completeRestart = async (
  workflow: TerminalPaneRestartWorkflow,
  paneId: number,
  label: string,
) => {
  const nextPanes = replaceRestartedPane(
    workflow.currentPanes(), workflow.pane.id, paneId, workflow.now(),
  );
  workflow.clearPaneSnapshot(workflow.pane.id);
  workflow.clearLatestSnapshot();
  workflow.setSessionPanes(nextPanes, paneId);
  workflow.requestPaint();
  workflow.setError(null);
  workflow.scheduleResize();
  await workflow.updateProjectStatus(workflow.projectStatus());
  await workflow.updateSessionStatus(workflow.sessionStatus(nextPanes));
  workflow.recordRestarted(nextPanes.find((pane) => pane.id === paneId), label);
};

const failRestart = async (workflow: TerminalPaneRestartWorkflow, error: unknown) => {
  workflow.setError(String(error));
  await workflow.updateProjectStatus("attention");
  await workflow.updateSessionStatus("attention");
};

export const executeTerminalPaneRestart = async (workflow: TerminalPaneRestartWorkflow) => {
  const label = terminalPaneLabelForDisplay(
    workflow.pane.label, workflow.pane.profile.label, workflow.pane.slot,
  );
  const decision = await workflow.gateAction(createAppAction({
    kind: "restart-process",
    label: "Restart process",
    target: `${label} · ${launchProfileCommandLine(workflow.pane.profile)}`,
    risk: "high",
    requestedBy: "user",
    undoHint: "The previous live process is terminated; pane label and slot are preserved.",
  }));
  if (decision !== "approved") return false;
  workflow.setChanging(true);
  try {
    await completeRestart(workflow, await workflow.restartPane(), label);
    return true;
  } catch (error) {
    await failRestart(workflow, error);
    return false;
  } finally {
    workflow.setChanging(false);
  }
};
