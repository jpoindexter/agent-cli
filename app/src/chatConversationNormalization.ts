import type {
  ChatConversationRecords,
  ChatForkLineage,
  ChatMessage,
  ChatMessageRole,
  ChatRunStatus,
} from "./chatConversationTypes";
import { isRecord, nonNegativeInteger, normalizeUsage, textValue } from "./chatConversationValues";

const normalizeRunStatus = (value: unknown, staleActiveRun: boolean): ChatRunStatus => {
  if (staleActiveRun) return "interrupted";
  return value === "running" || value === "complete" || value === "error" || value === "interrupted" ? value : "idle";
};

const normalizeForkLineage = (value: unknown): ChatForkLineage | undefined => {
  if (!isRecord(value)) return undefined;
  const parentChatId = textValue(value.parentChatId).trim();
  const parentMessageId = textValue(value.parentMessageId).trim();
  const forkedAt = typeof value.forkedAt === "number" && Number.isFinite(value.forkedAt) ? Math.max(0, Math.floor(value.forkedAt)) : 0;
  return parentChatId && parentMessageId && forkedAt ? { parentChatId, parentMessageId, forkedAt } : undefined;
};

const normalizeApproval = (value: Record<string, unknown>) => {
  const decision = value.approvalDecision;
  const resolution = value.approvalResolution;
  return {
    approvalRequestId: typeof value.approvalRequestId === "number" && Number.isFinite(value.approvalRequestId) ? Math.max(0, Math.floor(value.approvalRequestId)) : undefined,
    approvalMethod: textValue(value.approvalMethod) || undefined,
    approvalDecision: decision === "accept" || decision === "acceptForSession" || decision === "decline" || decision === "cancel" ? decision : undefined,
    approvalResolution: resolution === "user" || resolution === "timeout" || resolution === "runClosed" ? resolution : undefined,
    approvalRunId: textValue(value.approvalRunId) || undefined,
    approvalResolvedAt: typeof value.approvalResolvedAt === "number" && Number.isFinite(value.approvalResolvedAt) ? Math.max(0, Math.floor(value.approvalResolvedAt)) : undefined,
  } as const;
};

const normalizeRunCard = (value: Record<string, unknown>) => ({
  provenance: value.provenance === "provider" || value.provenance === "app-action" || value.provenance === "agent-hook" ? value.provenance : undefined,
  runCardKind: value.runCardKind === "thinking" || value.runCardKind === "plan" || value.runCardKind === "file" || value.runCardKind === "approval" || value.runCardKind === "command" || value.runCardKind === "tool" ? value.runCardKind : undefined,
  targets: Array.isArray(value.targets) ? Array.from(new Set(value.targets.filter((target): target is string => typeof target === "string" && Boolean(target.trim())).map((target) => target.trim()))) : undefined,
} as const);

const normalizeMessage = (value: unknown): ChatMessage | null => {
  if (!isRecord(value)) return null;
  const role = value.role;
  if (!(["user", "assistant", "tool", "status", "error"] as unknown[]).includes(role)) return null;
  const text = textValue(value.text);
  const id = textValue(value.id);
  const timestamp = typeof value.timestamp === "number" && Number.isFinite(value.timestamp) ? value.timestamp : 0;
  if (!id || !text || !timestamp) return null;
  const status = value.status;
  return {
    id, role: role as ChatMessageRole, text, timestamp,
    itemId: textValue(value.itemId) || undefined,
    title: textValue(value.title) || undefined,
    status: status === "running" || status === "complete" || status === "error" ? status : undefined,
    bookmarked: value.bookmarked === true ? true : undefined,
    ...normalizeApproval(value),
    ...normalizeRunCard(value),
  };
};

const normalizeRecordEntry = (key: string, entry: Record<string, unknown>) => {
  const staleActiveRun = Boolean(textValue(entry.activeRunId));
  const messages = Array.isArray(entry.messages) ? entry.messages.map(normalizeMessage)
    .filter((message): message is ChatMessage => Boolean(message))
    .map((message) => staleActiveRun && message.status === "running" ? { ...message, text: "Interrupted when Keelhouse last closed.", status: "error" as const } : message) : [];
  const updatedAt = typeof entry.updatedAt === "number" && Number.isFinite(entry.updatedAt) ? entry.updatedAt : messages[messages.length - 1]?.timestamp ?? Date.now();
  return [key, {
    provider: entry.provider === "claude" || entry.provider === "opencode" ? entry.provider : "codex",
    providerThreadId: textValue(entry.providerThreadId) || undefined,
    activeRunId: undefined,
    messages, updatedAt,
    revision: nonNegativeInteger(entry.revision) + (staleActiveRun ? 1 : 0),
    runStatus: normalizeRunStatus(entry.runStatus, staleActiveRun),
    usage: normalizeUsage(entry.usage),
    fork: normalizeForkLineage(entry.fork),
  }] as const;
};

export const normalizeChatConversationRecords = (value: unknown): ChatConversationRecords => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) =>
    key.trim() && isRecord(entry) ? [normalizeRecordEntry(key, entry)] : []));
};
