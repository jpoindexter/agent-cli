// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_AI_CONNECTION_SETTINGS } from "./connectionSettings";
import {
  useMcpOAuthStatus,
  type ConnectionSecretServices,
  type McpOAuthStatusSubscriber,
} from "./useMcpOAuthStatus";

describe("useMcpOAuthStatus", () => {
  it("records connected status and removes the native listener", async () => {
    let emit: Parameters<McpOAuthStatusSubscriber>[0] = () => {};
    const remove = vi.fn();
    const subscribe: McpOAuthStatusSubscriber = vi.fn(async (handler) => {
      emit = handler;
      return remove;
    });
    const { result, unmount } = renderHook(() => useMcpOAuthStatus(subscribe));
    await waitFor(() => expect(subscribe).toHaveBeenCalledOnce());

    act(() => emit({ message: "Connected", serverId: "docs", state: "connected" }));

    expect(result.current.statuses.docs?.state).toBe("connected");
    expect(result.current.secretPresence["mcp:docs:oauth-tokens"]).toBe(true);
    unmount();
    expect(remove).toHaveBeenCalledOnce();
  });

  it("refreshes, saves, and deletes connection-secret presence", async () => {
    const subscribe: McpOAuthStatusSubscriber = async () => () => {};
    const services: ConnectionSecretServices = {
      deleteSecret: vi.fn(async (key) => ({ key, present: false })),
      readStatus: vi.fn(async (key) => ({ key, present: key === "provider:codex:api-key" })),
      saveSecret: vi.fn(async (key) => ({ key, present: true })),
    };
    const { result } = renderHook(() => useMcpOAuthStatus(subscribe, services));

    await act(() => result.current.refreshSecretPresence(DEFAULT_AI_CONNECTION_SETTINGS));
    await act(() => result.current.saveSecret("custom", "value"));
    await act(() => result.current.deleteSecret("custom"));

    expect(result.current.secretPresence["provider:codex:api-key"]).toBe(true);
    expect(result.current.secretPresence["provider:gemini:api-key"]).toBe(false);
    expect(result.current.secretPresence.custom).toBe(false);
  });
});
