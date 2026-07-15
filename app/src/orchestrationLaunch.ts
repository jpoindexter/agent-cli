import { invoke } from "@tauri-apps/api/core";
import { createAppAction, type AppActionDecision, type AppActionDescriptor } from "./appActions";
import {
  appendToolChatMessage,
  appendUserChatMessage,
  applyChatRunEnvelope,
  emptyChatConversation,
  startChatRun,
  type ChatConversation,
} from "./chatConversation";
import {
  buildOrchestrationPreview,
  childPrompt,
  orchestrationTargets,
  type OrchestrationChildDraft,
} from "./chatOrchestration";
import { saveDurableChatConversation } from "./chatStore";
import { defaultComposerHarnessState, type ComposerHarnessRecords, type ComposerHarnessState } from "./composerHarness";
import { connectionEnvironmentInputs, type AiConnectionSettings } from "./connectionSettings";
import { activeProjectSessionId, upsertProjectSession, type ActiveSessionByProject, type ProjectSession, type ProjectSessionsByProject } from "./workspaceState";

type WorktreeResponse = { path: string; branch: string };
type LaunchTarget = { chatId: string; runId: string; projectPath: string; child: OrchestrationChildDraft; index: number };
type PreparedChild = {
  session: ProjectSession;
  chatId: string;
  conversation: ChatConversation;
  harness: ComposerHarnessState;
  launch: LaunchTarget | null;
  error: string | null;
};

type OrchestrationLaunchContext = {
  projectPath: string | null;
  sessions: ProjectSessionsByProject;
  activeSessions: ActiveSessionByProject;
  conversations: Record<string, ChatConversation>;
  harnessRecords: ComposerHarnessRecords;
  settings: AiConnectionSettings;
  chatIdForSession: (projectPath: string, sessionId: string) => string;
  gateAction: (action: AppActionDescriptor) => Promise<{ decision: AppActionDecision }>;
  updateConversation: (chatId: string, updater: (value: ChatConversation) => ChatConversation) => ChatConversation;
  replaceConversations: (conversations: Record<string, ChatConversation>) => void;
  persistHarnessRecords: (records: ComposerHarnessRecords) => Promise<void>;
  persistSessions: (sessions: ProjectSessionsByProject, active: ActiveSessionByProject) => Promise<void>;
  setLaunching: (launching: boolean) => void;
  setError: (message: string | null) => void;
  setOpen: (open: boolean) => void;
  setNotice: (message: string) => void;
};

const basename = (path: string) => path.split(/[\\/]/).filter(Boolean).pop() ?? path;

export const orchestrationLaunchNotice = (launched: number, errors: string[]) =>
  errors.length > 0
    ? `Launched ${launched} child chats; ${errors.length} need attention`
    : `Launched ${launched} parallel child chats`;

const createWorktree = async (
  child: OrchestrationChildDraft,
  index: number,
  projectPath: string,
  dispatchId: string,
) => {
  if (child.worktreeMode !== "isolated") return { projectPath, worktree: null, error: null };
  try {
    const worktree = await invoke<WorktreeResponse>("create_project_worktree", {
      root: projectPath,
      label: `${child.title || `child-${index + 1}`}-${dispatchId.slice(-8)}`,
    });
    return { projectPath: worktree.path, worktree, error: null };
  } catch (error) {
    return { projectPath, worktree: null, error: `Could not create isolated worktree: ${String(error)}` };
  }
};

const childSession = (
  child: OrchestrationChildDraft,
  index: number,
  input: { sessionId: string; parentSessionId: string; parentMessageId: string; dispatchId: string; now: number; count: number; worktree: WorktreeResponse | null; error: string | null },
): ProjectSession => ({
  id: input.sessionId,
  title: child.title || `Agent ${index + 1}`,
  status: input.error ? "attention" : "running",
  updatedAt: input.now + index + 1,
  parentSessionId: input.parentSessionId,
  parentMessageId: input.parentMessageId,
  forkedAt: input.now + index + 1,
  orchestration: {
    dispatchId: input.dispatchId,
    parentSessionId: input.parentSessionId,
    index,
    count: input.count,
    task: child.task,
    provider: child.provider,
    ...(child.model ? { model: child.model } : {}),
    approvalMode: child.approvalMode,
    budgetSeconds: child.budgetSeconds,
    targets: orchestrationTargets(child.targetFiles),
    worktreeMode: child.worktreeMode,
    ...(input.worktree ? { worktreePath: input.worktree.path, worktreeBranch: input.worktree.branch } : {}),
  },
});

