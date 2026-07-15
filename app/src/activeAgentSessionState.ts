import { filterAgentActivityEvents, type AgentActivityEvent, type AgentActivityLogFilter } from "./agentActivity";
import { buildAgentSessionHandleDescriptor, type AgentApprovalMode } from "./agentSessionHandle";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { terminalPaneLabelForDisplay } from "./terminalPane";

type ActiveAgentSessionStateInput = {
  activeSessionId: string | null;
  activeTerminalPaneId: number | null;
  agentActivityEvents: AgentActivityEvent[];
  agentActivityFilter: AgentActivityLogFilter;
  agentApprovalMode: AgentApprovalMode;
  terminalPanes: ManagedTerminalPane[];
  workspacePath: string | null;
};

export const deriveActiveAgentSessionState = (input: ActiveAgentSessionStateInput) => {
  const activeTerminalPane = input.terminalPanes.find(
    (pane) => pane.id === input.activeTerminalPaneId,
  ) ?? null;
  const agentSessionDescriptors = input.workspacePath && input.activeSessionId
    ? input.terminalPanes.map((pane, index) => buildAgentSessionHandleDescriptor({
        pane,
        projectId: input.workspacePath!,
        projectSessionId: input.activeSessionId!,
        label: terminalPaneLabelForDisplay(pane.label, pane.profile.label, index),
        approvalMode: input.agentApprovalMode,
      }))
    : [];
  const activeAgentSessionDescriptor = agentSessionDescriptors.find(
    (handle) => handle.paneId === input.activeTerminalPaneId,
  ) ?? null;
  const paneIds = new Set([
    ...(input.activeSessionId ? [`chat:${input.activeSessionId}`] : []),
    ...(activeAgentSessionDescriptor ? [activeAgentSessionDescriptor.id] : []),
  ]);
  const selectedAgentActivityLog = input.workspacePath && input.activeSessionId
    ? filterAgentActivityEvents(input.agentActivityEvents.filter((event) =>
        event.projectId === input.workspacePath
        && event.projectSessionId === input.activeSessionId
        && paneIds.has(event.paneId)), input.agentActivityFilter)
    : [];
  return {
    activeAgentSessionDescriptor,
    activeTerminalPane,
    agentSessionDescriptors,
    selectedAgentActivityLog,
  };
};
