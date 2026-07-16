import type { TerminalPaneState } from "./terminalPane";

export type AgentApprovalMode = "ask" | "approveSafe" | "fullAccess";
export type AgentSessionProcessState = "starting" | "running" | "waiting" | "exited" | "errored";

export const DEFAULT_AGENT_APPROVAL_MODE: AgentApprovalMode = "ask";

export type AgentSessionCell = { t: string };
export type AgentSessionSnapshot = {
  cols: number;
  rows: number;
  cells: AgentSessionCell[];
};

export type AgentSessionHandleDescriptor = {
  id: string;
  paneId: number;
  projectId: string;
  projectSessionId: string;
  cwd: string;
  label: string;
  agentProfileId: string;
  agentProfileLabel: string;
  processState: AgentSessionProcessState;
  approvalMode: AgentApprovalMode;
  exitCode: number | null;
  createdAt: number;
  activity: {
    label: string;
    status: AgentSessionProcessState;
    updatedAt: number;
  };
};

export type AgentSessionHandle = AgentSessionHandleDescriptor & {
  send(text: string): Promise<void>;
  interrupt(): Promise<void>;
  readTail(lines: number): Promise<string>;
  close(): Promise<void>;
};

type ActiveAgentSessionHandleWorkflow = {
  activePaneId: () => number | null;
  closePane: (paneId: number) => Promise<boolean>;
  descriptor: AgentSessionHandleDescriptor;
  focusPane: (paneId: number) => Promise<unknown>;
  recordClosed: (descriptor: AgentSessionHandleDescriptor) => void;
  sendEnter: () => Promise<unknown>;
  sendInterrupt: () => Promise<unknown>;
  sendText: (text: string) => Promise<unknown>;
  snapshot: (paneId: number) => AgentSessionSnapshot | null | undefined;
};

export const agentSessionHandleId = (paneId: number) => `pane:${paneId}`;

export const processStateFromTerminalPane = (state: TerminalPaneState): AgentSessionProcessState => {
  if (state === "starting") return "starting";
  if (state === "running") return "running";
  if (state === "exited") return "exited";
  if (state === "error") return "errored";
  return "waiting";
};

export const agentActivityLabel = (processState: AgentSessionProcessState) => {
  if (processState === "starting") return "Starting process";
  if (processState === "running") return "Running";
  if (processState === "waiting") return "Waiting for input";
  if (processState === "exited") return "Process exited";
  return "Process error";
};

export const buildAgentSessionHandleDescriptor = (input: {
  pane: {
    id: number;
    cwd: string;
    profile: { id: string; label: string };
    state: TerminalPaneState;
    exitCode: number | null;
    createdAt: number;
  };
  projectId: string;
  projectSessionId: string;
  label: string;
  approvalMode: AgentApprovalMode;
  updatedAt?: number;
}): AgentSessionHandleDescriptor => {
  const processState = processStateFromTerminalPane(input.pane.state);
  return {
    id: agentSessionHandleId(input.pane.id),
    paneId: input.pane.id,
    projectId: input.projectId,
    projectSessionId: input.projectSessionId,
    cwd: input.pane.cwd,
    label: input.label,
    agentProfileId: input.pane.profile.id,
    agentProfileLabel: input.pane.profile.label,
    processState,
    approvalMode: input.approvalMode,
    exitCode: input.pane.exitCode,
    createdAt: input.pane.createdAt,
    activity: {
      label: agentActivityLabel(processState),
      status: processState,
      updatedAt: input.updatedAt ?? input.pane.createdAt,
    },
  };
};

export const readTailFromSnapshot = (snapshot: AgentSessionSnapshot | null | undefined, lines: number) => {
  if (!snapshot || snapshot.cols <= 0 || snapshot.rows <= 0 || lines <= 0) return "";
  const count = Math.min(snapshot.rows, Math.max(0, Math.trunc(lines)));
  const startRow = Math.max(0, snapshot.rows - count);
  const rows: string[] = [];
  for (let y = startRow; y < snapshot.rows; y += 1) {
    let row = "";
    for (let x = 0; x < snapshot.cols; x += 1) {
      row += snapshot.cells[y * snapshot.cols + x]?.t ?? " ";
    }
    rows.push(row.replace(/\s+$/, ""));
  }
  return rows.join("\n").replace(/\n+$/, "");
};

const focusDescriptorPane = async (workflow: ActiveAgentSessionHandleWorkflow) => {
  if (workflow.activePaneId() !== workflow.descriptor.paneId) {
    await workflow.focusPane(workflow.descriptor.paneId);
  }
};

export const createActiveAgentSessionHandle = (
  workflow: ActiveAgentSessionHandleWorkflow,
): AgentSessionHandle => ({
  ...workflow.descriptor,
  send: async (text) => {
    await focusDescriptorPane(workflow);
    await workflow.sendText(text);
    await workflow.sendEnter();
  },
  interrupt: async () => {
    await focusDescriptorPane(workflow);
    await workflow.sendInterrupt();
  },
  readTail: async (lines) => readTailFromSnapshot(
    workflow.snapshot(workflow.descriptor.paneId),
    lines,
  ),
  close: async () => {
    if (await workflow.closePane(workflow.descriptor.paneId)) {
      workflow.recordClosed(workflow.descriptor);
    }
  },
});
