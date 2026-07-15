import {
  emptyChatConversation,
  type ChatConversation,
  type ChatConversationRecords,
  type ChatMessage,
} from "./chatConversation";
import { createChatForkPlan } from "./chatForkPlan";
import { upsertProjectSession, type ProjectSession, type ProjectSessionsByProject } from "./workspaceState";

type ForkContext = {
  browserUrl: string;
  projectPath: string | null;
  sessions: ProjectSession[];
  sessionsByProject: ProjectSessionsByProject;
  sourceSessionId: string | null;
};

type ChatConversationDependencies = {
  createCheckpoint: (root: string, label: string) => Promise<{ createdAt?: number; id: string }>;
  getActiveChatId: () => string | null;
  getConversations: () => ChatConversationRecords;
  getForkContext: () => ForkContext;
  now: () => number;
  persistBrowserUrl: (root: string, sessionId: string, url: string) => Promise<unknown>;
  persistSessions: (sessions: ProjectSessionsByProject) => Promise<unknown>;
  refreshSearch: () => void;
  reportPersistenceError: (message: string) => void;
  saveConversation: (key: string, conversation: ChatConversation) => Promise<unknown>;
  setConversations: (conversations: ChatConversationRecords) => void;
  setError: (message: string) => void;
  setNotice: (message: string) => void;
  switchSession: (root: string, sessionId: string) => Promise<unknown>;
};

const updateConversation = (
  dependencies: ChatConversationDependencies,
  key: string,
  updater: (conversation: ChatConversation) => ChatConversation,
) => {
  const conversations = dependencies.getConversations();
  const previous = conversations[key] ?? emptyChatConversation();
  const updated = updater(previous);
  const nextConversation = { ...updated, revision: previous.revision + 1 };
  dependencies.setConversations({ ...conversations, [key]: nextConversation });
  void dependencies.saveConversation(key, nextConversation).catch((error) => {
    dependencies.reportPersistenceError(`Could not save chat history: ${String(error)}`);
  });
  return nextConversation;
};

const toggleBookmark = (dependencies: ChatConversationDependencies, message: ChatMessage) => {
  const chatId = dependencies.getActiveChatId();
  if (!chatId) return;
  const bookmarked = !message.bookmarked;
  updateConversation(dependencies, chatId, (conversation) => ({
    ...conversation,
    messages: conversation.messages.map((item) =>
      item.id === message.id ? { ...item, bookmarked: bookmarked ? true : undefined } : item),
    updatedAt: dependencies.now(),
  }));
  dependencies.refreshSearch();
  dependencies.setNotice(bookmarked ? "Bookmarked message" : "Removed bookmark");
};

const forkFromMessage = async (dependencies: ChatConversationDependencies, message: ChatMessage) => {
  const context = dependencies.getForkContext();
  if (!context.projectPath || !context.sourceSessionId) return;
  const sourceChatId = `${context.projectPath}\n${context.sourceSessionId}`;
  const sourceConversation = dependencies.getConversations()[sourceChatId] ?? emptyChatConversation();
  if (sourceConversation.activeRunId) {
    dependencies.setNotice("Wait for this response to finish before forking the chat");
    return;
  }
  const sourceSession = context.sessions.find((session) => session.id === context.sourceSessionId);
  let checkpointError: string | null = null;
  const checkpoint = await dependencies.createCheckpoint(
    context.projectPath, `Fork from ${sourceSession?.title ?? "chat"}`,
  ).catch((error) => { checkpointError = String(error); return null; });
  const plan = createChatForkPlan({
    checkpoint, existingSessions: context.sessions, messageId: message.id,
    now: dependencies.now(), sourceChatId, sourceConversation, sourceSessionId: context.sourceSessionId,
  });
  if (!plan) { dependencies.setError("This message cannot be used to fork the chat."); return; }
  const forkedChatId = `${context.projectPath}\n${plan.session.id}`;
  await dependencies.saveConversation(forkedChatId, plan.forkedConversation);
  dependencies.setConversations({
    ...dependencies.getConversations(), [forkedChatId]: plan.forkedConversation,
  });
  await dependencies.persistSessions(upsertProjectSession(
    context.sessionsByProject, context.projectPath, plan.session,
  ));
  await dependencies.persistBrowserUrl(context.projectPath, plan.session.id, context.browserUrl);
  await dependencies.switchSession(context.projectPath, plan.session.id);
  dependencies.setNotice(checkpointError
    ? `Forked chat without workspace checkpoint: ${checkpointError}`
    : `Forked ${plan.sourceTitle}`);
};

export const createChatConversationActions = (dependencies: ChatConversationDependencies) => ({
  forkFromMessage: (message: ChatMessage) => forkFromMessage(dependencies, message),
  toggleBookmark: (message: ChatMessage) => toggleBookmark(dependencies, message),
  updateConversation: (key: string, updater: (conversation: ChatConversation) => ChatConversation) =>
    updateConversation(dependencies, key, updater),
});
