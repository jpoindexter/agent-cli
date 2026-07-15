import type { ChatConversation, ChatMessage, ChatProvider } from "./chatConversationTypes";
import { messageId } from "./chatConversationValues";

export const chatProviderLabel = (provider: ChatProvider) => provider === "claude" ? "Claude" : "Codex";

export const emptyChatConversation = (now = Date.now(), provider: ChatProvider = "codex"): ChatConversation => ({
  provider, messages: [], updatedAt: now, revision: 0, runStatus: "idle",
});

export const pushChatMessage = (conversation: ChatConversation, message: ChatMessage): ChatConversation => ({
  ...conversation, messages: [...conversation.messages, message], updatedAt: message.timestamp,
});

export const upsertChatItemMessage = (conversation: ChatConversation, message: ChatMessage): ChatConversation => {
  const index = message.itemId ? conversation.messages.findIndex((entry) => entry.itemId === message.itemId) : -1;
  if (index < 0) return pushChatMessage(conversation, message);
  const messages = [...conversation.messages];
  messages[index] = { ...messages[index], ...message };
  return { ...conversation, messages, updatedAt: message.timestamp };
};

export const forkChatConversation = (conversation: ChatConversation, parentChatId: string, parentMessageId: string, now = Date.now()): ChatConversation | null => {
  if (conversation.activeRunId) return null;
  const targetIndex = conversation.messages.findIndex((message) => message.id === parentMessageId);
  if (targetIndex < 0 || !["user", "assistant"].includes(conversation.messages[targetIndex].role)) return null;
  return {
    provider: conversation.provider,
    messages: conversation.messages.slice(0, targetIndex + 1).map((message) => ({ ...message })),
    updatedAt: now, revision: 0, runStatus: "idle",
    fork: { parentChatId, parentMessageId, forkedAt: now },
  };
};

export const appendUserChatMessage = (conversation: ChatConversation, text: string, now = Date.now()) =>
  pushChatMessage(conversation, { id: messageId("user", now), role: "user", text: text.trim(), timestamp: now });

export const appendToolChatMessage = (conversation: ChatConversation, title: string, text: string, itemId: string, now = Date.now()) =>
  pushChatMessage(conversation, { id: messageId("tool", now, itemId), role: "tool", title, text: text.trim(), itemId, status: "complete", timestamp: now });

export const chatTitleFromPrompt = (prompt: string, maxLength = 52): string => {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
};

export const startChatRun = (conversation: ChatConversation, runId: string, now = Date.now()): ChatConversation => ({
  ...conversation,
  activeRunId: runId,
  runStatus: "running",
  messages: [...conversation.messages, {
    id: messageId("status", now, runId), role: "status", text: "Working",
    title: chatProviderLabel(conversation.provider), status: "running", timestamp: now,
  }],
  updatedAt: now,
});

export const completeRunningStatus = (conversation: ChatConversation, now: number): ChatConversation => ({
  ...conversation,
  activeRunId: undefined,
  runStatus: "complete",
  messages: conversation.messages.map((message) => message.role === "status" && message.status === "running"
    ? { ...message, text: "Completed", status: "complete" as const, timestamp: now }
    : message.status === "running" && message.approvalRequestId == null
      ? { ...message, status: "complete" as const, timestamp: now }
      : message),
  updatedAt: now,
});
