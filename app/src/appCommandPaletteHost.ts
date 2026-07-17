import type { AgentSessionHandle } from "./agentSessionHandle";
import type { deriveActiveAgentSessionState } from "./activeAgentSessionState";
import { assembleCommandPaletteCommands, visibleCommandPaletteCommands } from "./commandPaletteAssembly";
import type { CommandPaletteSourceSettings } from "./commandPaletteSources";
import type { createComposerSurface } from "./composerSurfaceController";
import { DRAWER_MODES } from "./drawerModes";
import type { deriveEditorWorkspaceState } from "./editorWorkspaceState";
import type { FileTreeNode } from "./fileTreeTypes";
import type { LaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import type { createProjectEntryActions } from "./projectEntryActions";
import type { createProjectSessionNavigationActions } from "./projectSessionNavigationActions";
import type { useAppShellDomain } from "./useAppShellDomain";
import type { useCommandPalette } from "./useCommandPalette";
import type { useComposerRuntime } from "./useComposerRuntime";
import type { useConversationRuntime } from "./useConversationRuntime";
import type { useQuickOpen } from "./useQuickOpen";
import type { useTerminalFind } from "./useTerminalFind";
import type { useWorkspaceDomain } from "./useWorkspaceDomain";
import type { wireEditorFileWorkflow } from "./editorFileWorkflowSurface";
import type { ChatSearchViewResult } from "./chatDiscovery";
import type { OpenProject } from "./workspaceState";
import type { WorktreeRecord } from "./worktrees";
import type { createTerminalSurfaceActions } from "./terminalSurfaceController";
import { activePaneDisplayLabel } from "./terminalPane";
import { shortcutKeys } from "./shortcuts";
import type { SideDrawerMode } from "./useShellLayout";

type WorkspaceDomain = ReturnType<typeof useWorkspaceDomain>;
type ShellDomain = ReturnType<typeof useAppShellDomain>;
type ConversationRuntime = ReturnType<typeof useConversationRuntime>;
type ComposerRuntime = ReturnType<typeof useComposerRuntime>;

type AppCommandPaletteHostInput = {
  activeAgentSession: ReturnType<typeof deriveActiveAgentSessionState>;
  activeAgentSessionHandle: AgentSessionHandle | null;
  activeChat: ConversationRuntime["activeChat"];
  attachSelectedFileToComposer: () => unknown;
  browser: ConversationRuntime["browser"];
  chatSearchViewResults: ChatSearchViewResult[];
  closeSelectedEditorTab: () => unknown;
  commandPalette: Pick<ReturnType<typeof useCommandPalette>, "query">;
  commandPaletteSources: CommandPaletteSourceSettings;
  composerAttachments: ComposerRuntime["composerAttachments"];
  composerSurface: ReturnType<typeof createComposerSurface>;
  editorFileWorkflow: ReturnType<typeof wireEditorFileWorkflow>;
  editorSession: WorkspaceDomain["editorSession"];
  editorSurface: { openEditorSearch: () => void };
  editorWorkspace: ReturnType<typeof deriveEditorWorkspaceState>;
  exportRenderPerfSnapshot: () => unknown;
  openChatSearchResult: (result: ChatSearchViewResult) => unknown;
  paneTranscripts: ShellDomain["paneTranscripts"];
  persistence: WorkspaceDomain["persistence"];
  profiles: WorkspaceDomain["profiles"];
  projectEntryActions: ReturnType<typeof createProjectEntryActions>;
  projectSessionNavigationActions: ReturnType<typeof createProjectSessionNavigationActions>;
  quickOpen: ReturnType<typeof useQuickOpen>;
  saveEditorFile: () => unknown;
  setOrchestrationError: ShellDomain["setOrchestrationError"];
  setOrchestrationOpen: ShellDomain["setOrchestrationOpen"];
  setSettingsOpen: ShellDomain["setSettingsOpen"];
  shellLayout: ShellDomain["shellLayout"];
  terminal: WorkspaceDomain["terminal"];
  terminalFind: ReturnType<typeof useTerminalFind>;
  terminalSurface: ReturnType<typeof createTerminalSurfaceActions>;
  visibleOpenProjects: OpenProject[];
  workspacePath: string | null;
  worktrees: WorktreeRecord[];
};

const navigationInput = (input: AppCommandPaletteHostInput) => ({
  drawerModes: DRAWER_MODES,
  editorTabs: input.editorSession.editorTabs,
  files: input.editorWorkspace.searchableFiles,
  onFocusWorktree: (paneId: number) => {
    input.shellLayout.setAgentSurfaceMode("terminal");
    void input.terminalSurface.focusTerminalPane(paneId);
  },
  onLayoutChange: input.shellLayout.setWorkbenchLayout,
  onOpenFile: (file: FileTreeNode) => void input.editorFileWorkflow.requestOpen(file, { focusEditor: true }),
  onShowDrawer: (mode: SideDrawerMode) => {
    input.shellLayout.setSideDrawerCollapsed(false);
    input.shellLayout.setSideDrawerMode(mode);
  },
  onTrayModeChange: input.shellLayout.setToolTrayMode,
  terminalPanes: input.terminal.panes,
  workbenchLayout: input.shellLayout.workbenchLayout,
  workspacePath: input.workspacePath,
  worktrees: input.worktrees,
});

const terminalInput = (input: AppCommandPaletteHostInput) => ({
  activePane: input.activeAgentSession.activeTerminalPane,
  activePaneLabel: activePaneDisplayLabel(input.terminal.panes, input.activeAgentSession.activeTerminalPane),
  canClose: Boolean(input.activeAgentSessionHandle),
  launchProfileChanging: input.profiles.changing,
  onClear: () => void input.terminalSurface.clearActiveTerminal(),
  onClose: () => { if (input.activeAgentSessionHandle) void input.activeAgentSessionHandle.close(); },
  onCreatePane: (profile: LaunchProfile) => void input.terminalSurface.createTerminalPane(profile),
  onCreateWorktreePane: (profile: LaunchProfile) => void input.terminalSurface.createWorktreePane(profile),
  onFind: () => input.terminalFind.setOpen(true),
  onKill: (pane: ManagedTerminalPane) => void input.terminalSurface.terminateTerminalPane(pane),
  onRemoveWorktree: (paneId: number) => void input.terminalSurface.closeWorktreePane(paneId),
  onRestart: (pane: ManagedTerminalPane) => void input.terminalSurface.restartTerminalPane(pane),
  shortcut: shortcutKeys,
  terminalProfile: input.profiles.terminalProfile,
  workspacePath: input.workspacePath,
  worktrees: input.worktrees,
});

const workbenchInput = (input: AppCommandPaletteHostInput) => ({
  activeComposerHarnessKey: input.activeChat.activeComposerHarnessKey,
  browserUrl: input.browser.url,
  detectedBrowserUrl: input.browser.activeDetectedServer?.url ?? null,
  editorDirty: input.editorWorkspace.editorDirty,
  editorLoading: input.editorSession.editorLoading,
  editorSaving: input.editorSession.editorSaving,
  onAttachCurrentFile: () => void input.attachSelectedFileToComposer(),
  onAttachPreview: () => void input.composerAttachments.attachPreview(),
  onCloseEditorTab: input.closeSelectedEditorTab,
  onExportPerformance: () => void input.exportRenderPerfSnapshot(),
  onFindEditor: input.editorSurface.openEditorSearch,
  onNewProject: () => void input.projectEntryActions.newProject(),
  onNewTask: () => void input.projectEntryActions.newTask(),
  onOpenDetectedBrowser: () => void input.browser.openDetectedServer(),
  onOpenSettings: () => input.setSettingsOpen(true),
  onOpenTranscripts: () => input.paneTranscripts.setTranscriptsOpen(true),
  onOpenWorkspace: () => void input.projectEntryActions.openProject(),
  onQuickOpen: input.quickOpen.openDialog,
  onReloadBrowser: input.browser.reload,
  onResetLayout: input.shellLayout.resetInterface,
  onSaveEditor: () => void input.saveEditorFile(),
  selectedFile: input.editorSession.selectedFile,
  shortcut: shortcutKeys,
  workspacePath: input.workspacePath,
});

const chatsInput = (input: AppCommandPaletteHostInput) => ({
  activeRun: Boolean(input.activeChat.activeChatConversation.activeRunId),
  activeSessionId: input.activeChat.activeSessionId,
  onOpenSearchResult: (result: ChatSearchViewResult) => void input.openChatSearchResult(result),
  onOpenSession: (projectPath: string, sessionId: string) =>
    void input.projectSessionNavigationActions.switchSession(projectPath, sessionId),
  onParallel: () => {
    input.setOrchestrationError(null);
    input.setOrchestrationOpen(true);
  },
  openProjects: input.visibleOpenProjects,
  projectSessions: input.persistence.projectSessions,
  searchResults: input.chatSearchViewResults,
  workspacePath: input.workspacePath,
});

export const appCommandPaletteInputsFrom = (input: AppCommandPaletteHostInput) => ({
  chats: chatsInput(input),
  navigation: navigationInput(input),
  runAppCommand: input.composerSurface.runComposerAppCommand,
  terminal: terminalInput(input),
  workbench: workbenchInput(input),
});

export const visibleAppCommandPaletteCommands = (input: AppCommandPaletteHostInput) =>
  visibleCommandPaletteCommands(
    assembleCommandPaletteCommands(appCommandPaletteInputsFrom(input)),
    input.commandPalette.query,
    input.commandPaletteSources,
  );
