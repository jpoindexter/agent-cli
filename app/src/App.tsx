import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useConversationRuntime } from "./useConversationRuntime";
import type { OpenProject, ProjectRailStatus, ProjectSession } from "./workspaceState";
import { appRuntimeMenusFrom } from "./appRuntimeMenuHost";
import { visibleAppCommandPaletteCommands } from "./appCommandPaletteHost";
import { useContextMenuHost } from "./useContextMenuHost";
import { createRenderPerfExport } from "./renderPerfExport";
import { createPaneTranscriptCapture } from "./paneTranscriptCapture";
import { deriveAppSurfaceLabels } from "./appSurfaceLabels";
import { useComposerRuntime } from "./useComposerRuntime";
import { visibleProjectsFrom } from "./projectRailView";
import {
  projectRailStatusFromConversations,
  projectSessionStatusFromConversations,
} from "./projectChatStatus";
import {
  setActiveKeybindingOverrides,
} from "./shortcuts";
import { useCommandPalette } from "./useCommandPalette";
import { useWorkspaceDomain } from "./useWorkspaceDomain";
import { activePaneDisplayLabel } from "./terminalPane";
import { useGitDiffReview } from "./useGitDiffReview";
import { useAppShellDomain } from "./useAppShellDomain";
import { useSyncRef } from "./useSyncRef";
import { useAgentHookRuntime } from "./useAgentHookRuntime";
import { useAppTerminalRuntime } from "./useAppTerminalRuntime";
import { useAppEditorSurfaceRuntime } from "./useAppEditorSurfaceRuntime";
import { appEditorMenusFrom } from "./appEditorMenuRuntime";
import { appWorkspaceProjectRuntimeFrom } from "./appWorkspaceProjectRuntime";
import { appProjectSessionRuntimeFrom } from "./appProjectSessionRuntime";
import { appComposerSurfaceRuntimeFrom } from "./appComposerSurfaceRuntime";
import { appTerminalSurfaceRuntimeFrom } from "./appTerminalSurfaceRuntime";
import { useAppConversationBridge } from "./useAppConversationBridge";
import { buildSettingsActions } from "./settingsActionsHost";
import { deriveActiveAgentSessionState } from "./activeAgentSessionState";
import { deriveEditorWorkspaceState } from "./editorWorkspaceState";
import { useTerminalFind } from "./useTerminalFind";
import { useEditorWorkspaceRuntime } from "./useEditorWorkspaceRuntime";
import { resetDurableChatStore } from "./chatStore";
import { useAppRootState } from "./useAppRootState";
import { useAppSearchRuntime } from "./useAppSearchRuntime";
import { AppWorkbenchView } from "./AppWorkbenchView";
import "./App.css";
import "./composerModelPicker.css";
import "./responsive-shell.css";
import "./workbenchTransitions.css";

// SPIKE-2 frontend: paint the grid snapshots from the Rust backend onto a canvas,
// and encode keydowns back into pty bytes. Ship-ugly on purpose.

