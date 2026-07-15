import type { ChatConversation, ChatRunEnvelope } from "./chatConversationTypes";
import { appendItemDelta, appendProviderActivityDelta, providerItemMessage } from "./chatProviderMessages";
import { chatProviderLabel, completeRunningStatus, pushChatMessage, upsertChatItemMessage } from "./chatConversationMutations";
import { isRecord, messageId, normalizeUsage, textValue } from "./chatConversationValues";

type EventContext = { envelope: ChatRunEnvelope; event: Record<string, unknown>; params: Record<string, unknown>; eventType: string; now: number };
type Reduction = ChatConversation | undefined;

const reduceLifecycle = (conversation: ChatConversation, envelope: ChatRunEnvelope, now: number) => {
  if (!isRecord(envelope.event) || textValue(envelope.event.type) !== "run.completed") return conversation;
  if (conversation.activeRunId !== envelope.runId) return conversation;
  const exitCode = typeof envelope.event.exitCode === "number" ? envelope.event.exitCode : 1;
  const completed = completeRunningStatus(conversation, now);
  if (exitCode === 0) return completed;
  return pushChatMessage({ ...completed, runStatus: "error" }, {
    id: messageId("error", now, envelope.runId), role: "error",
    text: textValue(envelope.event.message) || `${chatProviderLabel(conversation.provider)} exited with status ${exitCode}.`,
    status: "error", timestamp: now,
  });
};

const reduceProviderEvents = (conversation: ChatConversation, context: EventContext): Reduction => {
  const { envelope, event, params, eventType, now } = context;
  if (eventType === "thread.started") {
    const providerThreadId = textValue(event.thread_id);
    return providerThreadId ? { ...conversation, providerThreadId, updatedAt: now } : conversation;
  }
  if (eventType === "thread/started") {
    const thread = isRecord(params.thread) ? params.thread : null;
    const providerThreadId = thread ? textValue(thread.id) : "";
    return providerThreadId ? { ...conversation, providerThreadId, updatedAt: now } : conversation;
  }
  if (eventType === "provider.thinking.delta") return appendProviderActivityDelta(conversation, envelope.runId, "provider-thinking", "Thinking", textValue(event.delta), now);
  if (eventType === "provider.compaction") return pushChatMessage(conversation, {
    id: messageId("tool", now, `${envelope.runId}-compaction`), role: "tool", title: "Compacted context",
    text: textValue(event.summary) || "Context compacted", itemId: `${envelope.runId}:provider-compaction`,
    status: "complete", timestamp: now, provenance: "provider", runCardKind: "tool",
  });
  if (eventType !== "provider.question" && eventType !== "provider.plan.updated") return undefined;
  const plan = eventType === "provider.plan.updated";
  const itemKey = textValue(event.toolId) || (plan ? "provider-plan" : "provider-question");
  const text = plan ? JSON.stringify(event.plan ?? {}, null, 2) : isRecord(event.input) ? JSON.stringify(event.input, null, 2) : "Question requested";
  return upsertChatItemMessage(conversation, {
    id: messageId("tool", now, `${envelope.runId}-${plan ? "plan" : "question"}`), role: "tool",
    title: plan ? "Updated plan" : "Question", text, itemId: `${envelope.runId}:${itemKey}`,
    status: "complete", timestamp: now, provenance: "provider", runCardKind: plan ? "plan" : "tool",
  });
};

const reduceItemEvents = (conversation: ChatConversation, context: EventContext): Reduction => {
  const { envelope, event, params, eventType, now } = context;
  if (["item.started", "item.completed", "item/started", "item/completed"].includes(eventType)) {
    const source = eventType.includes("/") ? params : event;
    const item = isRecord(source.item) ? source.item : null;
    const normalizedType = eventType === "item/started" ? "item.started" : eventType === "item/completed" ? "item.completed" : eventType;
    const message = item ? providerItemMessage(item, normalizedType, now, envelope.runId) : null;
    return message ? upsertChatItemMessage(conversation, message) : conversation;
  }
  if (eventType === "item/agentMessage/delta") return appendItemDelta(conversation, envelope.runId, textValue(params.itemId), textValue(params.delta), "assistant", now);
  if (eventType === "item/commandExecution/outputDelta" || eventType === "item/fileChange/outputDelta") {
    return appendItemDelta(conversation, envelope.runId, textValue(params.itemId), textValue(params.delta), "tool", now, eventType.includes("fileChange") ? "file" : "command");
  }
  return undefined;
};

const approvalRequestTitle = (eventType: string) => eventType.includes("commandExecution")
  ? "Command approval" : eventType.includes("fileChange") ? "File change approval" : "Permission approval";

