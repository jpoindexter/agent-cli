import type { ChatUsage } from "./chatConversationTypes";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null;

export const textValue = (value: unknown): string => typeof value === "string" ? value : "";

export const messageId = (prefix: string, timestamp: number, suffix = "") =>
  `${prefix}-${Math.max(0, Math.floor(timestamp)).toString(36)}${suffix ? `-${suffix}` : ""}`;

export const nonNegativeInteger = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

export const normalizeUsage = (value: unknown): ChatUsage | undefined => {
  if (!isRecord(value)) return undefined;
  return {
    inputTokens: nonNegativeInteger(value.inputTokens ?? value.input_tokens),
    cachedInputTokens: nonNegativeInteger(value.cachedInputTokens ?? value.cached_input_tokens),
    outputTokens: nonNegativeInteger(value.outputTokens ?? value.output_tokens),
  };
};
