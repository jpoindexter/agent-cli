import type { ChatConversation, ChatMessage } from "./chatConversationTypes";
import { pushChatMessage } from "./chatConversationMutations";
import { isRecord, messageId, textValue } from "./chatConversationValues";

const commandText = (item: Record<string, unknown>) => {
  const command = textValue(item.command) || "Command";
  const output = textValue(item.aggregatedOutput ?? item.aggregated_output).trim();
  return output ? `${command}\n\n${output}` : command;
};

const toolCallMessage = (item: Record<string, unknown>, itemId: string | undefined, running: boolean, now: number): ChatMessage => {
  const type = textValue(item.type);
  const name = textValue(item.tool) || textValue(item.query) || type.replace(/_/g, " ");
  const output = textValue(item.aggregatedOutput ?? item.aggregated_output).trim();
  const input = isRecord(item.input) ? JSON.stringify(item.input, null, 2) : "";
  const plan = name === "TodoWrite" || name === "update_plan";
  const title = name === "AskUserQuestion" ? "Question" : plan ? "Updated plan" : running ? `Using ${name}` : `Used ${name}`;
  return {
    id: messageId("tool", now, itemId), role: "tool", title, text: output || input || name, itemId,
    status: running ? "running" : textValue(item.status) === "failed" ? "error" : "complete",
    timestamp: now, provenance: "provider", runCardKind: plan ? "plan" : "tool",
  };
};

const fileChangeMessage = (item: Record<string, unknown>, itemId: string | undefined, running: boolean, now: number): ChatMessage => {
  const changes = Array.isArray(item.changes) ? item.changes.flatMap((change) => isRecord(change) ? [textValue(change.path)].filter(Boolean) : []) : [];
  return {
    id: messageId("tool", now, itemId), role: "tool", title: running ? "Editing files" : "Edited files",
    text: changes.length > 0 ? changes.join("\n") : "Workspace files changed", itemId,
    status: running ? "running" : "complete", timestamp: now, provenance: "provider", runCardKind: "file", targets: changes,
  };
};

export const providerItemMessage = (item: Record<string, unknown>, eventType: string, now: number, runId: string): ChatMessage | null => {
  const type = textValue(item.type);
  const itemId = textValue(item.id) ? `${runId}:${textValue(item.id)}` : undefined;
  const running = eventType === "item.started";
  if (type === "agent_message" || type === "agentMessage") {
    const text = textValue(item.text).trim();
    return text ? { id: messageId("assistant", now, itemId), role: "assistant", text, itemId, status: running ? "running" : "complete", timestamp: now } : null;
  }
  if (type === "command_execution" || type === "commandExecution") return {
    id: messageId("tool", now, itemId), role: "tool", title: running ? "Running command" : textValue(item.status) === "failed" ? "Command failed" : "Ran command",
    text: commandText(item), itemId, status: running ? "running" : textValue(item.status) === "failed" ? "error" : "complete",
    timestamp: now, provenance: "provider", runCardKind: "command",
  };
  if (type === "file_change" || type === "fileChange") return fileChangeMessage(item, itemId, running, now);
  if (["mcp_tool_call", "mcpToolCall", "dynamicToolCall", "collabAgentToolCall", "web_search", "webSearch"].includes(type)) return toolCallMessage(item, itemId, running, now);
  if (type === "error") {
    const text = textValue(item.message).trim();
    return text ? { id: messageId("error", now, itemId), role: "error", text, itemId, status: "error", timestamp: now } : null;
  }
  return null;
};

export const appendItemDelta = (conversation: ChatConversation, runId: string, providerItemId: string, delta: string, kind: "assistant" | "tool", now: number, runCardKind?: "command" | "file") => {
  if (!providerItemId || !delta) return conversation;
  const itemId = `${runId}:${providerItemId}`;
  const index = conversation.messages.findIndex((message) => message.itemId === itemId);
  if (index < 0) return pushChatMessage(conversation, {
    id: messageId(kind, now, itemId), role: kind, title: runCardKind === "file" ? "Editing files" : kind === "tool" ? "Running command" : undefined,
    text: delta, itemId, status: "running", timestamp: now,
    ...(kind === "tool" && runCardKind ? { provenance: "provider" as const, runCardKind } : {}),
  });
  const messages = [...conversation.messages];
  const current = messages[index];
  const separator = kind === "tool" && current.text && !current.text.includes("\n\n") ? "\n\n" : "";
  messages[index] = { ...current, text: `${current.text}${separator}${delta}`, status: "running", timestamp: now };
  return { ...conversation, messages, updatedAt: now };
};

export const appendProviderActivityDelta = (conversation: ChatConversation, runId: string, providerItemId: string, title: string, delta: string, now: number) => {
  const itemId = `${runId}:${providerItemId}`;
  const index = conversation.messages.findIndex((message) => message.itemId === itemId);
  if (index < 0) return pushChatMessage(conversation, {
    id: messageId("tool", now, itemId), role: "tool", title, text: delta, itemId,
    status: "running", timestamp: now, provenance: "provider", runCardKind: "thinking",
  });
  const messages = [...conversation.messages];
  messages[index] = { ...messages[index], text: `${messages[index].text}${delta}`, timestamp: now };
  return { ...conversation, messages, updatedAt: now };
};