const childConversation = (
  child: OrchestrationChildDraft,
  index: number,
  input: { chatId: string; runId: string; parentChatId: string; parentMessageId: string; parentTitle: string; now: number; count: number; error: string | null },
) => {
  const timestamp = input.now + index + 1;
  const base = {
    ...emptyChatConversation(timestamp, child.provider),
    fork: { parentChatId: input.parentChatId, parentMessageId: input.parentMessageId, forkedAt: timestamp },
  };
  const prompted = appendUserChatMessage(base, childPrompt(child, index, input.count, input.parentTitle), timestamp);
  const running = startChatRun(prompted, input.runId, timestamp + 1);
  if (!input.error) return running;
  return applyChatRunEnvelope(running, {
    runId: input.runId,
    chatId: input.chatId,
    provider: child.provider,
    stream: "lifecycle",
    event: { type: "run.completed", exitCode: 1, message: input.error },
  }, timestamp + 2);
};

const prepareChild = async (
  child: OrchestrationChildDraft,
  index: number,
  input: { projectPath: string; parentSessionId: string; parentMessageId: string; parentChatId: string; parentTitle: string; dispatchId: string; now: number; count: number; chatIdForSession: OrchestrationLaunchContext["chatIdForSession"] },
): Promise<PreparedChild> => {
  const sessionId = `session-${crypto.randomUUID()}`;
  const chatId = input.chatIdForSession(input.projectPath, sessionId);
  const runId = `chat-run-${crypto.randomUUID()}`;
  const worktree = await createWorktree(child, index, input.projectPath, input.dispatchId);
  const shared = { sessionId, parentSessionId: input.parentSessionId, parentMessageId: input.parentMessageId, dispatchId: input.dispatchId, now: input.now, count: input.count, worktree: worktree.worktree, error: worktree.error };
  const conversation = childConversation(child, index, { chatId, runId, parentChatId: input.parentChatId, parentMessageId: input.parentMessageId, parentTitle: input.parentTitle, now: input.now, count: input.count, error: worktree.error });
  return {
    session: childSession(child, index, shared),
    chatId,
    conversation,
    harness: { ...defaultComposerHarnessState(child.provider), approvalMode: child.approvalMode, model: child.model },
    launch: worktree.error ? null : { chatId, runId, projectPath: worktree.projectPath, child, index },
    error: worktree.error ? `${child.title}: ${worktree.error}` : null,
  };
};

const prepareChildren = async (
  children: OrchestrationChildDraft[],
  input: Parameters<typeof prepareChild>[2],
) => {
  const prepared: PreparedChild[] = [];
  for (const [index, child] of children.entries()) prepared.push(await prepareChild(child, index, input));
  return prepared;
};

const persistPreparedChildren = async (
  prepared: PreparedChild[],
  projectPath: string,
  parentChatId: string,
  parentConversation: ChatConversation,
  context: OrchestrationLaunchContext,
) => {
  let sessions = context.sessions;
  let conversations = { ...context.conversations, [parentChatId]: parentConversation };
  let harnessRecords = context.harnessRecords;
  for (const child of prepared) {
    sessions = upsertProjectSession(sessions, projectPath, child.session);
    conversations = { ...conversations, [child.chatId]: child.conversation };
    harnessRecords = { ...harnessRecords, [child.chatId]: child.harness };
    await saveDurableChatConversation(child.chatId, child.conversation);
  }
  context.replaceConversations(conversations);
  await context.persistHarnessRecords(harnessRecords);
  await context.persistSessions(sessions, context.activeSessions);
  context.setOpen(false);
};

