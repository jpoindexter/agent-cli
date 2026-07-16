// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { emptyChatConversation } from "./chatConversation";
import { defaultComposerHarnessState } from "./composerHarness";
import { useComposerWorkspaceState } from "./useComposerWorkspaceState";

const createOptions = () => ({
  getRoot: vi.fn(() => "/repo" as string | null),
  getSessionId: vi.fn(() => "session-1" as string | null),
  saveStore: vi.fn(async () => undefined),
  setStoreValue: vi.fn(async () => undefined),
});

describe("useComposerWorkspaceState", () => {
  it("keeps chat conversation state and its imperative ref synchronized", () => {
    const options = createOptions();
    const { result } = renderHook(() => useComposerWorkspaceState(options));
    const conversations = { "/repo\nsession-1": emptyChatConversation(100) };

    act(() => result.current.setChatConversations(conversations));

    expect(result.current.chatConversations).toBe(conversations);
    expect(result.current.chatConversationsRef.current).toBe(conversations);
  });

  it("persists harness and scoped settings through the shared store", async () => {
    const options = createOptions();
    const { result } = renderHook(() => useComposerWorkspaceState(options));
    const harness = { "/repo\nsession-1": defaultComposerHarnessState("claude") };
    const scoped = {
      ...result.current.scopedSettings,
      global: { ...result.current.scopedSettings.global, agentProfileId: "claude" },
    };

    await act(async () => {
      await result.current.persistComposerHarnessRecords(harness);
      await result.current.persistScopedSettings(scoped);
    });

    expect(result.current.composerHarnessBySessionRef.current).toBe(harness);
    expect(result.current.scopedSettingsRef.current).toBe(scoped);
    expect(options.setStoreValue).toHaveBeenNthCalledWith(1, "composerHarnessBySession", harness);
    expect(options.setStoreValue).toHaveBeenNthCalledWith(2, "scopedSettings", scoped);
    expect(options.saveStore).toHaveBeenCalledTimes(2);
  });

  it("sets and clears a chat-scoped override for the active session", async () => {
    const options = createOptions();
    const { result } = renderHook(() => useComposerWorkspaceState(options));

    await act(async () => {
      await expect(result.current.updateScopedSetting(
        "chat", "approvalMode", "fullAccess",
      )).resolves.toBe(true);
    });
    expect(result.current.scopedSettings.chats["/repo\nsession-1"]?.approvalMode)
      .toBe("fullAccess");

    await act(async () => {
      await expect(result.current.clearScopedSetting("chat", "approvalMode"))
        .resolves.toBe(true);
    });
    expect(result.current.scopedSettings.chats["/repo\nsession-1"]).toBeUndefined();
  });
});
