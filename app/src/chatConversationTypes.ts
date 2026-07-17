import type { RunCardKind, RunCardProvenance } from "./runCards";

export type ChatProvider = "codex" | "claude" | "opencode";
export type ChatMessageRole = "user" | "assistant" | "tool" | "status" | "error";

export type ChatMessage = {
  id: string; role: ChatMessageRole; text: string; timestamp: number; itemId?: string; title?: string;
  status?: "running" | "complete" | "error"; approvalRequestId?: number; approvalMethod?: string;
  approvalDecision?: "accept" | "acceptForSession" | "decline" | "cancel";
  approvalResolution?: "user" | "timeout" | "runClosed"; approvalRunId?: string; approvalResolvedAt?: number;
  bookmarked?: boolean; provenance?: RunCardProvenance; runCardKind?: RunCardKind; targets?: string[];
};

export type ChatUsage = { inputTokens: number; cachedInputTokens: number; outputTokens: number };
export type ChatRunStatus = "idle" | "running" | "complete" | "error" | "interrupted";
export type ChatForkLineage = { parentChatId: string; parentMessageId: string; forkedAt: number };

export type ChatConversation = {
  provider: ChatProvider; providerThreadId?: string; activeRunId?: string; messages: ChatMessage[];
  updatedAt: number; revision: number; runStatus: ChatRunStatus; usage?: ChatUsage; fork?: ChatForkLineage;
};

export type ChatConversationRecords = Record<string, ChatConversation>;

export type ChatRunEnvelope = {
  runId: string; chatId: string; provider: ChatProvider; stream: "stdout" | "stderr" | "lifecycle";
  event?: unknown; line?: string;
};
