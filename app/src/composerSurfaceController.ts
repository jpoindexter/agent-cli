import type { ComposerAppCommand } from "./agentComposer";
import { runComposerAppCommand as runAppCommandWithContext } from "./composerAppCommands";
import { submitComposerDraft as submitWithContext } from "./composerSubmission";
import { createOrchestrationChildActions } from "./orchestrationChildActions";
import { launchOrchestration as launchWithContext } from "./orchestrationLaunch";

type AppCommandContext = Parameters<typeof runAppCommandWithContext>[1];
type SubmitContext = Parameters<typeof submitWithContext>[0];
type LaunchDrafts = Parameters<typeof launchWithContext>[0];
type LaunchContext = Parameters<typeof launchWithContext>[1];
type ChildActionsOptions = Parameters<typeof createOrchestrationChildActions>[0];

export type ComposerSurfaceDeps = {
  chatIdForSession: LaunchContext["chatIdForSession"];
  clearTerminal: AppCommandContext["clearTerminal"];
  gateAction: AppCommandContext["gateAction"];
  getActiveConversation: () => SubmitContext["activeConversation"];
  getActiveProvider: () => SubmitContext["activeProvider"];
  getActiveSessionId: () => SubmitContext["activeSessionId"];
  getActiveSessions: () => SubmitContext["activeSessions"];
  getChatId: () => SubmitContext["chatId"];
  getComposerDraft: () => SubmitContext["draft"];
  getComposerHistory: () => SubmitContext["history"];
  getComposerSending: () => SubmitContext["sending"];
  getConversations: () => SubmitContext["conversations"];
  getHarness: () => SubmitContext["harness"];
  getHarnessRecords: () => LaunchContext["harnessRecords"];
  getSelectedFilePath: () => AppCommandContext["selectedFilePath"];
  getSessions: () => SubmitContext["sessions"];
  getSettings: () => SubmitContext["settings"];
  getTerminalLabel: () => AppCommandContext["terminalLabel"];
  getWorkspacePath: () => SubmitContext["workspacePath"];
  now: ChildActionsOptions["now"];
  openSearch: AppCommandContext["openSearch"];
  orchestrationGateAction: LaunchContext["gateAction"];
  persistHarnessRecords: LaunchContext["persistHarnessRecords"];
  persistSessions: SubmitContext["persistSessions"];
  pickWorkspace: AppCommandContext["pickWorkspace"];
  recordActivity: SubmitContext["recordActivity"];
  removeWorktree: ChildActionsOptions["removeWorktree"];
  replaceConversations: LaunchContext["replaceConversations"];
  resolveProfileLabel: SubmitContext["resolveProfileLabel"];
  saveFile: AppCommandContext["saveFile"];
  setActionNotice: LaunchContext["setNotice"];
  setComposerError: SubmitContext["setError"];
  setComposerHistoryIndex: SubmitContext["setHistoryIndex"];
  setComposerLocalState: SubmitContext["setLocalState"];
  setComposerNotice: SubmitContext["setNotice"];
  setComposerSending: SubmitContext["setSending"];
  setOrchestrationError: LaunchContext["setError"];
  setOrchestrationLaunching: LaunchContext["setLaunching"];
  setOrchestrationOpen: LaunchContext["setOpen"];
  stopRun: ChildActionsOptions["stopRun"];
  updateConversation: SubmitContext["updateConversation"];
  updateHarness: SubmitContext["updateHarness"];
  updateSessionMetadata: ChildActionsOptions["updateSessionMetadata"];
};

const appCommandContext = (deps: ComposerSurfaceDeps): AppCommandContext => ({
  clearTerminal: deps.clearTerminal,
  gateAction: deps.gateAction,
  openSearch: deps.openSearch,
  pickWorkspace: deps.pickWorkspace,
  saveFile: deps.saveFile,
  selectedFilePath: deps.getSelectedFilePath(),
  setError: deps.setComposerError,
  setNotice: deps.setComposerNotice,
  terminalLabel: deps.getTerminalLabel(),
});

const submitContext = (
  deps: ComposerSurfaceDeps,
  runAppCommand: (command: ComposerAppCommand) => Promise<boolean>,
): SubmitContext => ({
  activeConversation: deps.getActiveConversation(),
  activeProvider: deps.getActiveProvider(),
  activeRunId: deps.getActiveConversation().activeRunId,
  activeSessionId: deps.getActiveSessionId(),
  activeSessions: deps.getActiveSessions(),
  chatId: deps.getChatId(),
  conversations: deps.getConversations(),
  draft: deps.getComposerDraft(),
  harness: deps.getHarness(),
  history: deps.getComposerHistory(),
  persistSessions: deps.persistSessions,
  recordActivity: deps.recordActivity,
  resolveProfileLabel: deps.resolveProfileLabel,
  runAppCommand,
  sending: deps.getComposerSending(),
  sessions: deps.getSessions(),
  setError: deps.setComposerError,
  setHistoryIndex: deps.setComposerHistoryIndex,
  setLocalState: deps.setComposerLocalState,
  setNotice: deps.setComposerNotice,
  setSending: deps.setComposerSending,
  settings: deps.getSettings(),
  updateConversation: deps.updateConversation,
  updateHarness: deps.updateHarness,
  workspacePath: deps.getWorkspacePath(),
});

const launchContext = (deps: ComposerSurfaceDeps): LaunchContext => ({
  activeSessions: deps.getActiveSessions(),
  chatIdForSession: deps.chatIdForSession,
  conversations: deps.getConversations(),
  gateAction: deps.orchestrationGateAction,
  harnessRecords: deps.getHarnessRecords(),
  persistHarnessRecords: deps.persistHarnessRecords,
  persistSessions: deps.persistSessions,
  projectPath: deps.getWorkspacePath(),
  replaceConversations: deps.replaceConversations,
  sessions: deps.getSessions(),
  setError: deps.setOrchestrationError,
  setLaunching: deps.setOrchestrationLaunching,
  setNotice: deps.setActionNotice,
  setOpen: deps.setOrchestrationOpen,
  settings: deps.getSettings(),
  updateConversation: deps.updateConversation,
});

export const createComposerSurface = (deps: ComposerSurfaceDeps) => {
  const runComposerAppCommand = (command: ComposerAppCommand) =>
    runAppCommandWithContext(command, appCommandContext(deps));
  const childActions = createOrchestrationChildActions({
    conversations: { get current() { return deps.getConversations(); } },
    now: deps.now,
    removeWorktree: deps.removeWorktree,
    setNotice: deps.setActionNotice,
    stopRun: deps.stopRun,
    updateConversation: deps.updateConversation,
    updateSessionMetadata: deps.updateSessionMetadata,
  });
  return {
    launchOrchestration: (drafts: LaunchDrafts) => launchWithContext(drafts, launchContext(deps)),
    removeChildWorktree: childActions.removeChildWorktree,
    returnChildResult: childActions.returnChildResult,
    runComposerAppCommand,
    stopChildChatRun: childActions.stopChildRun,
    submitComposerDraft: (draftOverride?: string) =>
      submitWithContext(submitContext(deps, runComposerAppCommand), draftOverride),
  };
};
