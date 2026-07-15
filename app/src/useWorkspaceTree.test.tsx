// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useWorkspaceTree } from "./useWorkspaceTree";

const response = {
  nodes: [{ id: "/workspace/src", kind: "directory" as const, name: "src", path: "/workspace/src" }],
  root: "/workspace",
  truncated: false,
};

describe("useWorkspaceTree", () => {
  it("loads the workspace tree and refreshes on demand", async () => {
    const readTree = vi.fn().mockResolvedValue(response);
    const onRootResolved = vi.fn();
    const { result } = renderHook(() => useWorkspaceTree({
      onClearWorkspace: vi.fn(), onRootResolved, readTree, workspacePath: "/workspace",
    }));
    await waitFor(() => expect(result.current.tree).toEqual(response.nodes));

    act(() => result.current.refresh());
    await waitFor(() => expect(readTree).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(onRootResolved).toHaveBeenLastCalledWith("/workspace");
    expect(result.current.error).toBeNull();
  });

  it("clears tree state when there is no workspace", async () => {
    const onClearWorkspace = vi.fn();
    const readTree = vi.fn();
    const { result } = renderHook(() => useWorkspaceTree({
      onClearWorkspace, onRootResolved: vi.fn(), readTree, workspacePath: null,
    }));

    await waitFor(() => expect(onClearWorkspace).toHaveBeenCalledOnce());
    expect(result.current.tree).toEqual([]);
    expect(result.current.truncated).toBe(false);
  });
});
