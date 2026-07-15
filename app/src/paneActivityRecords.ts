import type { AgentActivityEvent } from "./agentActivity";
import {
  buildAgentSessionHandleDescriptor,
  type AgentApprovalMode,
  type AgentSessionHandleDescriptor,
} from "./agentSessionHandle";
import { launchProfileCommandLine } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { terminalPaneLabelForDisplay } from "./terminalPane";

type ActivityInput = Pick<AgentActivityEvent, "kind" | "label" | "status"> &
  Partial<Pick<AgentActivityEvent, "detail" | "target">>;

type PaneActivityContext = {
  approvalMode: AgentApprovalMode;
  projectId: string;
  projectSessionId: string;
};

type PaneActivityRecord = {
  event: ActivityInput;
  handle: AgentSessionHandleDescriptor;
};

const paneHandle = (
  pane: ManagedTerminalPane,
  context: PaneActivityContext,
  label: string,
) => buildAgentSessionHandleDescriptor({ pane, label, ...context });

export const buildRestartedPaneActivity = (
  input: PaneActivityContext & {
    label: string;
    previousPane: ManagedTerminalPane;
    restarted: ManagedTerminalPane | undefined;
  },
): PaneActivityRecord | null => input.restarted ? {
  handle: paneHandle(input.restarted, input, input.label),
  event: {
    kind: "process",
    label: "Restarted process",
    detail: launchProfileCommandLine(input.previousPane.profile),
    target: input.previousPane.cwd,
    status: "running",
  },
} : null;

export const buildCreatedPaneActivity = (
  input: PaneActivityContext & { pane: ManagedTerminalPane },
): PaneActivityRecord => ({
  handle: paneHandle(input.pane, input, terminalPaneLabelForDisplay(
    input.pane.label, input.pane.profile.label, input.pane.slot,
  )),
  event: { kind: "process", label: "Created pane", detail: input.pane.profile.label, status: "running" },
});

export const buildCreatedWorktreePaneActivity = (
  input: PaneActivityContext & { branch: string; pane: ManagedTerminalPane },
): PaneActivityRecord => ({
  handle: paneHandle(input.pane, input, terminalPaneLabelForDisplay(
    input.pane.label, input.pane.profile.label, input.pane.slot,
  )),
  event: { kind: "process", label: "Created worktree pane", detail: input.branch, status: "running" },
});
