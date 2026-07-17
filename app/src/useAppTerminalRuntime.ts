import { invoke } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import type { RefObject } from "react";
import { notifyBackgroundExit } from "./backgroundExits";
import type { AiConnectionSettings } from "./connectionSettings";
import { crashRecoveryMessage, deriveCrashRecovery } from "./crashRecovery";
import type { createDevServerDetection } from "./devServerDetectionSurface";
import type { createProjectEntryActions } from "./projectEntryActions";
import { recordIpcPayloadBytes, type RenderPerfState } from "./renderPerf";
import { setActiveKeybindingOverrides } from "./shortcuts";
import {
  createTerminalRuntimeEventHandlers, terminalRuntimeFromHook,
  type TerminalGridPayload, type TerminalPaneExitPayload,
} from "./terminalRuntimeEventHandlers";
import { terminalSnapshotText } from "./terminalTranscript";
import type { useAppShellDomain } from "./useAppShellDomain";
import type { useConversationRuntime } from "./useConversationRuntime";
import { useNativeAppEvents } from "./useNativeAppEvents";
import { useTerminalCanvasRuntime } from "./useTerminalCanvasRuntime";
import type { useWorkspaceDomain } from "./useWorkspaceDomain";
import { loadWorkspaceBootstrap } from "./workspaceBootstrap";
import {
  bootstrapRefsFromHooks, bootstrapSettersFromHooks, createWorkspaceBootstrapController,
} from "./workspaceBootstrapController";
import type { createWorkspaceOpenSurface } from "./workspaceOpenSurface";
import type { createWorkspacePicker } from "./workspacePicker";
import type { SelectionRange } from "./selection";

type Cell = { t: string; f: [number, number, number]; b: [number, number, number]; bold: boolean };
type Snapshot = {
  cols: number; rows: number; cx: number; cy: number; cvis: boolean; sb: number; cells: Cell[];
};
type ShellDomain = ReturnType<typeof useAppShellDomain>;
type ConversationRuntime = ReturnType<typeof useConversationRuntime>;
type WorkspaceDomain = ReturnType<typeof useWorkspaceDomain<Snapshot>>;
type MutableRef<T> = { current: T };

type RuntimeShell = Pick<ShellDomain,
  "chrome" | "mcpOAuth" | "paneTranscripts" | "setAiConnectionSettings"
  | "setBackgroundExits" | "setCommandPaletteSources" | "setKeybindingOverrides"
  | "setWorktrees"
>;
type RuntimeWorkspace = Pick<WorkspaceDomain,
  "composerWorkspace" | "editorSession" | "persistence" | "profiles" | "terminal"
>;

type AppTerminalRuntimeInput = {
  approvalMode: Parameters<typeof terminalRuntimeFromHook>[1]["approvalMode"];
  browser: ConversationRuntime["browser"];
  commandPalette: { openDialog: () => void };
  detectLocalServer: ReturnType<typeof createDevServerDetection>;
  pickWorkspace: ReturnType<typeof createWorkspacePicker>;
  projectEntryActions: ReturnType<typeof createProjectEntryActions>;
  quickOpen: { openDialog: () => void };
  recordActivity: ConversationRuntime["agentActivityHook"]["recordAgentActivity"];
  sendResize: () => void;
  setAgentActivity: ConversationRuntime["agentActivityHook"]["setAgentActivityEvents"];
  setError: (message: string) => void;
  setSettingsOpen: (open: boolean) => void;
  shell: RuntimeShell;
  workspace: RuntimeWorkspace;
  workspaceOpenActions: ReturnType<typeof createWorkspaceOpenSurface>;
  workspacePathRef: MutableRef<string | null>;
  refs: {
    aiConnectionSettings: MutableRef<AiConnectionSettings>;
    canvas: RefObject<HTMLCanvasElement | null>;
    frame: MutableRef<number | null>;
    imeInput: RefObject<HTMLTextAreaElement | null>;
    ipcSampleCounter: MutableRef<number>;
    latest: MutableRef<Snapshot | null>;
    metrics: MutableRef<{ cw: number; ch: number }>;
    renderPerf: MutableRef<RenderPerfState>;
    selection: MutableRef<SelectionRange | null>;
    selecting: MutableRef<boolean>;
    store: MutableRef<Awaited<ReturnType<typeof load>> | null>;
    terminalHost: RefObject<HTMLDivElement | null>;
  };
};

