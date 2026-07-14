import type { AgentActivityEvent } from "./agentActivity";
import type { ChatMessage } from "./chatConversation";

export type RunCardProvenance = "provider" | "app-action" | "agent-hook";
export type RunCardKind = "thinking" | "plan" | "file" | "approval" | "command" | "tool";

export type RunCard = {
  id: string;
  provenance: RunCardProvenance;
  kind: RunCardKind;
  title: string;
  detail: string;
  status: "running" | "complete" | "error";
  targets: string[];
};

export const isRunCardProvenance = (value: unknown): value is RunCardProvenance =>
  value === "provider" || value === "app-action" || value === "agent-hook";

export const isRunCardKind = (value: unknown): value is RunCardKind =>
  value === "thinking" || value === "plan" || value === "file" || value === "approval" || value === "command" || value === "tool";

const normalizeTargets = (value: unknown): string[] => Array.isArray(value)
  ? Array.from(new Set(value.filter((target): target is string => typeof target === "string" && Boolean(target.trim())).map((target) => target.trim())))
  : [];

export const runCardFromChatMessage = (message: ChatMessage): RunCard | null => {
  if (message.role !== "tool" || !isRunCardProvenance(message.provenance) || !isRunCardKind(message.runCardKind)) return null;
  return {
    id: message.id,
    provenance: message.provenance,
    kind: message.runCardKind,
    title: message.title ?? "Activity",
    detail: message.text,
    status: message.status === "running" || message.status === "error" ? message.status : "complete",
    targets: normalizeTargets(message.targets),
  };
};

export const runCardFromActivityEvent = (event: AgentActivityEvent): RunCard | null => {
  if (!isRunCardProvenance(event.provenance) || !isRunCardKind(event.runCardKind)) return null;
  return {
    id: event.id,
    provenance: event.provenance,
    kind: event.runCardKind,
    title: event.label,
    detail: event.detail ?? "",
    status: event.status === "running" || event.status === "waiting" || event.status === "thinking"
      ? "running"
      : event.status === "error" || event.status === "exited"
        ? "error"
        : "complete",
    targets: normalizeTargets(event.targets),
  };
};
