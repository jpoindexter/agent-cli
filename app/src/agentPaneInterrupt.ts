import type { AgentActivityEvent } from "./agentActivity";
import type { AgentSessionHandle } from "./agentSessionHandle";
import { createAppAction, type AppActionDecision, type AppActionDescriptor } from "./appActions";

type InterruptActivity = Pick<AgentActivityEvent, "kind" | "label" | "status">
  & Partial<Pick<AgentActivityEvent, "detail">>;

type AgentPaneInterruptWorkflow = {
  gateAction: (action: AppActionDescriptor) => Promise<AppActionDecision>;
  handle: AgentSessionHandle;
  recordActivity: (activity: InterruptActivity) => void;
  setError: (error: string | null) => void;
};

export const executeAgentPaneInterrupt = async ({
  gateAction,
  handle,
  recordActivity,
  setError,
}: AgentPaneInterruptWorkflow) => {
  const decision = await gateAction(createAppAction({
    kind: "interrupt-process",
    label: "Interrupt process",
    target: handle.label,
    risk: "high",
    requestedBy: "user",
    undoHint: "Restart or create a pane from the same profile.",
  }));
  if (decision !== "approved") return false;
  setError(null);
  await handle.interrupt();
  recordActivity({
    kind: "process",
    label: "Stop sent",
    detail: handle.label,
    status: "waiting",
  });
  return true;
};
