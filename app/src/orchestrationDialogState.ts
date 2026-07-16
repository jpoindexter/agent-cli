import type { ChatConversationRecords, ChatProvider } from "./chatConversation";
import type { AgentApprovalMode } from "./agentSessionHandle";
import type { OrchestrationChildDraft } from "./chatOrchestration";
import type { ProjectSessionsByProject } from "./workspaceStateTypes";

const DEFAULT_PARENT_TITLE = "Current chat";

type OrchestrationDialogInput = {
  activeSessionId: string | null;
  conversations: ChatConversationRecords;
  sessions: ProjectSessionsByProject;
  workspacePath: string | null;
};

export const deriveOrchestrationDialogState = (input: OrchestrationDialogInput) => ({
  activeRunCount: Object.values(input.conversations)
    .filter((conversation) => conversation.activeRunId).length,
  parentTitle: input.sessions[input.workspacePath ?? ""]
    ?.find((session) => session.id === input.activeSessionId)?.title ?? DEFAULT_PARENT_TITLE,
});

type OrchestrationDialogPropsInput = {
  activeProvider: ChatProvider | null;
  approvalMode: AgentApprovalMode;
  conversationProvider: ChatProvider;
  derived: { activeRunCount: number; parentTitle: string };
  error: string | null;
  launch: (children: OrchestrationChildDraft[]) => Promise<unknown>;
  launching: boolean;
  open: boolean;
  setError: (error: string | null) => void;
  setOpen: (open: boolean) => void;
  workspacePath: string | null;
};

export const orchestrationDialogPropsFrom = (input: OrchestrationDialogPropsInput) => ({
  ...input.derived,
  approvalMode: input.approvalMode,
  error: input.error,
  launching: input.launching,
  onClose: () => {
    if (input.launching) return;
    input.setOpen(false);
    input.setError(null);
  },
  onLaunch: (children: OrchestrationChildDraft[]) => void input.launch(children),
  open: input.open,
  projectPath: input.workspacePath ?? "",
  provider: input.activeProvider ?? input.conversationProvider,
});