const reduceApprovalRequest = (conversation: ChatConversation, context: EventContext): Reduction => {
  const { envelope, event, params, eventType, now } = context;
  if (!["item/commandExecution/requestApproval", "item/fileChange/requestApproval", "item/permissions/requestApproval"].includes(eventType)) return undefined;
  const requestId = typeof event.id === "number" ? event.id : -1;
  if (requestId < 0) return conversation;
  const details = [textValue(params.command), textValue(params.grantRoot) && `Target: ${textValue(params.grantRoot)}`, textValue(params.cwd) && `Working directory: ${textValue(params.cwd)}`, textValue(params.reason)].filter(Boolean).join("\n");
  return upsertChatItemMessage(conversation, {
    id: messageId("approval", now, `${envelope.runId}-${requestId}`), role: "tool", title: approvalRequestTitle(eventType),
    text: details || `${chatProviderLabel(conversation.provider)} requested permission to continue.`,
    itemId: `${envelope.runId}:approval-${requestId}`, status: "running", timestamp: now,
    approvalRequestId: requestId, approvalMethod: eventType, approvalRunId: envelope.runId,
    provenance: "provider", runCardKind: "approval",
  });
};

const reduceApprovalResolution = (conversation: ChatConversation, context: EventContext): Reduction => {
  const { envelope, event, eventType, now } = context;
  if (eventType !== "approval.resolved") return undefined;
  const requestId = typeof event.requestId === "number" ? event.requestId : -1;
  const index = conversation.messages.findIndex((message) => message.approvalRequestId === requestId && (!message.approvalRunId || message.approvalRunId === envelope.runId));
  if (index < 0) return conversation;
  const decision = textValue(event.decision);
  const resolution = textValue(event.resolution);
  const approved = decision === "accept" || decision === "acceptForSession";
  const decisionLabel = decision === "acceptForSession" ? "Allow for session" : decision === "accept" ? "Allow once" : decision === "cancel" ? "Canceled" : "Deny";
  const resolutionLabel = resolution === "timeout" ? "timeout" : resolution === "runClosed" ? "run closed" : "user";
  const messages = [...conversation.messages];
  messages[index] = {
    ...messages[index], title: approved ? "Approved" : "Denied",
    text: `${messages[index].text}\n\nDecision: ${decisionLabel} · ${resolutionLabel}`,
    status: approved ? "complete" : "error", timestamp: now,
    approvalDecision: decision === "accept" || decision === "acceptForSession" || decision === "decline" || decision === "cancel" ? decision : undefined,
    approvalResolution: resolution === "timeout" || resolution === "runClosed" ? resolution : "user",
    approvalRunId: envelope.runId, approvalResolvedAt: now,
  };
  return { ...conversation, messages, updatedAt: now };
};

const failedTurn = (conversation: ChatConversation, context: EventContext, message: string) =>
  pushChatMessage({ ...completeRunningStatus(conversation, context.now), runStatus: "error" }, {
    id: messageId("error", context.now, context.envelope.runId), role: "error", text: message,
    status: "error", timestamp: context.now,
  });

const reduceTurnEvents = (conversation: ChatConversation, context: EventContext): Reduction => {
  const { event, params, eventType, now } = context;
  if (eventType === "turn.failed") {
    const error = isRecord(event.error) ? textValue(event.error.message) : `${chatProviderLabel(conversation.provider)} could not complete this turn.`;
    return failedTurn(conversation, context, error);
  }
  if (eventType === "turn.completed") return { ...completeRunningStatus(conversation, now), usage: normalizeUsage(event.usage) ?? conversation.usage };
  if (eventType === "thread/tokenUsage/updated") {
    const tokenUsage = isRecord(params.tokenUsage) ? params.tokenUsage : null;
    const total = tokenUsage && isRecord(tokenUsage.total) ? tokenUsage.total : null;
    return total ? { ...conversation, usage: normalizeUsage(total) ?? conversation.usage } : conversation;
  }
  if (eventType !== "turn/completed") return undefined;
  const turn = isRecord(params.turn) ? params.turn : null;
  const status = turn ? textValue(turn.status) : "completed";
  const completed = completeRunningStatus(conversation, now);
  if (status === "interrupted") return { ...completed, runStatus: "interrupted", messages: completed.messages.map((message) => message.role === "status" && message.text === "Completed" ? { ...message, text: "Stopped" } : message) };
  if (status === "failed") {
    const error = turn && isRecord(turn.error) ? textValue(turn.error.message) : `${chatProviderLabel(conversation.provider)} could not complete this turn.`;
    return failedTurn(conversation, context, error);
  }
  return completed;
};

export const applyChatRunEnvelope = (conversation: ChatConversation, envelope: ChatRunEnvelope, now = Date.now()): ChatConversation => {
  if (envelope.stream === "lifecycle") return reduceLifecycle(conversation, envelope, now);
  if (envelope.stream !== "stdout" || !isRecord(envelope.event)) return conversation;
  const event = envelope.event;
  const params = isRecord(event.params) ? event.params : event;
  const context = { envelope, event, params, eventType: textValue(event.type) || textValue(event.method), now };
  return reduceProviderEvents(conversation, context)
    ?? reduceItemEvents(conversation, context)
    ?? reduceApprovalRequest(conversation, context)
    ?? reduceApprovalResolution(conversation, context)
    ?? reduceTurnEvents(conversation, context)
    ?? conversation;
};
