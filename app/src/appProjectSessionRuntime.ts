import { invoke } from "@tauri-apps/api/core";
import { confirm as confirmDialog, open } from "@tauri-apps/plugin-dialog";
import { load } from "@tauri-apps/plugin-store";
import type { AgentApprovalMode } from "./agentSessionHandle";
import { DEFAULT_BROWSER_PREVIEW_URL } from "./browserPreview";
import { deleteDurableChatConversation } from "./chatStore";
import { createChatSearchNavigation } from "./chatSearchNavigation";
import { defaultTerminalLaunchProfile, type LaunchProfile } from "./launchProfiles";
import { createPaneActivityLog } from "./paneActivityLog";
import { createProjectEntryActions } from "./projectEntryActions";
import {
  createProjectSessionDeletionController, projectSessionDeletionFromHook,
} from "./projectSessionDeletionController";
import { createProjectSessionMetadataActions } from "./projectSessionMetadataActions";
import { createProjectSessionNavigationActions } from "./projectSessionNavigationActions";
import type { createSessionSnapshotCapture } from "./sessionSnapshotCapture";
import { createTerminalPaneFinalize } from "./terminalPaneFinalize";
import type { useAppShellDomain } from "./useAppShellDomain";
import type { useComposerRuntime } from "./useComposerRuntime";
import type { useConversationRuntime } from "./useConversationRuntime";
import type { useWorkspaceDomain } from "./useWorkspaceDomain";
import type { createWorkspaceOpenSurface } from "./workspaceOpenSurface";
import { createWorkspacePicker } from "./workspacePicker";

type Cell = { t: string; f: [number, number, number]; b: [number, number, number]; bold: boolean };
type Snapshot = {
  cols: number; rows: number; cx: number; cy: number; cvis: boolean; sb: number; cells: Cell[];
};
type AppShell = ReturnType<typeof useAppShellDomain>;
type Conversation = ReturnType<typeof useConversationRuntime>;
type ComposerRuntime = ReturnType<typeof useComposerRuntime>;
type Workspace = ReturnType<typeof useWorkspaceDomain<Snapshot>>;

type ProjectSessionRuntimeInput = {
  activeChat: Conversation["activeChat"];
  agentActivityHook: Conversation["agentActivityHook"];
  agentApprovalMode: AgentApprovalMode;
  browser: Conversation["browser"];
  captureCurrentSession: ReturnType<typeof createSessionSnapshotCapture>;
  chatSearch: AppShell["chatSearch"];
  chrome: AppShell["chrome"];
  composerWorkspace: Workspace["composerWorkspace"];
  composerLocal: ComposerRuntime["composerLocal"];
  createTerminalPane: (profile: LaunchProfile) => Promise<boolean>;
  persistence: Workspace["persistence"];
  profiles: Workspace["profiles"];
  requestOpenWorkspace: (path: string) => Promise<boolean>;
  scheduleResize: () => void;
  setFocusedChatMessageId: AppShell["setFocusedChatMessageId"];
  setLaunchError: (message: string | null) => void;
  setProjectCreationOpen: (open: boolean) => void;
  setProjectSwitcherOpen: (open: boolean) => void;
  shellLayout: AppShell["shellLayout"];
  storeRef: { current: Awaited<ReturnType<typeof load>> | null };
  terminal: Workspace["terminal"];
  workspaceOpenActions: ReturnType<typeof createWorkspaceOpenSurface>;
  workspacePathRef: { current: string | null };
};

const sessionNavigationFrom = (input: ProjectSessionRuntimeInput) => createProjectSessionNavigationActions({
  captureCurrentSession: input.captureCurrentSession,
  defaultBrowserUrl: DEFAULT_BROWSER_PREVIEW_URL,
  flushComposer: input.composerLocal.flush,
  getPreviousStatus: input.terminal.activeSessionStatus,
  getState: () => ({
    activeSessions: input.persistence.activeSessionByProjectRef.current,
    browserUrl: input.browser.urlRef.current,
    browserUrlsByProject: input.browser.projectRecordsRef.current,
    currentRoot: input.workspacePathRef.current,
    sessions: input.persistence.projectSessionsRef.current,
  }),
  getTargetStatus: (root, sessionId) => input.terminal.statusForPanes(
    input.terminal.panesForSession(root, sessionId),
  ),
  now: Date.now,
  openProject: async (root, sameProject) => {
    if (sameProject) await input.workspaceOpenActions.openWorkspaceDirect(
      root, input.profiles.launchProfileRef.current, { captureCurrentSession: false },
    );
    else await input.requestOpenWorkspace(root);
  },
  persistBrowserUrl: input.browser.persistUrl,
  persistSessions: input.persistence.persistProjectSessions,
  promptTitle: (title) => window.prompt("Chat name", title),
  setFocusedMessage: input.setFocusedChatMessageId,
});

