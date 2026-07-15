// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMcpOAuthStatus, type McpOAuthStatusSubscriber } from "./useMcpOAuthStatus";

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
});
