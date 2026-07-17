import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { openUrl } from "@tauri-apps/plugin-opener";
import { createAppMenuAssembly } from "./appMenuAssembly";
import type { AgentSessionHandle } from "./agentSessionHandle";
import type { deriveActiveAgentSessionState } from "./activeAgentSessionState";
import type { createChatRunControls } from "./chatRunControls";
import type { createComposerSurface } from "./composerSurfaceController";
import { defaultTerminalLaunchProfile } from "./launchProfiles";
import type { ManagedTerminalPane } from "./managedTerminalPane";
import { shortcutKeys } from "./shortcuts";
import { buildTerminalContextMenuItems } from "./terminalContextMenu";
import type { createTerminalSurfaceActions } from "./terminalSurfaceController";
import type { useAppShellDomain } from "./useAppShellDomain";
import type { useComposerRuntime } from "./useComposerRuntime";
import type { useContextMenuHost } from "./useContextMenuHost";
import type { useConversationRuntime } from "./useConversationRuntime";
import type { useWorkspaceDomain } from "./useWorkspaceDomain";
import { worktreeForPaneId, type WorktreeRecord } from "./worktrees";

type WorkspaceDomain = ReturnType<typeof useWorkspaceDomain>;
type ShellDomain = ReturnType<typeof useAppShellDomain>;
type ConversationRuntime = ReturnType<typeof useConversationRuntime>;
type ComposerRuntime = ReturnType<typeof useComposerRuntime>;

type AppRuntimeMenuInput = {
  activeAgentSession: ReturnType<typeof deriveActiveAgentSessionState>;
  activeAgentSessionHandle: AgentSessionHandle | null;
  activeChat: ConversationRuntime["activeChat"];
  attachSelectedFileToComposer: () => unknown;
  browser: ConversationRuntime["browser"];
  chatRunControls: ReturnType<typeof createChatRunControls>;
  chrome: ShellDomain["chrome"];
  composerAttachments: ComposerRuntime["composerAttachments"];
  composerLocal: ComposerRuntime["composerLocal"];
  composerSending: boolean;
  composerSurface: ReturnType<typeof createComposerSurface>;
  contextMenuHost: ReturnType<typeof useContextMenuHost>;
  editorSession: WorkspaceDomain["editorSession"];
  editorSurface: { copyPath: (path: string) => unknown };
  profiles: WorkspaceDomain["profiles"];
  renameTerminalPane: (pane: ManagedTerminalPane) => unknown;
  saveActivePaneTranscript: () => unknown;
  setOrchestrationError: ShellDomain["setOrchestrationError"];
  setOrchestrationOpen: ShellDomain["setOrchestrationOpen"];
  shellLayout: ShellDomain["shellLayout"];
  terminal: WorkspaceDomain["terminal"];
  terminalSurface: ReturnType<typeof createTerminalSurfaceActions>;
  workspacePath: string | null;
  worktrees: WorktreeRecord[];
};

const browserMenuInput = (input: AppRuntimeMenuInput) => ({
  back: () => input.browser.goHistory(-1),
  canGoBack: input.browser.canGoBack,
  canGoForward: input.browser.canGoForward,
  forward: () => input.browser.goHistory(1),
  openExternal: () => openUrl(input.browser.url),
  reload: input.browser.reload,
  url: input.browser.url,
});

const composerMenuInput = (input: AppRuntimeMenuInput) => ({
  activeRun: Boolean(input.activeChat.activeChatConversation.activeRunId),
  attachCurrent: input.attachSelectedFileToComposer,
  attachLocal: input.composerAttachments.attachLocalFiles,
  attachPreview: input.composerAttachments.attachPreview,
  canAttachCurrent: Boolean(input.editorSession.selectedFile),
  canRunParallel: Boolean(input.workspacePath && input.activeChat.activeSessionId && !input.activeChat.activeChatConversation.activeRunId),
  clearDraft: () => input.composerLocal.setLocalState(input.activeChat.activeComposerHarnessKey, "", input.composerLocal.history),
  copyWorkspace: () => input.workspacePath ? input.editorSurface.copyPath(input.workspacePath) : undefined,
  draft: input.composerLocal.draft,
  hasWorkspace: Boolean(input.workspacePath),
  parallel: () => {
    input.setOrchestrationError(null);
    input.setOrchestrationOpen(true);
  },
  send: input.composerSurface.submitComposerDraft,
  sending: input.composerSending,
  shortcut: shortcutKeys("composer.send"),
  stop: input.chatRunControls.stopActiveChatRun,
});

const paneMenuInput = (input: AppRuntimeMenuInput) => ({
  activePaneId: input.terminal.activePaneId,
  changing: input.profiles.changing,
  close: (pane: ManagedTerminalPane) => input.terminalSurface.closeTerminalPane(pane.id),
  copyCwd: (pane: ManagedTerminalPane) => input.editorSurface.copyPath(pane.cwd),
  focus: (pane: ManagedTerminalPane) => input.terminalSurface.focusTerminalPane(pane.id),
  hasWorktree: (pane: ManagedTerminalPane) => Boolean(worktreeForPaneId(input.worktrees, String(pane.id))),
  kill: (pane: ManagedTerminalPane) => input.terminalSurface.terminateTerminalPane(pane),
  removeWorktree: (pane: ManagedTerminalPane) => input.terminalSurface.closeWorktreePane(pane.id),
  rename: input.renameTerminalPane,
  restart: (pane: ManagedTerminalPane) => input.terminalSurface.restartTerminalPane(pane),
});