const sessionDeletionFrom = (input: ProjectSessionRuntimeInput) => createProjectSessionDeletionController(
  projectSessionDeletionFromHook(input.terminal, {
    activeSessionId: input.activeChat.activeSessionId,
    activeSessions: input.persistence.activeSessionByProjectRef,
    browserSessions: input.browser.sessionRecordsRef,
    closePane: (paneId) => invoke("close_pane", { paneId }),
    composerHarness: input.composerWorkspace.composerHarnessBySessionRef,
    confirmDelete: confirmDialog,
    conversations: input.composerWorkspace.chatConversationsRef,
    deleteHistory: deleteDurableChatConversation,
    persistBrowserSessions: async (records) => {
      await input.storeRef.current?.set("browserPreviewBySession", records);
    },
    persistComposerHarness: input.composerWorkspace.persistComposerHarnessRecords,
    persistSessions: input.persistence.persistProjectSessions,
    removePersistedRestore: input.persistence.removeSessionRestore,
    reopenActiveWorkspace: (root) => input.workspaceOpenActions.openWorkspaceDirect(
      root, input.profiles.launchProfileRef.current, { captureCurrentSession: false },
    ),
    sessions: input.persistence.projectSessionsRef,
    setBrowserSessions: input.browser.setSessionRecords,
    setConversations: input.composerWorkspace.setChatConversations,
    setError: input.setLaunchError,
    workspacePath: input.workspacePathRef,
  }),
);

const paneRuntimeFrom = (input: ProjectSessionRuntimeInput) => ({
  paneActivityLog: createPaneActivityLog({
    approvalMode: () => input.agentApprovalMode,
    recordActivity: input.agentActivityHook.recordAgentActivity,
  }),
  finalizeCreatedTerminalPane: createTerminalPaneFinalize({
    getProjectStatus: input.terminal.projectStatusForRoot,
    persistProfile: async (profile) => {
      await input.storeRef.current?.set("terminalLaunchProfile", profile);
      await input.storeRef.current?.save();
    },
    scheduleResize: input.scheduleResize,
    setError: input.setLaunchError,
    setTerminalProfile: input.profiles.setTerminalProfile,
    statusForPanes: input.terminal.statusForPanes,
    updateProjectStatus: input.persistence.updateOpenProjectStatus,
    updateSessionStatus: input.persistence.updateActiveSessionStatus,
  }),
});

const entryRuntimeFrom = (
  input: ProjectSessionRuntimeInput,
  sessions: ReturnType<typeof sessionNavigationFrom>,
) => {
  const pickWorkspace = createWorkspacePicker({
    createTerminalPane: input.createTerminalPane,
    defaultProfile: defaultTerminalLaunchProfile,
    openDirectoryDialog: () => open({ directory: true }),
    requestOpenWorkspace: input.requestOpenWorkspace,
  });
  const projectEntryActions = createProjectEntryActions({
    beginCreateProject: async () => { input.setProjectCreationOpen(true); return true; },
    createTask: sessions.createSession,
    getActiveProject: () => input.workspacePathRef.current,
    openProjectEntry: async () => {
      input.shellLayout.setSideDrawerMode("projects");
      input.shellLayout.setSideDrawerCollapsed(false);
      input.setProjectSwitcherOpen(true);
      return true;
    },
    openProjectPicker: pickWorkspace,
    switchProjectPath: input.requestOpenWorkspace,
  });
  return { pickWorkspace, projectEntryActions };
};

export const appProjectSessionRuntimeFrom = (input: ProjectSessionRuntimeInput) => {
  const projectSessionNavigationActions = sessionNavigationFrom(input);
  const entry = entryRuntimeFrom(input, projectSessionNavigationActions);
  const pane = paneRuntimeFrom(input);
  return {
    ...entry,
    ...pane,
    openChatSearchResult: createChatSearchNavigation({
      focusMessage: input.setFocusedChatMessageId,
      getSessions: () => input.persistence.projectSessionsRef.current,
      setError: input.chatSearch.setError,
      showArchived: () => input.persistence.setShowArchivedSessions(true),
      showProjectsDrawer: () => input.shellLayout.setSideDrawerMode("projects"),
      switchSession: projectSessionNavigationActions.switchSession,
    }),
    projectSessionDeletionController: sessionDeletionFrom(input),
    projectSessionMetadataActions: createProjectSessionMetadataActions({
      getActiveSessions: () => input.persistence.activeSessionByProjectRef.current,
      getSessions: () => input.persistence.projectSessionsRef.current,
      notify: input.chrome.setActionNotice,
      now: Date.now,
      persist: input.persistence.persistProjectSessions,
    }),
    projectSessionNavigationActions,
  };
};