const bootstrapControllerFrom = (input: AppTerminalRuntimeInput) => {
  const { browser, shell, workspace } = input;
  return createWorkspaceBootstrapController({
    hydrateProfiles: workspace.profiles.hydrate,
    loadBootstrap: loadWorkspaceBootstrap,
    openWorkspace: (folder, profile) => input.workspaceOpenActions.openWorkspaceDirect(folder, profile),
    pickWorkspace: input.pickWorkspace,
    refreshSecretPresence: (settings) => { void shell.mcpOAuth.refreshSecretPresence(settings); },
    refs: bootstrapRefsFromHooks({
      browser, composer: workspace.composerWorkspace, editorSession: workspace.editorSession,
      persistence: workspace.persistence, settingsRef: input.refs.aiConnectionSettings,
      storeRef: input.refs.store, terminal: workspace.terminal,
    }),
    sendResize: input.sendResize,
    setters: bootstrapSettersFromHooks({
      browser, chrome: shell.chrome, composer: workspace.composerWorkspace,
      persistence: workspace.persistence,
      rest: {
        setAgentActivity: input.setAgentActivity, setAiConnectionSettings: shell.setAiConnectionSettings,
        setCommandPaletteSources: shell.setCommandPaletteSources,
        setKeybindingOverrides: shell.setKeybindingOverrides, setKeybindings: setActiveKeybindingOverrides,
        setPaneLabels: workspace.terminal.setPaneLabels,
        setPaneTranscripts: shell.paneTranscripts.setPaneTranscripts, setWorktrees: shell.setWorktrees,
      },
    }),
  });
};

const useCanvasRuntime = (input: AppTerminalRuntimeInput, initWorkspace: () => Promise<void>) => {
  useTerminalCanvasRuntime({
    canvasRef: input.refs.canvas, imeInputRef: input.refs.imeInput,
    terminalHostRef: input.refs.terminalHost,
    activePaneIdRef: input.workspace.terminal.activePaneIdRef,
    latest: input.refs.latest, frame: input.refs.frame, metrics: input.refs.metrics,
    selection: input.refs.selection, selecting: input.refs.selecting,
    requestPaintRef: input.workspace.terminal.requestPaintRef, renderPerfRef: input.refs.renderPerf,
    onCommandPalette: input.commandPalette.openDialog, onQuickOpen: input.quickOpen.openDialog,
    onSettings: () => input.setSettingsOpen(true),
    onResize: input.sendResize,
    onReady: async () => {
      const staleLock = await invoke<boolean>("begin_session").catch(() => false);
      await initWorkspace();
      input.shell.chrome.setCrashNotice(crashRecoveryMessage(deriveCrashRecovery(
        staleLock, input.workspace.persistence.openProjectsRef.current.length,
      )));
      window.addEventListener("beforeunload", () => { void invoke("end_session_clean").catch(() => {}); });
    },
  });
};

const terminalEventHandlersFrom = (input: AppTerminalRuntimeInput) => createTerminalRuntimeEventHandlers(
  terminalRuntimeFromHook(input.workspace.terminal, {
    activeSessionForProject: input.workspace.persistence.activeSessionForProject,
    approvalMode: input.approvalMode, detectLocalServer: input.detectLocalServer,
    ipcSampleCounter: input.refs.ipcSampleCounter, latest: input.refs.latest,
    notificationsEnabled: input.shell.chrome.notificationsEnabledRef,
    notifyBackgroundExit, now: Date.now,
    persistTranscript: input.shell.paneTranscripts.persistPaneTranscript,
    recordActivity: input.recordActivity, recordIpcPayload: recordIpcPayloadBytes,
    renderPerf: input.refs.renderPerf,
    requestPaint: () => input.workspace.terminal.requestPaintRef.current(),
    setBackgroundExits: input.shell.setBackgroundExits, setError: input.setError,
    snapshotText: terminalSnapshotText,
    updateProjectStatus: input.workspace.persistence.updateOpenProjectStatus,
    updateSessionStatus: input.workspace.persistence.updateSessionStatus,
    workspacePath: input.workspacePathRef,
  }),
);

const useNativeRuntimeEvents = (
  input: AppTerminalRuntimeInput,
  handlers: ReturnType<typeof terminalEventHandlersFrom>,
) => useNativeAppEvents<TerminalGridPayload<Snapshot>, TerminalPaneExitPayload>({
  onGrid: handlers.handleGridPayload,
  onNewTask: () => { void input.projectEntryActions.newTask(); },
  onOpenFolder: () => { void input.projectEntryActions.openProject(); },
  onSaveFile: () => { void input.workspace.editorSession.saveEditorFileRef.current(); },
  onFindInFile: () => input.workspace.editorSession.openEditorSearchRef.current(),
  onCloseEditorTab: () => { void input.workspace.editorSession.closeActiveEditorTabRef.current(); },
  onPaneExit: handlers.handlePaneExit,
});

export const useAppTerminalRuntime = (input: AppTerminalRuntimeInput) => {
  const bootstrap = bootstrapControllerFrom(input);
  useCanvasRuntime(input, bootstrap.initWorkspace);
  useNativeRuntimeEvents(input, terminalEventHandlersFrom(input));
};
