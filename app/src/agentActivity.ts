import type { AgentActivityStatus } from "./icons";
import type { AgentSessionHandleDescriptor, AgentSessionProcessState } from "./agentSessionHandle";

export type AgentActivityKind = "prompt" | "process" | "file" | "approval" | "browser" | "app" | "error" | "complete";

export type AgentActivityEvent = {
  id: string;
  projectId: string;
  projectSessionId: string;
  paneId: string;
  kind: AgentActivityKind;
  label: string;
  detail?: string;
  status: AgentActivityStatus;
  timestamp: number;
};

export const MAX_AGENT_ACTIVITY_EVENTS = 6;

export const agentActivityStatusFromProcess = (state: AgentSessionProcessState): AgentActivityStatus => {
  if (state === "starting") return "waiting";
  if (state === "running") return "running";
  if (state === "waiting") return "waiting";
  if (state === "exited") return "exited";
  return "error";
};

export const agentCurrentActivity = (handle: AgentSessionHandleDescriptor | null): AgentActivityEvent | null => {
  if (!handle) return null;
  return {
    id: `${handle.id}:current`,
    projectId: handle.projectId,
    projectSessionId: handle.projectSessionId,
    paneId: handle.id,
    kind: handle.processState === "errored" ? "error" : handle.processState === "exited" ? "complete" : "process",
    label: handle.activity.label,
    detail: `${handle.label} - ${handle.agentProfileLabel}`,
    status: agentActivityStatusFromProcess(handle.processState),
    timestamp: handle.activity.updatedAt,
  };
};

export const createAgentActivityEvent = (
  handle: AgentSessionHandleDescriptor,
  event: Pick<AgentActivityEvent, "kind" | "label" | "status"> & Partial<Pick<AgentActivityEvent, "detail" | "timestamp">>,
): AgentActivityEvent => ({
  id: `${handle.id}:${event.kind}:${event.timestamp ?? Date.now()}`,
  projectId: handle.projectId,
  projectSessionId: handle.projectSessionId,
  paneId: handle.id,
  kind: event.kind,
  label: event.label,
  detail: event.detail,
  status: event.status,
  timestamp: event.timestamp ?? Date.now(),
});

export const pushAgentActivityEvent = (
  events: AgentActivityEvent[],
  event: AgentActivityEvent,
  limit = MAX_AGENT_ACTIVITY_EVENTS,
) => [event, ...events.filter((item) => item.id !== event.id)].slice(0, limit);
