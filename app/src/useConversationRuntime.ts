import { confirm as confirmDialog } from "@tauri-apps/plugin-dialog";
import type { AgentApprovalMode, AgentSessionHandleDescriptor } from "./agentSessionHandle";
import { deriveActiveChatState } from "./activeChatState";
import { useAgentActivityController } from "./useAgentActivityController";
import { useBrowserPreviewController } from "./useBrowserPreviewController";
import type { useShellLayout } from "./useShellLayout";
import type { useWorkspaceDomain } from "./useWorkspaceDomain";
import { activeProjectSessionId } from "./workspaceState";

type WorkspaceDomain = ReturnType<typeof useWorkspaceDomain>;
type Ref<T> = { current: T };

type ConversationRuntimeOptions = {
  activeAgentSessionDescriptorRef: Ref<AgentSessionHandleDescriptor | null>;
  composerWorkspace: WorkspaceDomain["composerWorkspace"];
  persistence: WorkspaceDomain["persistence"];
  profiles: WorkspaceDomain["profiles"];
  shellLayout: ReturnType<typeof useShellLayout>;
  storeRef: Ref<{ save: () => Promise<unknown>; set: (key: string, value: unknown) => Promise<unknown> } | null>;
  workspacePath: string | null;
  workspacePathRef: Ref<string | null>;
};

export const useConversationRuntime = (options: ConversationRuntimeOptions) => {
  const { composerWorkspace, persistence, profiles, shellLayout, storeRef, workspacePath, workspacePathRef } = options;
  const activeChat = deriveActiveChatState({
    activeSessionByProject: persistence.activeSessionByProject, chatConversations: composerWorkspace.chatConversations, composerHarnessBySession: composerWorkspace.composerHarnessBySession,
    launchProfileId: profiles.launchProfile.id, projectSessions: persistence.projectSessions,
    resolveLaunchProfile: profiles.resolveProfile,
    scopedSettings: composerWorkspace.scopedSettings, workspacePath,
  });
  const agentApprovalMode: AgentApprovalMode = activeChat.activeComposerHarness.approvalMode;
  const agentActivityHook = useAgentActivityController({
    activeAgentDescriptor: options.activeAgentSessionDescriptorRef,
    activeProviderId: activeChat.activeComposerProvider,
    activeProviderLabel: activeChat.activeComposerProviderLabel,
    approvalMode: agentApprovalMode,
    confirmAction: (_action, message) => confirmDialog(message),
    getChatApprovalMode: (root, sessionId) =>
      composerWorkspace.composerHarnessBySessionRef.current[`${root}\n${sessionId}`]?.approvalMode ?? "ask",
    getRoot: () => workspacePathRef.current,
    getSessionId: (root) => activeProjectSessionId(
      persistence.activeSessionByProjectRef.current, persistence.projectSessionsRef.current, root,
    ),
    persistEvents: (events) => {
      void storeRef.current?.set("agentActivityEvents", events);
      void storeRef.current?.save();
    },
  });
  const browser = useBrowserPreviewController({
    activeRoot: workspacePath,
    activeSessionId: activeChat.activeSessionId,
    ensureVisible: () => {
      if (shellLayout.workbenchLayout === "hidden") shellLayout.setWorkbenchLayout("right");
      if (shellLayout.toolTrayMode === "editor") shellLayout.setToolTrayMode("browser");
    },
    gateAction: async (action) => (await agentActivityHook.gateAppAction(action)).decision,
    getCurrentRoot: () => workspacePathRef.current,
    getCurrentSessionId: () => activeProjectSessionId(
      persistence.activeSessionByProjectRef.current, persistence.projectSessionsRef.current, workspacePathRef.current,
    ),
    saveStore: async () => { await storeRef.current?.save(); },
    scopedSettings: composerWorkspace.scopedSettingsRef,
    setScopedSettings: composerWorkspace.setScopedSettings,
    setStoreValue: async (key, value) => { await storeRef.current?.set(key, value); },
  });
  return { activeChat, agentApprovalMode, agentActivityHook, browser };
};
