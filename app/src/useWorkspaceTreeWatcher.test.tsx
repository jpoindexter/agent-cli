// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useWorkspaceTreeWatcher, type WorkspaceTreeSubscriber } from "./useWorkspaceTreeWatcher";

describe("useWorkspaceTreeWatcher", () => {
  it("refreshes only the active root and removes the listener", async () => {
    let emit: Parameters<WorkspaceTreeSubscriber>[0] = () => {};
    const remove = vi.fn();
    const subscribe: WorkspaceTreeSubscriber = vi.fn(async (handler) => { emit = handler; return remove; });
    const onChange = vi.fn();
    const watch = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() => useWorkspaceTreeWatcher({
      getActiveRoot: () => "/workspace", onChange, onError: vi.fn(),
      subscribe, watch, workspacePath: "/workspace",
    }));
    await waitFor(() => expect(subscribe).toHaveBeenCalledOnce());
    await waitFor(() => expect(watch).toHaveBeenCalledWith("/workspace"));

    act(() => emit({ count: 1, root: "/other" }));
    act(() => emit({ count: 2, root: "/workspace" }));

    expect(onChange).toHaveBeenCalledOnce();
    unmount();
    expect(remove).toHaveBeenCalledOnce();
  });
});
