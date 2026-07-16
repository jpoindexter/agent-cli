import type { ChatMessage } from "./chatConversation";

export type ChatApprovalDecision = "accept" | "acceptForSession" | "decline";

type ChatRunControlsOptions = {
  getActiveRunId: () => string | undefined;
  respondApproval: (input: {
    decision: ChatApprovalDecision; requestId: number; runId: string;
  }) => Promise<unknown>;
  setError: (error: string | null) => void;
  stopRun: (runId: string) => Promise<unknown>;
};

const stopActiveChatRun = async (options: ChatRunControlsOptions) => {
  const runId = options.getActiveRunId();
  if (!runId) return;
  try {
    await options.stopRun(runId);
  } catch (err) {
    options.setError(String(err));
  }
};

const resolveChatApproval = async (
  options: ChatRunControlsOptions,
  message: ChatMessage,
  decision: ChatApprovalDecision,
) => {
  const runId = message.approvalRunId ?? options.getActiveRunId();
  if (!runId || message.approvalRequestId == null) return;
  if (options.getActiveRunId() !== runId) {
    options.setError("That approval belongs to a run that is no longer active.");
    return;
  }
  try {
    await options.respondApproval({ decision, requestId: message.approvalRequestId, runId });
  } catch (err) {
    options.setError(String(err));
  }
};

export const createChatRunControls = (options: ChatRunControlsOptions) => ({
  resolveChatApproval: (message: ChatMessage, decision: ChatApprovalDecision) =>
    resolveChatApproval(options, message, decision),
  stopActiveChatRun: () => stopActiveChatRun(options),
});