type Cell = { t: string; f: [number, number, number]; b: [number, number, number]; bold: boolean };
type Snapshot = { cols: number; rows: number; cx: number; cy: number; cvis: boolean; sb: number; cells: Cell[] };
function App() {
  const {
    activeAgentSessionDescriptorRef, activeSessionLookupRef, agentHookStatus,
    aiConnectionSettingsRef, canvasRef,
    fileNodeContextMenuItemsRef, frame, imeInputRef, ipcSampleCounter, latest, launchError, metrics,
    persistPaneLayoutRef, projectCreationOpen, projectSwitcherOpen, railBodyRef, renderPerfRef,
    selection, selecting, setAgentHookStatus, setLaunchError, setProjectCreationOpen, setProjectSwitcherOpen,
    setWorkspacePath, storeRef, terminalHostRef, treeRef, workspacePath, workspacePathRef,
    worktreeLabelRequest,
  } = useAppRootState<Snapshot>();
  const {
    composerWorkspace, editorSession, persistence, profiles, terminal, workspaceTree,
  } = useWorkspaceDomain<Snapshot>({
    activeSessionLookupRef, persistPaneLayoutRef, storeRef, workspacePath, workspacePathRef,
  });
  const contextMenuHost = useContextMenuHost({
    buildFileNodeItems: (node) => fileNodeContextMenuItemsRef.current(node),
    onActionError: (item, error) => setLaunchError(`${item.label} failed: ${String(error)}`),
  });
  const commandPalette = useCommandPalette(() => contextMenuHost.setContextMenu(null));
  const {
    aiConnectionSettings, backgroundExits, chatSearch, chrome, commandPaletteSources,
    composerError, composerNotice, composerSending, drawerSearchQuery, focusedChatMessageId,
    gitStatusHook, keybindingOverrides, mcpOAuth, orchestrationError, orchestrationLaunching,
    openSettings, orchestrationOpen, paneTranscripts, projectEntryOpen, railHeight, setAiConnectionSettings, setBackgroundExits,
    setCommandPaletteSources, setComposerError, setComposerNotice, setComposerSending,
    setDrawerSearchQuery, setFocusedChatMessageId, setKeybindingOverrides, setOrchestrationError,
    setOrchestrationLaunching, setOrchestrationOpen, setSettingsOpen, setWorktrees,
    settingsInitialCategory, settingsOpen, settingsRuntime, shellLayout, worktrees,
  } = useAppShellDomain({
    commandPalette: { open: commandPalette.open, query: commandPalette.query },
    railBodyRef, storeRef, treeRefreshKey: workspaceTree.refreshKey, workspacePath, workspacePathRef,
  });
  const diffReviewHook = useGitDiffReview({
    gateAction: (action) => agentActivityHook.gateAppAction(action),
    getRoot: () => workspacePathRef.current ?? workspacePath,
    hasUnsaved: (path) => editorSurface.editorHasUnsavedBufferForPath(path),
    onRefreshFiles: workspaceTree.refresh,
    onStatus: (status, root) => { gitStatusHook.setStatus(status); gitStatusHook.setRoot(root); },
  });
  const editorWorkspace = deriveEditorWorkspaceState({
    diffReview: diffReviewHook.review, editorBuffers: editorSession.editorBuffersRef.current, editorError: editorSession.editorError, editorTabs: editorSession.editorTabs,
    editorText: editorSession.editorText, fileTree: workspaceTree.tree, gitStatus: gitStatusHook.status, gitStatusRoot: gitStatusHook.root, savedEditorText: editorSession.savedEditorText,
    selectedFile: editorSession.selectedFile, workspacePath,
  });
  const { chatSearchViewResults, drawerSearchResults, quickOpen } = useAppSearchRuntime<Snapshot>({
    chatSearch, commandPalette, composerWorkspace, contextMenuHost, drawerSearchQuery,
    editorWorkspace, persistence,
  });
  const { activeChat, agentApprovalMode, agentActivityHook, browser } = useConversationRuntime({
    activeAgentSessionDescriptorRef, composerWorkspace, persistence, profiles,
    shellLayout, storeRef, workspacePath, workspacePathRef,
  });
  const {
    attachSelectedFileToComposer, composerAttachments, composerLocal,
    composerMentionQuery, composerMentionResults,
  } = useComposerRuntime({
    activeChat, agentActivityHook, browser, composerWorkspace, editorSession,
    logEvent: (label, detail) => logComposerHarnessEvent(label, detail),
    profiles, searchableFiles: editorWorkspace.searchableFiles,
    setError: setComposerError, setNotice: setComposerNotice, shellLayout, workspacePathRef,
  });
  const activeAgentSession = deriveActiveAgentSessionState({
    activeSessionId: activeChat.activeSessionId, activeTerminalPaneId: terminal.activePaneId, agentActivityEvents: agentActivityHook.agentActivityEvents, agentActivityFilter: agentActivityHook.agentActivityFilter,
    agentApprovalMode, terminalPanes: terminal.panes, workspacePath,
  });
  const terminalFind = useTerminalFind(activeAgentSession.activeTerminalPane != null);
  useSyncRef(activeAgentSessionDescriptorRef, activeAgentSession.activeAgentSessionDescriptor);
  const activeTerminalProfile = activeAgentSession.activeTerminalPane?.profile ?? profiles.terminalProfile;
  const composerHarnessSessionKey = (root: string, sessionId: string) => `${root}\n${sessionId}`;

  const {
    chatConversationActions, detectLocalDevServerFromSnapshot, logComposerHarnessEvent,
  } = useAppConversationBridge({
    activeAgentSession, activeChat, agentActivityHook, browser,
    chatIdForSession: composerHarnessSessionKey, chatSearch, chrome, composerWorkspace, persistence,
    setLaunchError,
    switchSession: (root, sessionId) => projectSessionNavigationActions.switchSession(root, sessionId),
    terminal, workspacePathRef,
  });

  const {
    captureCurrentSessionSnapshot, projectCloseController, requestCloseProject,
    requestOpenWorkspace, workspaceOpenActions,
  } = appWorkspaceProjectRuntimeFrom({
    browser, chrome, composerLocal, composerWorkspace, connectionSettings: aiConnectionSettingsRef,
    editorSession, editorWorkspace, latest,
    openEditorFile: (file) => editorFileWorkflow.openDirect(file), persistence, profiles,
    projectEntryOpen, requestEditorNavigation: (navigation) => editorNavigation.requestNavigation(navigation),
    scheduleResize: () => setTimeout(sendTerminalResize, 0), setBackgroundExits,
    setLaunchError, setWorkspacePath, shellLayout, storeRef, terminal,
    workspacePathRef, workspaceTree,
  });

  const {
    finalizeCreatedTerminalPane, openChatSearchResult, paneActivityLog, pickWorkspace,
    projectEntryActions, projectSessionDeletionController, projectSessionMetadataActions,
    projectSessionNavigationActions,
  } = appProjectSessionRuntimeFrom({
    activeChat, agentActivityHook, agentApprovalMode, browser, captureCurrentSession: captureCurrentSessionSnapshot,
    chatSearch, chrome, composerLocal, composerWorkspace,
    createTerminalPane: (profile) => terminalSurface.createTerminalPane(profile),
    persistence, profiles, requestOpenWorkspace,
    scheduleResize: () => setTimeout(sendTerminalResize, 0), setFocusedChatMessageId,
    setLaunchError, setProjectCreationOpen, setProjectSwitcherOpen, shellLayout,
    storeRef, terminal, workspaceOpenActions, workspacePathRef,
  });

  const {
    chatRunControls, composerHistoryNavigation, composerSettingsActions, composerSurface,
  } = appComposerSurfaceRuntimeFrom({
    activeChat, agentActivityHook, chatConversationActions,
    chatIdForSession: composerHarnessSessionKey, composerLocal, composerSending, composerWorkspace,
    editorSession, getActiveHandle: () => activeAgentSessionHandle,
    getEditorSurface: () => editorSurface, getSaveEditorFile: () => saveEditorFile,
    getTerminalLabel: () => activeTerminalPaneLabel, getTerminalSurface: () => terminalSurface,
    logComposerHarnessEvent, persistence, pickWorkspace, profiles,
    projectSessionMetadata: projectSessionMetadataActions, settingsRef: aiConnectionSettingsRef,
    setActionNotice: chrome.setActionNotice, setComposerError, setComposerNotice, setComposerSending,
    setOrchestrationError, setOrchestrationLaunching, setOrchestrationOpen, workspacePathRef,
  });

  const {
    activeAgentSessionHandle, renameTerminalPane, sendTerminalResize,
    terminalSurface, utilityTrayControls,
  } = appTerminalSurfaceRuntimeFrom({
    activeAgentSession, agentActivityHook, agentApprovalMode,
    connectionSettings: aiConnectionSettingsRef, finalizeCreatedTerminalPane, latest, metrics,
    paneActivityLog, persistence, pickWorkspace, profiles,
    requestWorktreeLabel: worktreeLabelRequest.requestLabel, selection,
    setComposerError, setLaunchError, setSettingsOpen, setWorktrees, shellLayout,
    storeRef, terminal, terminalHostRef, worktrees, workspacePath, workspacePathRef,
  });

  const projectRailStatus = (project: OpenProject): ProjectRailStatus =>
    projectRailStatusFromConversations(composerWorkspace.chatConversations, project.path);

  const projectSessionsFor = (projectPath: string) => persistence.projectSessions[projectPath] ?? [];

  const projectSessionStatus = (projectPath: string, session: ProjectSession): ProjectRailStatus =>
    projectSessionStatusFromConversations(composerWorkspace.chatConversations, projectPath, session.id);

  const visibleOpenProjects = visibleProjectsFrom(persistence.openProjects, workspacePath, terminal.activeProjectStatus);

  const editorRuntime = useAppEditorSurfaceRuntime({
    activeAgentSession, agentActivityHook, chrome, diffReview: diffReviewHook,
    editorSession, editorWorkspace, gitStatus: gitStatusHook, persistence,
    projectClose: projectCloseController, shellLayout, workspaceOpen: workspaceOpenActions,
    workspacePath, workspacePathRef, workspaceTree,
  });
  const {
    editorFileWorkflow, editorNavigation, editorSurface, handleEditorUpdate,
    saveEditorFile, tabIsDirty, workspaceFileActions,
  } = editorRuntime;

  const {
    diffContextMenuItems, editorContextMenuItems, editorTabContextMenuItems,
    projectRailContextMenuItems, projectSessionContextMenuItems,
    workspaceContextMenuActions, workspaceContextMenuItems,
  } = appEditorMenusFrom({
    activeChat, agentActivityHook, chrome, composerHarnessSessionKey, composerSurface,
    composerWorkspace, deleteSession: projectSessionDeletionController.deleteProjectSession,
    diffReview: diffReviewHook, editor: editorRuntime, editorSession, editorWorkspace,
    fileNodeItemsRef: fileNodeContextMenuItemsRef, gitStatus: gitStatusHook, persistence,
    projectEntry: projectEntryActions, projectSessionMetadata: projectSessionMetadataActions,
    projectSessions: projectSessionNavigationActions,
    requestCloseProject, setError: setLaunchError, workspacePath, workspacePathRef, workspaceTree,
  });

  const saveActivePaneTranscript = createPaneTranscriptCapture({
    getActivePane: () => activeAgentSession.activeTerminalPane,
    getPanes: () => terminal.panes,
    getRoot: () => workspacePathRef.current,
    getSessionId: () => activeChat.activeSessionId,
    getSnapshot: (paneId) => terminal.snapshotsRef.current[paneId],
    now: Date.now,
    persist: paneTranscripts.persistPaneTranscript,
  });

  const exportRenderPerfSnapshot = createRenderPerfExport({
    createFile: (root, parent, name) => invoke("create_workspace_file", { root, parent, name }),
    getPaneCount: (root) => terminal.panesForSession(root).length,
    getPerfState: () => renderPerfRef.current,
    getRoot: () => workspacePathRef.current,
    now: () => new Date().toISOString(),
    setError: setLaunchError,
    writeFile: (root, path, content, expectedModifiedMs) =>
      invoke("write_text_file", { root, path, content, expectedModifiedMs }),
  });

  const { appMenuAssembly, terminalContextMenuItems } = appRuntimeMenusFrom({
    activeAgentSession, activeAgentSessionHandle, activeChat, attachSelectedFileToComposer,
    browser, chatRunControls, chrome, composerAttachments, composerLocal, composerSending,
    composerSurface, contextMenuHost, editorSession, editorSurface, profiles, renameTerminalPane,
    saveActivePaneTranscript, setOrchestrationError, setOrchestrationOpen, shellLayout, terminal,
    terminalSurface, workspacePath, worktrees,
  });

  const visiblePaletteCommands = visibleAppCommandPaletteCommands({
    activeAgentSession, activeAgentSessionHandle, activeChat, attachSelectedFileToComposer,
    browser, chatSearchViewResults,
    closeSelectedEditorTab: () => { if (editorSession.selectedFile) void editorNavigation.closeTab(editorSession.selectedFile); },
    commandPalette, commandPaletteSources, composerAttachments, composerSurface,
    editorFileWorkflow, editorSession, editorSurface, editorWorkspace, exportRenderPerfSnapshot,
    openChatSearchResult, paneTranscripts, persistence, profiles, projectEntryActions,
    projectSessionNavigationActions, quickOpen, saveEditorFile, setOrchestrationError,
    setOrchestrationOpen, setSettingsOpen, shellLayout, terminal, terminalFind, terminalSurface,
    visibleOpenProjects, workspacePath, worktrees,
  });
  useAgentHookRuntime({
    activeChat, agentActivityHook, editorFileWorkflow, editorSession, persistence,
    setStatus: setAgentHookStatus, terminal, terminalSurface, workspacePath, workspacePathRef,
  });

  useEditorWorkspaceRuntime({
    editorFileWorkflow, editorSession, editorWorkspace, persistence, treeRef,
    workspacePath, workspacePathRef, workspaceTree,
  });

  useAppTerminalRuntime({
    approvalMode: agentApprovalMode, browser, commandPalette,
    detectLocalServer: detectLocalDevServerFromSnapshot, pickWorkspace, projectEntryActions,
    quickOpen, recordActivity: agentActivityHook.recordAgentActivity,
    sendResize: sendTerminalResize, setAgentActivity: agentActivityHook.setAgentActivityEvents,
    setError: setLaunchError, setSettingsOpen,
    shell: {
      chrome, mcpOAuth, paneTranscripts, setAiConnectionSettings, setBackgroundExits,
      setCommandPaletteSources, setKeybindingOverrides, setWorktrees,
    },
    workspace: { composerWorkspace, editorSession, persistence, profiles, terminal },
    workspaceOpenActions, workspacePathRef,
    refs: {
      aiConnectionSettings: aiConnectionSettingsRef, canvas: canvasRef, frame, imeInput: imeInputRef,
      ipcSampleCounter, latest, metrics, renderPerf: renderPerfRef, selection, selecting,
      store: storeRef, terminalHost: terminalHostRef,
    },
  });

  const activeTerminalPaneLabel = activePaneDisplayLabel(terminal.panes, activeAgentSession.activeTerminalPane);
  const surfaceLabels = deriveAppSurfaceLabels({
    activeRunId: activeChat.activeChatConversation.activeRunId,
    activeSessionId: activeChat.activeSessionId,
    sessions: projectSessionsFor(workspacePath ?? ""),
    trayMode: shellLayout.utilityTrayMode,
    workspacePath,
  });
  const { settingsConnectionActions, settingsPreferenceActions, settingsScopedActions } = buildSettingsActions({
    aiConnectionSettingsRef, browser, chrome, commandPaletteSources, composerSettingsActions,
    composerWorkspace, keybindingOverrides, mcpOAuth, persistence, profiles,
    resetDurableChats: resetDurableChatStore, setActiveKeybindingOverrides, setAiConnectionSettings,
    setCommandPaletteSources, setKeybindingOverrides, storeRef, workspacePath, workspacePathRef,
  });

  return <AppWorkbenchView {...{
    activeAgentSession, activeAgentSessionHandle, activeChat, activeTerminalProfile,
    agentHookStatus, aiConnectionSettings, appMenuAssembly, backgroundExits, browser,
    chatConversationActions, chatRunControls, chatSearch, chrome, commandPalette,
    commandPaletteSources, composerAttachments, composerError, composerHistoryNavigation,
    composerLocal, composerMentionQuery, composerMentionResults, composerNotice, composerSending,
    composerSettingsActions, composerSurface, composerWorkspace,
    connectionActions: settingsConnectionActions,
    contextMenuElement: contextMenuHost.element, contextMenuHost, diffContextMenuItems,
    diffReviewHook, drawerSearchQuery, drawerSearchResults, editorContextMenuItems,
    editorFileWorkflow, editorNavigation, editorSession, editorSurface, editorTabContextMenuItems,
    editorWorkspace, focusedChatMessageId, gitStatusHook, handleEditorUpdate, imeInputRef,
    keybindingOverrides, launchError, mcpOAuth, openSettings, openUrl, orchestrationError,
    orchestrationLaunching, orchestrationOpen, paneTranscripts, persistence, pickWorkspace,
    preferenceActions: settingsPreferenceActions, profiles, projectCreationOpen,
    projectEntryActions, projectEntryOpen, projectRailContextMenuItems, projectRailStatus,
    projectSessionContextMenuItems, projectSessionNavigationActions, projectSessionStatus,
    projectSwitcherOpen, quickOpen, railBodyRef, railHeight, renameTerminalPane,
    requestOpenWorkspace, saveEditorFile, scopedActions: settingsScopedActions,
    setComposerNotice, setDrawerSearchQuery, setOrchestrationError, setOrchestrationOpen,
    setProjectCreationOpen, setProjectSwitcherOpen, setSettingsOpen, settingsInitialCategory,
    settingsOpen, settingsRuntime, shellLayout, surfaceLabels, tabIsDirty, terminal,
    terminalContextMenuItems, terminalFind, terminalHostRef, terminalSurface, treeRef,
    utilityTrayControls, visibleOpenProjects, visiblePaletteCommands,
    workspaceContextMenuActions, workspaceContextMenuItems, workspaceFileActions,
    workspacePath, workspaceTree, worktreeLabelDialog: worktreeLabelRequest.dialog, worktrees,
    canvasRef,
  }} />;
}

export default App;
