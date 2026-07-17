import { invoke } from "@tauri-apps/api/core";
import type { deriveActiveAgentSessionState } from "./activeAgentSessionState";
import { applyChatRunEnvelope } from "./chatConversation";
import { createChatConversationActions } from "./chatConversationActions";
import { saveDurableChatConversation } from "./chatStore";
import { createComposerHarnessEventLog } from "./composerHarnessEvents";
import { createDevServerDetection } from "./devServerDetectionSurface";
import type { useAppShellDomain } from "./useAppShellDomain";
import { useChatRunEvents } from "./useChatRunEvents";
import type { useConversationRuntime } from "./useConversationRuntime";
import type { useWorkspaceDomain } from "./useWorkspaceDomain";
import { createWorkspaceCheckpoint } from "./workspaceCheckpoints";
import { activeProjectSessionId } from "./workspaceState";

type Cell = { t: string; f: [number, number, number]; b: [number, number, number]; bold: boolean };
type Snapshot = {
  cols: number; rows: number; cx: number; cy: number; cvis: boolean; sb: number; cells: Cell[];
};
type AppShell = ReturnType<typeof useAppShellDomain>;
type Conversation = ReturnType<typeof useConversationRuntime>;
type Workspace = ReturnType<typeof useWorkspaceDomain<Snapshot>>;

type ConversationBridgeInput = {
  activeAgentSession: ReturnType<typeof deriveActiveAgentSessionState>;
  activeChat: Conversation["activeChat"];
  agentActivityHook: Conversation["agentActivityHook"];
  browser: Conversation["browser"];
  chatIdForSession: (root: string, sessionId: string) => string;
  chatSearch: AppShell["chatSearch"];
  chrome: AppShell["chrome"];
  composerWorkspace: Workspace["composerWorkspace"];
  persistence: Workspace["persistence"];
  setLaunchError: (message: string | null) => void;
  switchSession: (root: string, sessionId: string) => Promise<unknown>;
  terminal: Workspace["terminal"];
  workspacePathRef: { current: string | null };
};

const conversationActionsFrom = (input: ConversationBridgeInput) => createChatConversationActions({
  createCheckpoint: createWorkspaceCheckpoint,
  getActiveChatId: () => input.activeChat.activeComposerHarnessKey,
  getConversations: () => input.composerWorkspace.chatConversationsRef.current,
  getForkContext: () => {
    const projectPath = input.workspacePathRef.current;
    return {
      browserUrl: input.browser.urlRef.current,
      projectPath,
      sessions: projectPath ? input.persistence.projectSessionsRef.current[projectPath] ?? [] : [],
      sessionsByProject: input.persistence.projectSessionsRef.current,
      sourceSessionId: activeProjectSessionId(
        input.persistence.activeSessionByProjectRef.current,
        input.persistence.projectSessionsRef.current, projectPath,
      ),
    };
  },
  now: Date.now,
  persistBrowserUrl: input.browser.persistUrl,
  persistSessions: (sessions) => input.persistence.persistProjectSessions(
    sessions, input.persistence.activeSessionByProjectRef.current,
  ),
  refreshSearch: input.chatSearch.refresh,
  reportPersistenceError: (message) => {
    input.setLaunchError(message);
    void invoke("log_health_event", { message }).catch(() => {});
  },
  saveConversation: saveDurableChatConversation,
  setConversations: input.composerWorkspace.setChatConversations,
  setError: input.setLaunchError,
  setNotice: input.chrome.setActionNotice,
  switchSession: input.switchSession,
});

const devServerDetectionFrom = (input: ConversationBridgeInput) => createDevServerDetection({
  approvalMode: (root, sessionId) =>
    input.composerWorkspace.composerHarnessBySessionRef.current[input.chatIdForSession(root, sessionId)]?.approvalMode ?? "ask",
  contextForPane: input.terminal.contextForPaneId,
  fallbackPanes: () => input.terminal.panesRef.current,
  fallbackRoot: () => input.workspacePathRef.current,
  fallbackSessionId: input.persistence.activeSessionForProject,
  getPrevious: () => input.browser.detectedServerRef.current,
  now: Date.now,
  recordActivity: input.agentActivityHook.recordAgentActivity,
  setDetectedServer: input.browser.setDetectedServer,
});

export const useAppConversationBridge = (input: ConversationBridgeInput) => {
  const chatConversationActions = conversationActionsFrom(input);
  useChatRunEvents((envelope) => {
    chatConversationActions.updateConversation(envelope.chatId, (conversation) =>
      applyChatRunEnvelope(conversation, envelope));
  });
  return {
    chatConversationActions,
    detectLocalDevServerFromSnapshot: devServerDetectionFrom(input),
    logComposerHarnessEvent: createComposerHarnessEventLog({
      getDescriptor: () => input.activeAgentSession.activeAgentSessionDescriptor,
      recordActivity: input.agentActivityHook.recordAgentActivity,
    }),
  };
};