const launchChild = async (
  launch: LaunchTarget,
  count: number,
  parentTitle: string,
  settings: AiConnectionSettings,
) => invoke("start_chat_run", { request: {
  runId: launch.runId,
  chatId: launch.chatId,
  projectPath: launch.projectPath,
  provider: launch.child.provider,
  providerThreadId: null,
  prompt: childPrompt(launch.child, launch.index, count, parentTitle),
  images: [],
  approvalMode: launch.child.approvalMode,
  model: launch.child.model || settings.providerModels[launch.child.provider].trim() || null,
  reasoningEffort: null,
  budgetSeconds: launch.child.budgetSeconds,
  environment: connectionEnvironmentInputs(settings, launch.projectPath),
} });

const launchPreparedChildren = async (
  prepared: PreparedChild[],
  parentTitle: string,
  context: OrchestrationLaunchContext,
) => {
  let launched = 0;
  const errors = prepared.flatMap((child) => child.error ? [child.error] : []);
  for (const item of prepared) {
    if (!item.launch) continue;
    try {
      await launchChild(item.launch, prepared.length, parentTitle, context.settings);
      launched += 1;
    } catch (error) {
      context.updateConversation(item.chatId, (conversation) => applyChatRunEnvelope(conversation, {
        runId: item.launch?.runId ?? "launch-error",
        chatId: item.chatId,
        provider: item.launch?.child.provider ?? conversation.provider,
        stream: "lifecycle",
        event: { type: "run.completed", exitCode: 1, message: String(error) },
      }));
      errors.push(`${item.launch.child.title}: ${String(error)}`);
    }
  }
  context.setNotice(orchestrationLaunchNotice(launched, errors));
};

export const launchOrchestration = async (
  drafts: OrchestrationChildDraft[],
  context: OrchestrationLaunchContext,
) => {
  const parentSessionId = activeProjectSessionId(context.activeSessions, context.sessions, context.projectPath);
  if (!context.projectPath || !parentSessionId) return context.setError("Open a project chat before launching child chats.");
  const preview = buildOrchestrationPreview(drafts, Object.values(context.conversations).filter((item) => item.activeRunId).length);
  if (preview.errors.length > 0) return context.setError(preview.errors[0]);
  const parentSession = context.sessions[context.projectPath]?.find((session) => session.id === parentSessionId);
  if (!parentSession) return context.setError("The parent chat is no longer available.");
  const audit = await context.gateAction(createAppAction({ kind: "launch-orchestration", label: `Launch ${preview.children.length} parallel child chats`, target: `${basename(context.projectPath)} · ${parentSession.title}`, risk: "medium", requestedBy: "user", reason: "Each child is durable, independently cancellable, and bounded by a wall-clock budget." }));
  if (audit.decision !== "approved") return;
  context.setLaunching(true);
  context.setError(null);
  try {
    const dispatchId = `dispatch-${crypto.randomUUID()}`;
    const now = Date.now();
    const parentChatId = context.chatIdForSession(context.projectPath, parentSessionId);
    const parentConversation = context.updateConversation(parentChatId, (conversation) => appendToolChatMessage(conversation, "Parallel dispatch", `${preview.children.length} child chats prepared. Open any child from the project rail to inspect or stop it.`, dispatchId, now));
    const parentMessageId = parentConversation.messages[parentConversation.messages.length - 1]?.id ?? dispatchId;
    const prepared = await prepareChildren(preview.children, { projectPath: context.projectPath, parentSessionId, parentMessageId, parentChatId, parentTitle: parentSession.title, dispatchId, now, count: preview.children.length, chatIdForSession: context.chatIdForSession });
    await persistPreparedChildren(prepared, context.projectPath, parentChatId, parentConversation, context);
    await launchPreparedChildren(prepared, parentSession.title, context);
  } catch (error) {
    context.setError(`Could not launch parallel child chats: ${String(error)}`);
  } finally {
    context.setLaunching(false);
  }
};
