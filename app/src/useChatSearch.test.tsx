// @vitest-environment jsdom

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useChatSearch } from "./useChatSearch";

const result = {
  bookmarked: false,
  chatId: "chat-1",
  messageId: "message-1",
  projectPath: "/workspace",
  role: "assistant" as const,
  sessionId: "session-1",
  snippet: "Matching message",
  timestamp: 1,
};

describe("useChatSearch", () => {
  it("searches an open palette after the debounce", async () => {
    const search = vi.fn().mockResolvedValue([result]);
    const { result: hook } = renderHook(() => useChatSearch({
      delayMs: 0,
      open: true,
      query: "matching",
      search,
    }));

    await waitFor(() => expect(hook.current.results).toEqual([result]));

    expect(search).toHaveBeenCalledWith("matching");
    expect(hook.current.loading).toBe(false);
    expect(hook.current.error).toBeNull();
  });

  it("does not search a query shorter than two characters", async () => {
    const search = vi.fn();
    const { result: hook } = renderHook(() => useChatSearch({
      delayMs: 0,
      open: true,
      query: "a",
      search,
    }));

    await waitFor(() => expect(hook.current.loading).toBe(false));
    expect(hook.current.results).toEqual([]);
    expect(search).not.toHaveBeenCalled();
  });
});
