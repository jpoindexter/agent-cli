import { invoke } from "@tauri-apps/api/core";
import { composerHistoryAfterSubmit, routeComposerDraft, type ComposerAppCommand } from "./agentComposer";
import { structuredChatProviderId } from "./agentConnections";
import type { ComposerHarnessState } from "./composerHarness";
import { prepareChatContext } from "./chatContext";
import {
  appendUserChatMessage,
  applyChatRunEnvelope,
  chatTitleFromPrompt,
  emptyChatConversation,
  startChatRun,
  type ChatConversation,
  type ChatProvider,
} from "./chatConversation";
import { connectionEnvironmentInputs, type AiConnectionSettings } from "./connectionSettings";
import type { AgentActivityEvent } from "./agentActivity";
import type { ActiveSessionByProject, ProjectSessionsByProject } from "./workspaceState";

type SubmissionActivity = Pick<AgentActivityEvent, "kind" | "label" | "status"> &
  Partial<Pick<AgentActivityEvent, "detail">>;

type ComposerSubmissionContext = {
  sending: boolean;
  activeRunId?: string;
  draft: string;
  history: string[];
  workspacePath: string | null;
  chatId: string | null;
  activeSessionId: string | null;
  harness: ComposerHarnessState;
  settings: AiConnectionSettings;
  activeProvider: ChatProvider | null;
  activeConversation: ChatConversation;
  conversations: Record<string, ChatConversation>;
  sessions: ProjectSessionsByProject;
  activeSessions: ActiveSessionByProject;
  resolveProfileLabel: (id: string) => string;
  runAppCommand: (command: ComposerAppCommand) => Promise<boolean>;
  updateConversation: (chatId: string, updater: (value: ChatConversation) => ChatConversation) => ChatConversation;
  persistSessions: (sessions: ProjectSessionsByProject, active: ActiveSessionByProject) => Promise<void>;
  recordActivity: (event: SubmissionActivity) => void;
  setError: (message: string | null) => void;
  setNotice: (message: string | null) => void;
  setSending: (sending: boolean) => void;
  setLocalState: (key: string | null, draft: string, history: string[]) => void;
  setHistoryIndex: (index: number | null) => void;
  updateHarness: (updater: (state: ComposerHarnessState) => ComposerHarnessState) => Promise<ComposerHarnessState | null>;
};

type TextFileResponse = { path: string; content: string; bytes: number; modifiedMs: number | null };
type ChatImageResponse = { path: string; bytes: number; mimeType: string };

export const shouldRenameChatSession = (title: string) =>
  title === "Current work" || /^New (session|chat)( \d+)?$/.test(title);

const previousConversationForProvider = (
  conversation: ChatConversation | undefined,
  provider: ChatProvider,
) => {
  const stored = conversation ?? emptyChatConversation(Date.now(), provider);
  return stored.provider === provider ? stored : { ...stored, provider, providerThreadId: undefined };
};

const persistGeneratedChatTitle = (
  prompt: string,
  context: ComposerSubmissionContext,
) => {
  const root = context.workspacePath;
  const session = root ? context.sessions[root]?.find((item) => item.id === context.activeSessionId) : null;
  if (!root || !session || !shouldRenameChatSession(session.title)) return;
  const title = chatTitleFromPrompt(prompt);
  const next = {
    ...context.sessions,
    [root]: (context.sessions[root] ?? []).map((item) =>
      item.id === session.id ? { ...item, title, updatedAt: Date.now() } : item
    ),
  };
  void context.persistSessions(next, context.activeSessions);
};

const preparedChatContext = (text: string, context: ComposerSubmissionContext) =>
  prepareChatContext(text, context.harness, {
    readFile: (attachment) => invoke<TextFileResponse>("read_chat_context_file", {
      root: context.workspacePath,
      path: attachment.target,
    }),
    inspectImage: (attachment) => invoke<ChatImageResponse>("inspect_chat_image", {
      path: attachment.target,
    }),
  });

