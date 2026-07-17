import { appComposerSurfaceRuntimeFrom } from "./appComposerSurfaceRuntime";
import { appTerminalSurfaceRuntimeFrom } from "./appTerminalSurfaceRuntime";
import type { useAppEditorSurfaceRuntime } from "./useAppEditorSurfaceRuntime";
import type { useAppFoundationRuntime } from "./useAppFoundationRuntime";
import type { useAppProjectRuntime } from "./useAppProjectRuntime";

type Cell = { t: string; f: [number, number, number]; b: [number, number, number]; bold: boolean };
type Snapshot = { cols: number; rows: number; cx: number; cy: number; cvis: boolean; sb: number; cells: Cell[] };
type EditorRuntime = ReturnType<typeof useAppEditorSurfaceRuntime>;
type Foundation = ReturnType<typeof useAppFoundationRuntime<Snapshot>>;
type ProjectRuntime = ReturnType<typeof useAppProjectRuntime>;

type InteractionSurfaceRuntimeInput = {
  foundation: Foundation;
  getEditorSurface: () => EditorRuntime["editorSurface"];
  getSaveEditorFile: () => EditorRuntime["saveEditorFile"];
  getTerminalLabel: () => string | null;
  project: ProjectRuntime;
};

export const appInteractionSurfaceRuntimeFrom = (input: InteractionSurfaceRuntimeInput) => {
  const { foundation, project } = input;
  const { root, shell, workspace } = foundation;
  let terminalRuntime!: ReturnType<typeof appTerminalSurfaceRuntimeFrom>;
  const composerRuntime = appComposerSurfaceRuntimeFrom({
    ...foundation.conversation, chatConversationActions: project.chatConversationActions,
    chatIdForSession: project.chatIdForSession, composerLocal: foundation.composer.composerLocal,
    composerSending: shell.composerSending, composerWorkspace: workspace.composerWorkspace,
    editorSession: workspace.editorSession,
    getActiveHandle: () => terminalRuntime.activeAgentSessionHandle,
    getEditorSurface: input.getEditorSurface, getSaveEditorFile: input.getSaveEditorFile,
    getTerminalLabel: input.getTerminalLabel, getTerminalSurface: () => terminalRuntime.terminalSurface,
    logComposerHarnessEvent: project.logComposerHarnessEvent, persistence: workspace.persistence,
    pickWorkspace: project.pickWorkspace, profiles: workspace.profiles,
    projectSessionMetadata: project.projectSessionMetadataActions,
    settingsRef: root.aiConnectionSettingsRef, setActionNotice: shell.chrome.setActionNotice,
    setComposerError: shell.setComposerError, setComposerNotice: shell.setComposerNotice,
    setComposerSending: shell.setComposerSending, setOrchestrationError: shell.setOrchestrationError,
    setOrchestrationLaunching: shell.setOrchestrationLaunching,
    setOrchestrationOpen: shell.setOrchestrationOpen, workspacePathRef: root.workspacePathRef,
  });
  terminalRuntime = appTerminalSurfaceRuntimeFrom({
    activeAgentSession: foundation.activeAgentSession, ...foundation.conversation,
    connectionSettings: root.aiConnectionSettingsRef,
    finalizeCreatedTerminalPane: project.finalizeCreatedTerminalPane,
    latest: root.latest, metrics: root.metrics, paneActivityLog: project.paneActivityLog,
    persistence: workspace.persistence, pickWorkspace: project.pickWorkspace, profiles: workspace.profiles,
    requestWorktreeLabel: root.worktreeLabelRequest.requestLabel, selection: root.selection,
    setComposerError: shell.setComposerError, setLaunchError: root.setLaunchError,
    setSettingsOpen: shell.setSettingsOpen, setWorktrees: shell.setWorktrees,
    shellLayout: shell.shellLayout, storeRef: root.storeRef, terminal: workspace.terminal,
    terminalHostRef: root.terminalHostRef, worktrees: shell.worktrees,
    workspacePath: root.workspacePath, workspacePathRef: root.workspacePathRef,
  });
  return { ...composerRuntime, ...terminalRuntime };
};