const trayMenuInput = (input: AppRuntimeMenuInput) => ({
  activeMode: input.shellLayout.utilityTrayMode,
  activePaneState: input.activeAgentSession.activeTerminalPane?.state ?? null,
  activeSurface: input.shellLayout.agentSurfaceMode === "terminal",
  closePane: () => input.activeAgentSession.activeTerminalPane
    ? input.terminalSurface.closeTerminalPane(input.activeAgentSession.activeTerminalPane.id) : undefined,
  createShell: () => input.terminalSurface.createTerminalPane(defaultTerminalLaunchProfile()),
  hasActivePane: Boolean(input.activeAgentSession.activeTerminalPane),
  hasWorkspace: Boolean(input.workspacePath),
  hide: () => input.shellLayout.setAgentSurfaceMode("chat"),
  killPane: () => input.activeAgentSession.activeTerminalPane
    ? input.terminalSurface.terminateTerminalPane(input.activeAgentSession.activeTerminalPane) : undefined,
  launchProfileChanging: input.profiles.changing,
  restartPane: () => input.activeAgentSession.activeTerminalPane
    ? input.terminalSurface.restartTerminalPane(input.activeAgentSession.activeTerminalPane) : undefined,
  show: (mode: Parameters<typeof input.shellLayout.setUtilityTrayMode>[0]) => {
    input.shellLayout.setUtilityTrayMode(mode);
    input.shellLayout.setAgentSurfaceMode("terminal");
  },
});

const terminalContextMenuItems = (input: AppRuntimeMenuInput) => () => buildTerminalContextMenuItems({
  activePaneState: input.activeAgentSession.activeTerminalPane?.state ?? null,
  hasActiveHandle: Boolean(input.activeAgentSessionHandle),
  hasActivePane: Boolean(input.activeAgentSession.activeTerminalPane),
  hasSelection: Boolean(input.terminalSurface.terminalSelectedText()),
  hasWorkspace: Boolean(input.workspacePath),
  hasWorktreeForActivePane: Boolean(input.activeAgentSession.activeTerminalPane
    && worktreeForPaneId(input.worktrees, String(input.activeAgentSession.activeTerminalPane.id))),
  launchProfileChanging: input.profiles.changing,
  launchProfileLabel: input.profiles.terminalProfile.label,
  shortcuts: {
    clear: shortcutKeys("terminal.clear"),
    copy: shortcutKeys("terminal.copy-selection"),
    paste: shortcutKeys("terminal.paste"),
  },
  actions: {
    clear: input.terminalSurface.clearActiveTerminal,
    closePane: () => input.activeAgentSessionHandle?.close(),
    copySelection: async () => { await input.terminalSurface.copyTerminalSelection(); input.chrome.setActionNotice("Copied terminal selection"); },
    copyTail: async () => { await input.terminalSurface.copyActivePaneTail(); input.chrome.setActionNotice("Copied last 20 lines"); },
    copyWorkingDirectory: () => input.workspacePath ? input.editorSurface.copyPath(input.workspacePath) : undefined,
    createPane: () => input.terminalSurface.createTerminalPane(input.profiles.terminalProfile),
    createWorktreePane: () => input.terminalSurface.createWorktreePane(input.profiles.terminalProfile),
    interrupt: input.terminalSurface.interruptActivePane,
    killPane: () => input.activeAgentSession.activeTerminalPane ? input.terminalSurface.terminateTerminalPane(input.activeAgentSession.activeTerminalPane) : undefined,
    paste: input.terminalSurface.pasteIntoTerminal,
    removeWorktree: () => input.activeAgentSession.activeTerminalPane ? input.terminalSurface.closeWorktreePane(input.activeAgentSession.activeTerminalPane.id) : undefined,
    renamePane: () => input.activeAgentSession.activeTerminalPane ? input.renameTerminalPane(input.activeAgentSession.activeTerminalPane) : undefined,
    restartPane: () => input.activeAgentSession.activeTerminalPane ? input.terminalSurface.restartTerminalPane(input.activeAgentSession.activeTerminalPane) : undefined,
    saveTranscript: input.saveActivePaneTranscript,
  },
});

export const appRuntimeMenusFrom = (input: AppRuntimeMenuInput) => ({
  appMenuAssembly: createAppMenuAssembly({
    activityLog: () => input.activeAgentSession.selectedAgentActivityLog,
    browser: browserMenuInput(input),
    composer: composerMenuInput(input),
    copyText: writeText,
    notify: input.chrome.setActionNotice,
    pane: paneMenuInput(input),
    setContextMenu: input.contextMenuHost.setContextMenu,
    tray: trayMenuInput(input),
  }),
  terminalContextMenuItems: terminalContextMenuItems(input),
});