const startStructuredChat = async (text: string, context: ComposerSubmissionContext) => {
  if (!context.workspacePath) return context.setError("Open a workspace before starting a chat.");
  if (!context.chatId) return context.setError("Create or select a chat before sending.");
  const provider = structuredChatProviderId(context.harness.selectedProfileId);
  if (!provider) {
    const label = context.resolveProfileLabel(context.harness.selectedProfileId);
    return context.setError(`${label} structured chat is not available yet. Open Raw terminal and select ${label} to use its native CLI.`);
  }
  const prepared = await preparedChatContext(text, context);
  const previous = previousConversationForProvider(context.conversations[context.chatId], provider);
  const runId = `chat-run-${crypto.randomUUID()}`;
  context.updateConversation(context.chatId, () =>
    startChatRun(appendUserChatMessage(previous, text), runId)
  );
  persistGeneratedChatTitle(text, context);
  await invoke("start_chat_run", { request: chatRunRequest(runId, provider, previous, prepared, context) });
};

const chatRunRequest = (
  runId: string,
  provider: ChatProvider,
  previous: ChatConversation,
  prepared: Awaited<ReturnType<typeof preparedChatContext>>,
  context: ComposerSubmissionContext,
) => ({
  runId,
  chatId: context.chatId,
  projectPath: context.workspacePath,
  provider,
  providerThreadId: previous.providerThreadId ?? null,
  prompt: prepared.prompt,
  images: prepared.images,
  approvalMode: context.harness.approvalMode,
  model: context.harness.model.trim() || context.settings.providerModels[provider].trim() || null,
  reasoningEffort: context.harness.reasoningEffort === "default" ? null : context.harness.reasoningEffort,
  budgetSeconds: null,
  environment: connectionEnvironmentInputs(context.settings, context.workspacePath ?? ""),
});

const runAppCommand = async (command: ComposerAppCommand, context: ComposerSubmissionContext) => {
  const ok = await context.runAppCommand(command);
  context.recordActivity({
    kind: ok ? "app" : "error",
    label: ok ? "Ran command" : "Command failed",
    detail: command,
    status: ok ? "complete" : "error",
  });
  return ok;
};

const finishSubmission = (draft: string, context: ComposerSubmissionContext) => {
  const nextHistory = composerHistoryAfterSubmit(context.history, draft);
  context.setLocalState(context.chatId, "", nextHistory);
  context.setHistoryIndex(null);
  void context.updateHarness((state) => ({ ...state, draft: "", history: nextHistory }));
};

const recordLaunchError = (error: unknown, context: ComposerSubmissionContext) => {
  const message = String(error);
  context.setError(message);
  if (!context.chatId) return;
  context.updateConversation(context.chatId, (conversation) => applyChatRunEnvelope(conversation, {
    runId: "launch-error",
    chatId: context.chatId ?? "",
    provider: context.activeProvider ?? context.activeConversation.provider,
    stream: "lifecycle",
    event: { type: "run.completed", exitCode: 1, message },
  }));
};

export const submitComposerDraft = async (
  context: ComposerSubmissionContext,
  draftOverride?: string,
) => {
  if (context.sending || context.activeRunId) return;
  const submittedDraft = draftOverride ?? context.draft;
  const route = routeComposerDraft(submittedDraft);
  if (route.kind === "empty") return;
  if (route.kind === "unknown-app") {
    context.setError(`Unknown app command ${route.input}. Try >help for the list.`);
    return;
  }
  context.setSending(true);
  context.setError(null);
  context.setNotice(null);
  try {
    if (route.kind === "chat") await startStructuredChat(route.text, context);
    else if (!await runAppCommand(route.command, context)) return;
    finishSubmission(submittedDraft, context);
  } catch (error) {
    recordLaunchError(error, context);
  } finally {
    context.setSending(false);
  }
};
